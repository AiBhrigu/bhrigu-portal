#!/usr/bin/env python3
import argparse, base64, hashlib, json, os, re, sqlite3, subprocess, tempfile, uuid
from datetime import datetime, timezone
from pathlib import Path

PROTOCOL_VERSION="bhrigu-donation-bridge-v1"
PROVISION_PATH="/api/donation/bridge/provision"
OBSERVE_PATH="/api/donation/bridge/observe"
ADDRESS_RE=re.compile(r"^(?:bc1[ac-hj-np-z02-9]{20,90}|[13][1-9A-HJ-NP-Za-km-z]{20,60})$",re.I)
TXID_RE=re.compile(r"^[a-f0-9]{64}$")
OUTBOUND_PROVISION_CLASSIFICATIONS=('PROVISIONED','INTEGRATION_PROVISIONED')

def now_iso(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def canonical(v):
    if isinstance(v,dict): return {k:canonical(v[k]) for k in sorted(v)}
    if isinstance(v,list): return [canonical(x) for x in v]
    return v
def canonical_json(v): return json.dumps(canonical(v),ensure_ascii=False,separators=(',',':'))
def sha256_text(s): return hashlib.sha256(s.encode()).hexdigest()
def payload_hash(payload): return sha256_text(canonical_json(payload))

def config():
    required=['ELECTRUM_CLI','ELECTRUM_WALLET','DONATION_BRIDGE_BASE_URL','DONATION_BRIDGE_PRIVATE_KEY_FILE','DONATION_BRIDGE_KEY_ID','DONATION_BRIDGE_STATE_DB']
    missing=[k for k in required if not os.environ.get(k)]
    if missing: raise SystemExit('missing_required_configuration')
    return {k:os.environ[k] for k in required}|{'TOR_SOCKS':os.environ.get('TOR_SOCKS','127.0.0.1:19050')}

def init_db(path):
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True); os.chmod(p.parent,0o700)
    db=sqlite3.connect(path)
    db.executescript("""
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS addresses(
      receiver_address_id TEXT PRIMARY KEY,
      receive_address TEXT NOT NULL UNIQUE,
      classification TEXT NOT NULL,
      provisioned_at TEXT NOT NULL,
      bridge_message_id TEXT NOT NULL UNIQUE,
      delivery_status TEXT NOT NULL CHECK(delivery_status IN ('queued','delivered'))
    );
    CREATE TABLE IF NOT EXISTS observations(
      event_key TEXT PRIMARY KEY,
      message_id TEXT NOT NULL UNIQUE,
      payload_json TEXT NOT NULL,
      delivery_status TEXT NOT NULL CHECK(delivery_status IN ('queued','delivered')),
      created_at TEXT NOT NULL
    );
    """)
    db.commit(); return db

def run_electrum(cfg,*args):
    cmd=[cfg['ELECTRUM_CLI'],'-w',cfg['ELECTRUM_WALLET'],*args]
    p=subprocess.run(cmd,text=True,capture_output=True,timeout=90)
    text=(p.stdout or '').strip()
    if p.returncode or 'Invalid Request' in text or 'Error:' in text or 'Traceback' in (p.stderr or ''):
        raise RuntimeError('electrum_command_unavailable')
    try: return json.loads(text)
    except Exception: return text.strip('"')

def next_fresh_address(cfg,db):
    used={r[0] for r in db.execute('SELECT receive_address FROM addresses')}
    address=run_electrum(cfg,'createnewaddress')
    if not isinstance(address,str) or not ADDRESS_RE.fullmatch(address): raise RuntimeError('electrum_mainnet_address_invalid')
    if address in used: raise RuntimeError('electrum_address_already_bound')
    if run_electrum(cfg,'ismine',address) is not True: raise RuntimeError('electrum_address_not_mine')
    return address

def make_envelope(cfg,kind,path,payload,message_id=None,created_at=None):
    created_at=created_at or now_iso(); message_id=message_id or f'don-bridge-{uuid.uuid4()}'
    return {'protocolVersion':PROTOCOL_VERSION,'keyId':cfg['DONATION_BRIDGE_KEY_ID'],'messageId':message_id,
      'messageKind':kind,'createdAt':created_at,'httpMethod':'POST','requestPath':path,
      'payloadHash':payload_hash(payload),'payload':payload}

def sign_envelope(cfg,envelope):
    key=Path(cfg['DONATION_BRIDGE_PRIVATE_KEY_FILE'])
    if not key.exists() or (key.stat().st_mode & 0o077): raise RuntimeError('bridge_private_key_permissions_invalid')
    with tempfile.NamedTemporaryFile('wb',delete=False) as f:
        os.chmod(f.name,0o600); f.write(canonical_json(envelope).encode()); message_path=f.name
    try:
        p=subprocess.run(['openssl','pkeyutl','-sign','-rawin','-inkey',str(key),'-in',message_path],capture_output=True,timeout=15)
        if p.returncode or len(p.stdout)!=64: raise RuntimeError('bridge_signing_failed')
        return base64.b64encode(p.stdout).decode()
    finally: Path(message_path).unlink(missing_ok=True)

def deliver(cfg,path,envelope,signature):
    base=cfg['DONATION_BRIDGE_BASE_URL'].rstrip('/')
    if not base.startswith('https://'): raise RuntimeError('bridge_https_required')
    with tempfile.NamedTemporaryFile('w',delete=False,encoding='utf-8') as f:
        os.chmod(f.name,0o600); f.write(canonical_json(envelope)); body=f.name
    try:
        cmd=['curl','--fail-with-body','--silent','--show-error','--socks5-hostname',cfg['TOR_SOCKS'],
          '-H','content-type: application/json','-H',f"x-bhrigu-donation-bridge-key-id: {cfg['DONATION_BRIDGE_KEY_ID']}",
          '-H',f"x-bhrigu-donation-bridge-signature: {signature}",'-X','POST','--data-binary',f'@{body}',base+path]
        p=subprocess.run(cmd,text=True,capture_output=True,timeout=90)
        if p.returncode: raise RuntimeError('bridge_https_delivery_failed')
        result=json.loads(p.stdout)
        if result.get('ok') is not True: raise RuntimeError('bridge_https_rejected')
        return result
    finally: Path(body).unlink(missing_ok=True)

def flush_queued(cfg,db):
    for receiver_id,address,classification,provisioned_at,message_id in db.execute(
        "SELECT receiver_address_id,receive_address,classification,provisioned_at,bridge_message_id FROM addresses WHERE delivery_status='queued' AND classification IN (?,?) ORDER BY provisioned_at,receiver_address_id",
        OUTBOUND_PROVISION_CLASSIFICATIONS
    ).fetchall():
        payload={'receiverAddressId':receiver_id,'receiveAddress':address,'createdAt':provisioned_at}
        envelope=make_envelope(cfg,'address_provision',PROVISION_PATH,payload,message_id,provisioned_at)
        deliver(cfg,PROVISION_PATH,envelope,sign_envelope(cfg,envelope))
        db.execute("UPDATE addresses SET delivery_status='delivered' WHERE receiver_address_id=?",(receiver_id,)); db.commit()
    for event_key,message_id,payload_json,created_at in db.execute(
        "SELECT event_key,message_id,payload_json,created_at FROM observations WHERE delivery_status='queued' ORDER BY created_at,event_key"
    ).fetchall():
        payload=json.loads(payload_json)
        envelope=make_envelope(cfg,'receipt_observation',OBSERVE_PATH,payload,message_id,created_at)
        deliver(cfg,OBSERVE_PATH,envelope,sign_envelope(cfg,envelope))
        db.execute("UPDATE observations SET delivery_status='delivered' WHERE event_key=?",(event_key,)); db.commit()

def provision(cfg,db,classification,send):
    if send: flush_queued(cfg,db)
    address=next_fresh_address(cfg,db); receiver_id=f'don_addr_{uuid.uuid4().hex}'; created=now_iso(); message_id=f'don-provision-{uuid.uuid4()}'
    db.execute('INSERT INTO addresses VALUES(?,?,?,?,?,?)',(receiver_id,address,classification,created,message_id,'queued')); db.commit()
    payload={'receiverAddressId':receiver_id,'receiveAddress':address,'createdAt':created}
    envelope=make_envelope(cfg,'address_provision',PROVISION_PATH,payload,message_id,created)
    if send:
        deliver(cfg,PROVISION_PATH,envelope,sign_envelope(cfg,envelope))
        db.execute("UPDATE addresses SET delivery_status='delivered' WHERE receiver_address_id=?",(receiver_id,)); db.commit()
    print('PROVISION_RESULT=RECORDED'); print('CLASSIFICATION='+classification); print('ADDRESS_PUBLICATION=NO')

def decode_tx_outputs(cfg,txid):
    raw=run_electrum(cfg,'gettransaction',txid)
    if not isinstance(raw,str): raise RuntimeError('raw_transaction_invalid')
    decoded=run_electrum(cfg,'deserialize',raw); outputs=decoded.get('outputs') if isinstance(decoded,dict) else None
    if not isinstance(outputs,list): raise RuntimeError('decoded_outputs_invalid')
    return outputs

def scan(cfg,db,send):
    if send: flush_queued(cfg,db)
    rows=db.execute("SELECT receiver_address_id,receive_address FROM addresses WHERE delivery_status='delivered' AND classification IN (?,?)",OUTBOUND_PROVISION_CLASSIFICATIONS).fetchall(); queued=0
    for receiver_id,address in rows:
        history=run_electrum(cfg,'getaddresshistory',address)
        if not isinstance(history,list): raise RuntimeError('address_history_invalid')
        for item in history:
            txid=(item or {}).get('tx_hash') if isinstance(item,dict) else None; height=(item or {}).get('height') if isinstance(item,dict) else None
            if not isinstance(txid,str) or not TXID_RE.fullmatch(txid): continue
            outputs=decode_tx_outputs(cfg,txid); status=run_electrum(cfg,'get_tx_status',txid); conf=int(status.get('confirmations',0)) if isinstance(status,dict) else 0
            if conf == 0 and isinstance(height,int) and height > 0:
                # Electrum server has reported a mined candidate but wallet SPV has not verified it yet.
                # Do not mislabel this as mempool_seen; wait for wallet verification.
                continue
            for vout,out in enumerate(outputs):
                if not isinstance(out,dict) or out.get('address')!=address: continue
                sats=out.get('value_sats')
                if not isinstance(sats,int) or sats<=0: continue
                spv=conf>0; block_height=str(height) if spv and isinstance(height,int) and height>0 else None
                payload={'receiverAddressId':receiver_id,'txid':txid,'txVout':vout,'observedSats':str(sats),'confirmations':conf if spv else 0,
                  'blockHeight':block_height,'blockHash':None,'observedAt':now_iso(),'spvVerified':spv}
                event_key=sha256_text(canonical_json({k:payload[k] for k in ('receiverAddressId','txid','txVout','observedSats','confirmations','blockHeight','spvVerified')})); message_id='don-observe-'+event_key[:40]
                if db.execute('SELECT 1 FROM observations WHERE event_key=?',(event_key,)).fetchone(): continue
                message_created=now_iso()
                db.execute('INSERT INTO observations VALUES(?,?,?,?,?)',(event_key,message_id,canonical_json(payload),'queued',message_created)); db.commit(); queued+=1
                envelope=make_envelope(cfg,'receipt_observation',OBSERVE_PATH,payload,message_id,message_created)
                if send:
                    deliver(cfg,OBSERVE_PATH,envelope,sign_envelope(cfg,envelope)); db.execute("UPDATE observations SET delivery_status='delivered' WHERE event_key=?",(event_key,)); db.commit()
    print('OBSERVATION_EVENTS_QUEUED='+str(queued)); print('SPV_AUTHORITY=ELECTRUM_WALLET_GET_TX_STATUS')

def main():
    ap=argparse.ArgumentParser(); sub=ap.add_subparsers(dest='cmd',required=True)
    p=sub.add_parser('provision'); p.add_argument('--classification',choices=['PROVISIONED','INTEGRATION_PROVISIONED','TEST_PROVISIONED'],default='PROVISIONED'); p.add_argument('--deliver',action='store_true')
    s=sub.add_parser('scan'); s.add_argument('--deliver',action='store_true')
    sub.add_parser('flush')
    args=ap.parse_args(); cfg=config(); db=init_db(cfg['DONATION_BRIDGE_STATE_DB'])
    try:
        if args.cmd=='provision': provision(cfg,db,args.classification,args.deliver)
        elif args.cmd=='scan': scan(cfg,db,args.deliver)
        else: flush_queued(cfg,db); print('QUEUED_DELIVERY_FLUSH=PASS')
    finally: db.close()
if __name__=='__main__': main()
