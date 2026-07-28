import json, os, time
from pathlib import Path
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

base=os.environ.get('BTC_BINANCE_PREVIEW_BASE','http://127.0.0.1:3101/crypto-astro/btc')
expected='b0bfa9c6489e5eff94233a903d6c29b9e31122c30499f84f1328e2ad19943aa3'
question='What changed in the BTC field, why does it matter, and what should I watch next?'
options=webdriver.ChromeOptions()
for arg in ('--headless=new','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars'):
  options.add_argument(arg)
options.set_capability('goog:loggingPrefs', {'browser':'ALL'})
driver=webdriver.Chrome(options=options)
report={'checks':{},'measurements':{},'failures':[],'browser_severe':[]}

def wait(selector,timeout=45):
  return WebDriverWait(driver,timeout).until(lambda d:d.find_element(By.CSS_SELECTOR,selector))

def rect(selector):
  return driver.execute_script('const r=document.querySelector(arguments[0]).getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom};',selector)

try:
  driver.set_window_size(1440,1400)
  driver.get(f'{base}?lang=en')
  panel=wait('#binance-free-observation')
  report['checks']['one_panel']=len(driver.find_elements(By.CSS_SELECTOR,'#binance-free-observation'))==1
  report['checks']['candidate_sha_bound']=panel.get_attribute('data-candidate-sha')==expected
  report['checks']['venue_bound']=panel.get_attribute('data-provider')=='Binance' and panel.get_attribute('data-instrument')=='BTCUSDT'
  report['checks']['usdt_not_usd']=panel.get_attribute('data-quote-asset')=='USDT' and 'not a global BTC/USD price' in panel.text
  report['checks']['six_observed_metrics']=len(driver.find_elements(By.CSS_SELECTOR,'.binanceObservationMetrics>div'))==6
  report['checks']['six_derived_metrics']=len(driver.find_elements(By.CSS_SELECTOR,'.binanceObservationField article dl>div'))==6
  report['checks']['evidence_present']=len(driver.find_elements(By.CSS_SELECTOR,'.binanceObservationEvidence'))==1
  primary=rect('.binanceObservationField article'); context=rect('.binanceObservationField aside')
  report['measurements']['phi_ratio']=primary['width']/context['width']
  report['checks']['phi_ratio']=1.57<=report['measurements']['phi_ratio']<=1.67
  report['checks']['desktop_no_overflow']=driver.execute_script('return document.documentElement.scrollWidth<=window.innerWidth+1')
  driver.execute_script('arguments[0].scrollIntoView({block:"start"})',panel)
  time.sleep(.3)
  panel_rect=rect('#binance-free-observation')
  report['measurements']['desktop_panel_top']=panel_rect['top']
  report['measurements']['desktop_panel_bottom']=panel_rect['bottom']
  report['checks']['desktop_panel_in_view']=panel_rect['top']>=-1 and panel_rect['top']<300 and panel_rect['bottom']>500
  driver.save_screenshot('artifacts/binance-observation-desktop-en.png')

  driver.get(f'{base}?lang=en&q={quote(question)}')
  wait('.reading')
  report['checks']['question_result_three_zones_unchanged']=len(driver.find_elements(By.CSS_SELECTOR,'.reading>.readingZone'))==3
  report['checks']['panel_outside_question_result']=len(driver.find_elements(By.CSS_SELECTOR,'.reading>#binance-free-observation'))==0
  report['checks']['static_source_proof_preserved']=len(driver.find_elements(By.CSS_SELECTOR,'.sourceProof .sourceRows li'))>=7

  driver.set_window_size(390,844)
  driver.get(f'{base}?lang=ru')
  panel=wait('#binance-free-observation')
  report['checks']['ru_title']=panel.find_element(By.CSS_SELECTOR,'h2').text.startswith('BTC/USDT')
  report['checks']['mobile_no_overflow']=driver.execute_script('return document.documentElement.scrollWidth<=window.innerWidth+1')
  driver.execute_script('arguments[0].scrollIntoView({block:"start"})',panel)
  time.sleep(.3)
  mobile_rect=rect('#binance-free-observation')
  report['checks']['mobile_panel_in_view']=mobile_rect['top']>=-1 and mobile_rect['top']<160 and mobile_rect['bottom']>600
  driver.save_screenshot('artifacts/binance-observation-mobile-ru.png')

  severe=[entry for entry in driver.get_log('browser') if entry.get('level')=='SEVERE' and 'favicon' not in entry.get('message','').lower()]
  report['checks']['browser_severe_none']=not severe
  report['browser_severe']=severe
  report['failures']=[name for name,passed in report['checks'].items() if not passed]
  assert not report['failures'], report['failures']
finally:
  Path('artifacts').mkdir(exist_ok=True)
  Path('artifacts/binance-observation-visual-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
  driver.quit()
