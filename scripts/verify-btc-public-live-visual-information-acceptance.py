#!/usr/bin/env python3
import json, os, re, time
from pathlib import Path
from urllib.parse import quote, parse_qs, urlparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE=os.environ.get("BTC_COSMOGRAPHER_PREVIEW_BASE","http://127.0.0.1:3112").rstrip("/")
OUT=Path("artifacts/btc-public-live-visual-acceptance");OUT.mkdir(parents=True,exist_ok=True)
PRIMARY="bhrigu:btc-cosmographer:session:v0_3";LEGACY="bhrigu:btc-free-dialogue:session:v0_1"
checks=[];timings=[]
LABELS={
 "ru":{"bitcoin_protocol":"Протокол Bitcoin","btc_market":"Рынок BTC","snapshot_memory":"Память Snapshot","astromodule":"Астрономические данные","astro_btc_bridge":"Астрономия × BTC","methodology":"Метод и доказательность","navigation":"Навигация по полю BTC","unsupported":"Граница поддержки"},
 "en":{"bitcoin_protocol":"Bitcoin Protocol","btc_market":"BTC Market","snapshot_memory":"Snapshot Memory","astromodule":"Astronomical data","astro_btc_bridge":"Astronomy × BTC","methodology":"Method and evidence","navigation":"BTC field navigation","unsupported":"Support boundary"},
}
QUESTIONS={
 "ru":{"annual":"Какие самые напряженные дни в 2026 году у планет и их аспектов","market":"BTC today","bridge":"как влияет Юпитер на Биткоин?","halving":"Халвинг и его влияние на окна в циклах","return":"Вернёмся к аспектам"},
 "en":{"annual":"Which planetary aspect days are most intense in 2026?","market":"BTC today","bridge":"How does Jupiter affect Bitcoin?","halving":"How does halving affect cycle windows?","return":"Return to planetary aspects"},
}
RAW=set(LABELS["ru"])|{"snapshot_memory","astro_btc_bridge"}
def check(name,ok,details=""):
 checks.append({"name":name,"passed":bool(ok),"details":str(details)[:600]});print(("PASS" if ok else "FAIL"),name,details)
def norm(x):return re.sub(r"\s+"," ",x or "").strip()
def driver(width,height):
 o=Options();[o.add_argument(a) for a in ("--headless=new","--no-sandbox","--disable-dev-shm-usage",f"--window-size={width},{height}","--force-device-scale-factor=1")];d=webdriver.Chrome(options=o);d.set_window_size(width,height);return d
def session(d):
 raw=d.execute_script("const p=sessionStorage.getItem(arguments[0]),l=sessionStorage.getItem(arguments[1]);return p||l",PRIMARY,LEGACY)
 return json.loads(raw) if raw else {"turns":[]}
def latest(d):
 WebDriverWait(d,40).until(EC.presence_of_element_located((By.CSS_SELECTOR,"article.cosmographerTurn")))
 return d.find_elements(By.CSS_SELECTOR,"article.cosmographerTurn")[-1]
def route(n):return {"domain":n.get_attribute("data-route-domain") or "","subject":n.get_attribute("data-route-subject") or "","relation":n.get_attribute("data-context-relation") or n.get_attribute("data-semantic-context-relation") or "","mode":n.get_attribute("data-answer-mode") or ""}
def clear(d,locale):
 d.get(f"{BASE}/crypto-astro/btc/live?lang={locale}");WebDriverWait(d,40).until(EC.presence_of_element_located((By.CSS_SELECTOR,"form.liveComposer")));d.execute_script("sessionStorage.clear()")
def open_q(d,locale,q):
 start=time.perf_counter();d.get(f"{BASE}/crypto-astro/btc/live?lang={locale}&q={quote(q)}");n=latest(d);WebDriverWait(d,40).until(lambda x:any(t.get("user_text")==q for t in session(x).get("turns",[])));elapsed=time.perf_counter()-start;timings.append({"locale":locale,"question":q,"seconds":round(elapsed,3)});return n
def submit(d,q,expected):
 before=len(session(d).get("turns",[]));field=WebDriverWait(d,30).until(EC.presence_of_element_located((By.CSS_SELECTOR,'form.liveComposer textarea[name="q"]')));field.clear();field.send_keys(q);form=d.find_element(By.CSS_SELECTOR,"form.liveComposer");d.execute_script("arguments[0].requestSubmit()",form)
 WebDriverWait(d,40).until(lambda x:parse_qs(urlparse(x.current_url).query).get("q",[""])[0]==q)
 WebDriverWait(d,40).until(lambda x:len(session(x).get("turns",[]))>before)
 n=latest(d);WebDriverWait(d,40).until(lambda x:all(route(latest(x)).get(k)==v for k,v in expected.items()));return n
def proof(d,n,locale,domain,label):
 details=n.find_elements(By.CSS_SELECTOR,'details[data-answer-source-boundary="true"]');check(f"{label}_proof_details_exists",len(details)==1,len(details));
 if not details:return
 p=details[0];summ=p.find_elements(By.CSS_SELECTOR,"summary");s=norm(summ[0].text if summ else "");check(f"{label}_proof_summary_visible",bool(summ) and summ[0].is_displayed());check(f"{label}_proof_summary_nonempty",bool(s),s);check(f"{label}_proof_default_state_allowed",p.get_attribute("open") in (None,"true"),p.get_attribute("open") or "collapsed")
 text=norm(d.execute_script("return arguments[0].textContent||''",p));check(f"{label}_proof_machine_content_present",len(text)>len(s),text[:180]);expected=LABELS[locale][domain];check(f"{label}_proof_domain_exact",expected in text,expected);visible=norm(d.find_element(By.TAG_NAME,"body").text);leaks=sorted(x for x in RAW if x in visible);check(f"{label}_raw_domain_enum_visible_no",not leaks,leaks);check(f"{label}_proof_no_underscore",all("_" not in x for x in text.split()[:12]),text[:120])
def page_health(d,label):
 check(f"{label}_http_200",norm(d.title)!="");check(f"{label}_horizontal_overflow_zero",d.execute_script("return document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"));body=norm(d.find_element(By.TAG_NAME,"body").text);check(f"{label}_visible_deployment_sha_no",not re.search(r"\b[0-9a-f]{40}\b",body));check(f"{label}_duplicate_brand_zero",body.count("BHRIGU")<=1,body.count("BHRIGU"));
def domain_matrix(d):
 cases={"bitcoin_protocol":"What should I know about halving?","btc_market":"BTC today","snapshot_memory":"What changed since the previous Snapshot?","astromodule":"Which planetary aspects matter in 2026?","astro_btc_bride":"How does Jupiter affect Bitcoin?","methodology":"Which sources does Cosmographer use?","navigation":"What can you do?","unsupported":"Give me the exact BTC price tomorrow"}
 for locale in ("ru","en"):
  for domain,q in cases.items():
   clear(d,locale);n=open_q(d,locale,q);r=route(n);check(f"domain_{locale}_{domain}_route_exact",r["domain"]==domain,r);proof(d,n,locale,domain,f"domain_{locale}_{domain}")
def run_view(width,height,suffix):
 d=driver(width,height)
 try:
  for locale in ("ru","en"):
   q=QUESTIONS[locale];clear(d,locale);n=open_q(d,locale,q["annual"]);r=route(n);check(f"annual_{locale}_{suffix}",r=={"domain":"astromodule","subject":"planetary_aspects","relation":"NEW_TOPIC","mode":"ASTRO_YEAR_OVERVIEW"},r);check(f"annual_direct_first_{locale}_{suffix}",bool(n.find_elements(By.CSS_SELECTOR,'[data-answer-direct="true"]'));check(f"annual_five_windows_{locale}_{suffix}",len(n.find_elements(By.CSS_SELECTOR,".astroWindowCard"))==5);proof(d,n,locale,"astromodule",f"annual_{locale}_{suffix}");page_health(d,f"annual_{locale}_{suffix}");d.save_screenshot(str(OUT/f"annual-{locale}-{suffix}.png"))
   clear(d,locale);n=open_q(d,locale,q["market"]);check(f"market_{locale}_{suffix}",route(n)["domain"]=="btc_market",route(n));proof(d,n,locale,"btc_market",f"market_{locale}_{suffix}");page_health(d,f"market_{locale}_{suffix}")
   clear(d,locale);open_q(d,locale,q["annual"]);n=submit(d,q["bridge"],{"domain":"astro_btc_bridge","subject":"jupiter","relation":"CROSS_MODULE_BRIDGE","mode":"ASTRO_BTC_BRIDGE"});check(f"bridge_{locale}_{suffix}",True,route(n));n=submit(d,q["halving"],{"domain":"bitcoin_protocol","subject":"halving","relation":"NEW_TOPIC","mode":"PROTOCOL_EXPLAIN"});check(f"halving_{locale}_{suffix}",True,route(n));n=submit(d,q["return"],{"domain":"astro_btc_bridge","subject":"planetary_aspects","relation":"RETURN_TO_PREVIOUS_TOPIC","mode":"ASTRO_BTC_BRIDGE"});check(f"return_mode_{locale}_{suffix}",True,route(n));check(f"session_primary_or_legacy_{locale}_{suffix}",bool(d.execute_script("return sessionStorage.getItem(arguments[0])||sessionStorage.getItem(arguments[1])",PRIMARY,LEGACY)));check(f"composer_available_{locale}_{suffix}",bool(d.find_elements(By.CSS_SELECTOR,'form.liveComposer textarea[name="q"]'))
  logs=[x for x in d.get_log("browser") if x.get("level")=="SEVERE"];check(f"console_errors_zero_{suffix}",not logs,logs)
  if suffix=="desktop":domain_matrix(d)
 finally:d.quit()
for args in ((1440,1100,"desktop"),(390,844,"mobile")):run_view(*args)
max_time=max((x["seconds"] for x in timings),default=0);check("first_result_time_le_30_seconds",max_time<=30,max_time)
fail=[x for x in checks if not x["passed"]];report={"schema":"btc_public_live_visual_information_acceptance_v0_3","status":"FAIL" if fail else "PASS","check_count":len(checks),"failure_count":len(fail),"first_result_time_seconds":round(max_time,3),"timings":timings,"checks":checks};(OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
if fail:raise SystemExit(json.dumps(fail,ensure_ascii=False));print("BTC_PUBLIC_LIVE_VISUAL_INFORMATION_ACCEPTANCE=PASS")
