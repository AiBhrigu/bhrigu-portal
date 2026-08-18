#!/usr/bin/env python3
import argparse, base64, fcntl, hashlib, json, os, re, sqlite3, subprocess, tempfile, uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

PROTOCOL_VERSION="bhrigu-donation-bridge-v1"
PROVISION_PATH="/api/donation/bridge/provision"
OBSERVE_PATH="/api/donation/bridge/observe"
CAPACITY_PATH="/api/donation/bridge/capacity"
SUPERVISOR_CLASSIFICATION="PUBLIC_SUPPORT_ELIGIBLE"
DERIVATION_LOCK_FILENAME=".btc-donation-receiver-derivation.lock"
DERIVATION_AMBIGUITY_FILENAME=".btc-donation-receiver-derivation-ambiguity"
UTC_ISO_RE=re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|\+00:00)$")
ADDRESS_RE=re.compile(r"^(?:bc1[ac-hj-np-z02-9]{20,90}|[13][1-9A-HJ-NP-Za-km-z]{20,60})$",re.I)
TXID_RE=re.compile(r"^[a-f0-9]{64}$")
OUTBOUND_PROVISION_CLASSIFICATIONS=('PROVISIONED','INTEGRATION_PROVISIONED','PUBLIC_SUPPORT_ELIGIBLE')
POST_RECEIPT_OBSERVE_ONLY_CLASSIFICATIONS=('PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY','INTEGRATION_PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY','PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY')
OBSERVATION_CLASSIFICATIONS=OUTBOUND_PROVISION_CLASSIFICATIONS+POST_RECEIPT_OBSERVE_ONLY_CLASSIFICATIONS
POST_RECEIPT_CLASSIFICATION={'PROVISIONED':'PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY','INTEGRATION_PROVISIONED':'INTEGRATION_PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY','PUBLIC_SUPPORT_ELIGIBLE':'PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY'}

def require_outbound_provision_classification(classification):
    if classification not in OUTBOUND_PROVISION_CLASSIFICATIONS:
        raise RuntimeError('outbound_provision_classification_forbidden')

def require_current_outbound_address(db,receiver_address_id):
    row=db.execute('SELECT classification FROM addresses WHERE receiver_address_id=? LIMIT 1',(receiver_address_id,)).fetchone()
    if not row: raise RuntimeError('outbound_address_missing')
    require_outbound_provision_classification(row[0])
    return row[0]

def require_observation_address(db,receiver_address_id):
    row=db.execute('SELECT classification FROM addresses WHERE receiver_address_id=? LIMIT 1',(receiver_address_id,)).fetchone()
    if not row: raise RuntimeError('observation_address_missing')
    if row[0] not in OBSERVATION_CLASSIFICATIONS: raise RuntimeError('observation_address_classification_forbidden')
    return row[0]

def terminalize_public_provision(db,receiver_address_id):
    classification=require_observation_address(db,receiver_address_id)
    terminal=POST_RECEIPT_CLASSIFICATION.get(classification)
    if terminal:
        db.execute('UPDATE addresses SET classification=? WHERE receiver_address_id=?',(terminal,receiver_address_id)); db.commit()
        return terminal
    return classification

def local_verified_block_hash(cfg,txid):
    try:
        wallet=json.loads(Path(cfg['ELECTRUM_WALLET']).read_text(encoding='utf-8'))
    except Exception as exc:
        raise RuntimeError('electrum_wallet_verified_state_unavailable') from exc
    verified=(wallet.get('verified_tx3') or {}).get(txid) if isinstance(wallet,dict) else None
    if not isinstance(verified,(list,tuple)) or len(verified)<4:
        raise RuntimeError('electrum_wallet_verified_tx_missing')
    height,wallet_header_hash=verified[0],verified[3]
    if not isinstance(height,int) or height<=0 or not isinstance(wallet_header_hash,str) or not TXID_RE.fullmatch(wallet_header_hash):
        raise RuntimeError('electrum_wallet_verified_tx_invalid')
    header_file=Path(cfg['ELECTRUM_WALLET']).parent.parent/'blockchain_headers'
    try:
        with header_file.open('rb') as f:
            f.seek(height*80); raw=f.read(80)
    except Exception as exc:
        raise RuntimeError('electrum_local_header_unavailable') from exc
    if len(raw)!=80 or not any(raw): raise RuntimeError('electrum_local_header_unavailable')
    local_hash=hashlib.sha256(hashlib.sha256(raw).digest()).digest()[::-1].hex()
    if local_hash!=wallet_header_hash: raise RuntimeError('electrum_local_header_hash_mismatch')
    return height,local_hash

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

def _supervisor_env_int(name,default,minimum,maximum):
    raw=os.environ.get(name,str(default)).strip()
    if not re.fullmatch(r'[0-9]+',raw): raise SystemExit('invalid_supervisor_configuration')
    value=int(raw)
    if value<minimum or value>maximum: raise SystemExit('invalid_supervisor_configuration')
    return value

def supervisor_settings():
    settings={
      'MIN_AVAILABLE':_supervisor_env_int('BTC_DONATION_SUPERVISOR_MIN_AVAILABLE',3,1,100000),
      'TARGET_AVAILABLE':_supervisor_env_int('BTC_DONATION_SUPERVISOR_TARGET_AVAILABLE',5,1,100000),
      'MAX_AVAILABLE':_supervisor_env_int('BTC_DONATION_SUPERVISOR_MAX_AVAILABLE',10,1,100000),
      'BATCH_SIZE_MAX':_supervisor_env_int('BTC_DONATION_SUPERVISOR_BATCH_SIZE_MAX',2,1,1000),
      'DERIVATION_BUDGET_WINDOW':_supervisor_env_int('BTC_DONATION_SUPERVISOR_DERIVATION_BUDGET_WINDOW',86400,60,604800),
      'DERIVATION_BUDGET_MAX':_supervisor_env_int('BTC_DONATION_SUPERVISOR_DERIVATION_BUDGET_MAX',20,1,100000),
    }
    if not (settings['MIN_AVAILABLE']<settings['TARGET_AVAILABLE']<=settings['MAX_AVAILABLE']):
        raise SystemExit('invalid_supervisor_configuration')
    if settings['BATCH_SIZE_MAX']>settings['MAX_AVAILABLE']:
        raise SystemExit('invalid_supervisor_configuration')
    return settings

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

@contextmanager
def derivation_lock(cfg):
    lock_path=Path(cfg['DONATION_BRIDGE_STATE_DB']).parent/DERIVATION_LOCK_FILENAME
    fd=os.open(lock_path,os.O_CREAT|os.O_RDWR,0o600)
    os.fchmod(fd,0o600)
    lock_file=os.fdopen(fd,'a+')
    try:
        try:
            fcntl.flock(lock_file.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError('derivation_lock_unavailable') from exc
        yield
    finally:
        try:
            fcntl.flock(lock_file.fileno(),fcntl.LOCK_UN)
        except OSError:
            pass
        lock_file.close()

def derivation_ambiguity_path(cfg):
    return Path(cfg['DONATION_BRIDGE_STATE_DB']).parent/DERIVATION_AMBIGUITY_FILENAME

def derivation_ambiguity_present(cfg):
    path=derivation_ambiguity_path(cfg)
    if not path.exists(): return False
    if not path.is_file(): raise RuntimeError('derivation_ambiguity_state_invalid')
    try:
        marker=json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        raise RuntimeError('derivation_ambiguity_state_invalid') from exc
    if not isinstance(marker,dict) or set(marker)!= {'markedAt','reason'}:
        raise RuntimeError('derivation_ambiguity_state_invalid')
    parse_utc_iso(marker.get('markedAt'),'derivation_ambiguity_state_invalid')
    if not isinstance(marker.get('reason'),str) or not marker['reason']:
        raise RuntimeError('derivation_ambiguity_state_invalid')
    return True

def mark_derivation_ambiguity(cfg,reason):
    path=derivation_ambiguity_path(cfg); path.parent.mkdir(parents=True,exist_ok=True); os.chmod(path.parent,0o700)
    payload=canonical_json({'markedAt':now_iso(),'reason':reason}).encode()
    temp_path=path.with_name(path.name+'.tmp-'+uuid.uuid4().hex)
    fd=os.open(temp_path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    try:
        os.write(fd,payload); os.fsync(fd)
    finally:
        os.close(fd)
    os.replace(temp_path,path); os.chmod(path,0o600)

def require_no_derivation_ambiguity(cfg):
    if derivation_ambiguity_present(cfg): raise RuntimeError('derivation_ambiguity_hold')

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
        if not isinstance(result,dict) or result.get('ok') is not True: raise RuntimeError('bridge_https_rejected')
        return result
    finally: Path(body).unlink(missing_ok=True)

def flush_queued(cfg,db):
    placeholders=','.join('?' for _ in OUTBOUND_PROVISION_CLASSIFICATIONS)
    for receiver_id,address,classification,provisioned_at,message_id in db.execute(
        f"SELECT receiver_address_id,receive_address,classification,provisioned_at,bridge_message_id FROM addresses WHERE delivery_status='queued' AND classification IN ({placeholders}) ORDER BY provisioned_at,receiver_address_id",
        OUTBOUND_PROVISION_CLASSIFICATIONS
    ).fetchall():
        require_outbound_provision_classification(classification)
        payload={'receiverAddressId':receiver_id,'receiveAddress':address,'createdAt':provisioned_at}
        envelope=make_envelope(cfg,'address_provision',PROVISION_PATH,payload,message_id,provisioned_at)
        deliver(cfg,PROVISION_PATH,envelope,sign_envelope(cfg,envelope))
        db.execute("UPDATE addresses SET delivery_status='delivered' WHERE receiver_address_id=?",(receiver_id,)); db.commit()
    for event_key,message_id,payload_json,created_at in db.execute(
        "SELECT event_key,message_id,payload_json,created_at FROM observations WHERE delivery_status='queued' ORDER BY created_at,event_key"
    ).fetchall():
        payload=json.loads(payload_json)
        receiver_id=payload.get('receiverAddressId') if isinstance(payload,dict) else None
        require_observation_address(db,receiver_id)
        envelope=make_envelope(cfg,'receipt_observation',OBSERVE_PATH,payload,message_id,created_at)
        deliver(cfg,OBSERVE_PATH,envelope,sign_envelope(cfg,envelope))
        terminalize_public_provision(db,receiver_id)
        db.execute("UPDATE observations SET delivery_status='delivered' WHERE event_key=?",(event_key,)); db.commit()

def queued_outbound_provision_count(db):
    placeholders=','.join('?' for _ in OUTBOUND_PROVISION_CLASSIFICATIONS)
    row=db.execute(
      f"SELECT COUNT(*) FROM addresses WHERE delivery_status='queued' AND classification IN ({placeholders})",
      OUTBOUND_PROVISION_CLASSIFICATIONS
    ).fetchone()
    if not row or type(row[0]) is not int or row[0]<0: raise RuntimeError('queued_provision_count_invalid')
    return row[0]

def provision(cfg,db,classification,send):
    if send:
        require_outbound_provision_classification(classification)
        flush_queued(cfg,db)
    address=next_fresh_address(cfg,db); receiver_id=f'don_addr_{uuid.uuid4().hex}'; created=now_iso(); message_id=f'don-provision-{uuid.uuid4()}'
    db.execute('INSERT INTO addresses VALUES(?,?,?,?,?,?)',(receiver_id,address,classification,created,message_id,'queued')); db.commit()
    payload={'receiverAddressId':receiver_id,'receiveAddress':address,'createdAt':created}
    envelope=make_envelope(cfg,'address_provision',PROVISION_PATH,payload,message_id,created)
    if send:
        require_outbound_provision_classification(classification)
        deliver(cfg,PROVISION_PATH,envelope,sign_envelope(cfg,envelope))
        db.execute("UPDATE addresses SET delivery_status='delivered' WHERE receiver_address_id=?",(receiver_id,)); db.commit()
    print('PROVISION_RESULT=RECORDED'); print('CLASSIFICATION='+classification); print('ADDRESS_PUBLICATION=NO')

def parse_utc_iso(value,error_code):
    if not isinstance(value,str) or not UTC_ISO_RE.fullmatch(value):
        raise RuntimeError(error_code)
    normalized=value[:-1]+'+00:00' if value.endswith('Z') else value
    try:
        parsed=datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise RuntimeError(error_code) from exc
    if parsed.tzinfo is None or parsed.utcoffset()!=timedelta(0):
        raise RuntimeError(error_code)
    return parsed.astimezone(timezone.utc)

def read_available_capacity(cfg):
    envelope=make_envelope(cfg,'capacity_read',CAPACITY_PATH,{})
    result=deliver(cfg,CAPACITY_PATH,envelope,sign_envelope(cfg,envelope))
    available=result.get('availableCapacity')
    if type(available) is not int or available<0:
        raise RuntimeError('capacity_response_invalid')
    parse_utc_iso(result.get('queriedAt'),'capacity_response_invalid')
    return available

def rolling_derivation_budget_used(db,settings,now_utc=None):
    now_utc=now_utc or datetime.now(timezone.utc)
    if now_utc.tzinfo is None or now_utc.utcoffset()!=timedelta(0):
        raise RuntimeError('budget_time_authority_invalid')
    now_utc=now_utc.astimezone(timezone.utc)
    cutoff=now_utc-timedelta(seconds=settings['DERIVATION_BUDGET_WINDOW'])
    used=0
    for row in db.execute('SELECT provisioned_at FROM addresses').fetchall():
        if not row:
            raise RuntimeError('budget_timestamp_invalid')
        provisioned_at=parse_utc_iso(row[0],'budget_timestamp_invalid')
        if provisioned_at>cutoff:
            used+=1
    return used

def local_address_count(db):
    row=db.execute('SELECT COUNT(*) FROM addresses').fetchone()
    if not row or type(row[0]) is not int or row[0]<0: raise RuntimeError('local_address_count_invalid')
    return row[0]

def emit_supervisor_result(result):
    ordered=(
      'status','reason','available_before','budget_used','derive_count',
      'derivation_attempts','local_rows_created','remote_deliveries_confirmed',
      'stopped_by_failure','action'
    )
    for key in ordered:
        if key in result:
            value=result[key]
            if isinstance(value,bool): value='YES' if value else 'NO'
            print(f'SUPERVISOR_{key.upper()}={value}')

def supervise_locked(cfg,db,settings):
    base={
      'derivation_attempts':0,
      'local_rows_created':0,
      'remote_deliveries_confirmed':0,
      'stopped_by_failure':False,
      'action':'zero',
    }
    try:
        require_no_derivation_ambiguity(cfg)
    except Exception:
        return base|{'status':'failed','reason':'derivation_ambiguity_hold'}
    try:
        flush_queued(cfg,db)
    except Exception:
        return base|{'status':'failed','reason':'queued_flush_failed'}
    try:
        if queued_outbound_provision_count(db)!=0:
            return base|{'status':'failed','reason':'queued_provision_remaining'}
    except Exception:
        return base|{'status':'failed','reason':'queued_provision_state_invalid'}
    try:
        available=read_available_capacity(cfg)
    except Exception:
        return base|{'status':'failed','reason':'capacity_authority_unavailable'}
    base['available_before']=available
    try:
        budget_used=rolling_derivation_budget_used(db,settings)
    except Exception:
        return base|{'status':'failed','reason':'budget_authority_invalid'}
    base['budget_used']=budget_used
    if budget_used>=settings['DERIVATION_BUDGET_MAX']:
        return base|{'status':'healthy','reason':'derivation_budget_exhausted'}
    if available>=settings['MIN_AVAILABLE']:
        return base|{'status':'healthy','reason':'capacity_healthy'}
    deficit=settings['TARGET_AVAILABLE']-available
    allowed_by_pool=settings['MAX_AVAILABLE']-available
    allowed_by_budget=settings['DERIVATION_BUDGET_MAX']-budget_used
    derive_count=min(deficit,settings['BATCH_SIZE_MAX'],allowed_by_pool,allowed_by_budget)
    base['derive_count']=derive_count
    if derive_count<=0:
        return base|{'status':'healthy','reason':'no_derivation_eligible'}
    for _ in range(derive_count):
        before=local_address_count(db)
        base['derivation_attempts']+=1
        try:
            provision(cfg,db,SUPERVISOR_CLASSIFICATION,True)
        except Exception:
            base['stopped_by_failure']=True
            try:
                after=local_address_count(db)
            except Exception:
                mark_derivation_ambiguity(cfg,'provision_exception_local_state_unreadable')
                base['action']='derivation_state_ambiguous'
                return base|{'status':'failed','reason':'provision_failed_derivation_unknown'}
            delta=after-before
            if delta==1:
                base['local_rows_created']+=1
                base['action']='derived_local_ambiguous_remote'
                return base|{'status':'failed','reason':'provision_failed_after_local_bind'}
            mark_derivation_ambiguity(cfg,'provision_exception_without_exactly_one_local_row')
            base['action']='derivation_state_ambiguous'
            return base|{'status':'failed','reason':'provision_failed_derivation_unknown'}
        after=local_address_count(db)
        if after!=before+1:
            mark_derivation_ambiguity(cfg,'provision_success_local_row_count_mismatch')
            base['stopped_by_failure']=True
            base['action']='derivation_state_ambiguous'
            return base|{'status':'failed','reason':'local_row_count_mismatch'}
        base['local_rows_created']+=1
        base['remote_deliveries_confirmed']+=1
    base['action']='derived'
    return base|{'status':'replenished','reason':'bounded_replenishment_complete'}

def supervise_run_once(cfg,db,settings):
    try:
        with derivation_lock(cfg):
            result=supervise_locked(cfg,db,settings)
    except RuntimeError as exc:
        if str(exc)=='derivation_lock_unavailable':
            result={
              'status':'failed','reason':'derivation_lock_unavailable','derivation_attempts':0,
              'local_rows_created':0,'remote_deliveries_confirmed':0,
              'stopped_by_failure':False,'action':'zero'
            }
        else:
            raise
    emit_supervisor_result(result)
    return result

def decode_tx_outputs(cfg,txid):
    raw=run_electrum(cfg,'gettransaction',txid)
    if not isinstance(raw,str): raise RuntimeError('raw_transaction_invalid')
    decoded=run_electrum(cfg,'deserialize',raw); outputs=decoded.get('outputs') if isinstance(decoded,dict) else None
    if not isinstance(outputs,list): raise RuntimeError('decoded_outputs_invalid')
    return outputs

def scan(cfg,db,send):
    if send: flush_queued(cfg,db)
    placeholders=','.join('?' for _ in OBSERVATION_CLASSIFICATIONS)
    rows=db.execute(f"SELECT receiver_address_id,receive_address,classification FROM addresses WHERE delivery_status='delivered' AND classification IN ({placeholders})",OBSERVATION_CLASSIFICATIONS).fetchall(); queued=0
    for receiver_id,address,classification in rows:
        require_observation_address(db,receiver_id)
        history=run_electrum(cfg,'getaddresshistory',address)
        if not isinstance(history,list): raise RuntimeError('address_history_invalid')
        for item in history:
            txid=(item or {}).get('tx_hash') if isinstance(item,dict) else None; height=(item or {}).get('height') if isinstance(item,dict) else None
            if not isinstance(txid,str) or not TXID_RE.fullmatch(txid): continue
            outputs=decode_tx_outputs(cfg,txid); status=run_electrum(cfg,'get_tx_status',txid); conf=int(status.get('confirmations',0)) if isinstance(status,dict) else 0
            if conf == 0 and isinstance(height,int) and height > 0:
                # Server history alone is not confirmation authority; wait for wallet SPV verification.
                continue
            if conf>0:
                verified_height,block_hash=local_verified_block_hash(cfg,txid)
                block_height=str(verified_height); spv=True
            else:
                block_height=None; block_hash=None; spv=False
            for vout,out in enumerate(outputs):
                if not isinstance(out,dict) or out.get('address')!=address: continue
                sats=out.get('value_sats')
                if not isinstance(sats,int) or sats<=0: continue
                payload={'receiverAddressId':receiver_id,'txid':txid,'txVout':vout,'observedSats':str(sats),'confirmations':conf if spv else 0,
                  'blockHeight':block_height,'blockHash':block_hash,'observedAt':now_iso(),'spvVerified':spv}
                event_key=sha256_text(canonical_json({k:payload[k] for k in ('receiverAddressId','txid','txVout','observedSats','confirmations','blockHeight','blockHash','spvVerified')})); message_id='don-observe-'+event_key[:40]
                if db.execute('SELECT 1 FROM observations WHERE event_key=?',(event_key,)).fetchone(): continue
                message_created=now_iso()
                db.execute('INSERT INTO observations VALUES(?,?,?,?,?)',(event_key,message_id,canonical_json(payload),'queued',message_created)); db.commit(); queued+=1
                envelope=make_envelope(cfg,'receipt_observation',OBSERVE_PATH,payload,message_id,message_created)
                if send:
                    require_observation_address(db,receiver_id)
                    deliver(cfg,OBSERVE_PATH,envelope,sign_envelope(cfg,envelope)); terminalize_public_provision(db,receiver_id)
                    db.execute("UPDATE observations SET delivery_status='delivered' WHERE event_key=?",(event_key,)); db.commit()
    print('OBSERVATION_EVENTS_QUEUED='+str(queued)); print('SPV_AUTHORITY=ELECTRUM_WALLET_GET_TX_STATUS')

def main():
    ap=argparse.ArgumentParser(); sub=ap.add_subparsers(dest='cmd',required=True)
    p=sub.add_parser('provision'); p.add_argument('--classification',choices=['PROVISIONED','INTEGRATION_PROVISIONED','PUBLIC_SUPPORT_ELIGIBLE','TEST_PROVISIONED'],default='PROVISIONED'); p.add_argument('--deliver',action='store_true')
    s=sub.add_parser('scan'); s.add_argument('--deliver',action='store_true')
    sub.add_parser('flush')
    sup=sub.add_parser('supervise'); sup.add_argument('--run-once',action='store_true',required=True)
    args=ap.parse_args(); cfg=config(); db=init_db(cfg['DONATION_BRIDGE_STATE_DB'])
    try:
        if args.cmd=='provision':
            with derivation_lock(cfg):
                require_no_derivation_ambiguity(cfg)
                provision(cfg,db,args.classification,args.deliver)
        elif args.cmd=='scan':
            scan(cfg,db,args.deliver)
        elif args.cmd=='flush':
            flush_queued(cfg,db); print('QUEUED_DELIVERY_FLUSH=PASS')
        else:
            supervise_run_once(cfg,db,supervisor_settings())
    finally: db.close()
if __name__=='__main__': main()
