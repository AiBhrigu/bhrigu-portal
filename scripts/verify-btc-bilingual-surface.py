import json, re, time
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

base='http://127.0.0.1:3000/crypto-astro/btc'
producer='https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot.public.json'
en=[
  ('general_change','What changed in the BTC field, why does it matter, and what should I watch next?',{'market_structure','change_event_memory'}),
  ('liquidity','Do stablecoin share, DeFi TVL and DEX volume confirm current BTC liquidity conditions?',{'market_structure','liquidity_membrane'}),
  ('structure_confirmation','Do regime, Market Field Score and market cap confirm the current BTC structure?',{'market_structure','liquidity_membrane'}),
  ('temporal_context','How does the selected date change the BTC observation context and temporal pressure?',{'temporal_context','change_event_memory'}),
  ('accepted_memory','What does the accepted Snapshot Memory show since the previous verified snapshot?',{'market_structure','change_event_memory'}),
]
ru=[
  ('general_change','Что изменилось в поле BTC, почему это важно и за чем наблюдать дальше?',{'market_structure','change_event_memory'}),
  ('liquidity','Подтверждают ли доля стейблкоинов, DeFi TVL и объём DEX текущие условия ликвидности BTC?',{'market_structure','liquidity_membrane'}),
  ('structure_confirmation','Подтверждают ли режим, Market Field Score и рыночная капитализация текущую структуру BTC?',{'market_structure','liquidity_membrane'}),
  ('temporal_context','Как выбранная дата меняет контекст наблюдения BTC и временное давление?',{'temporal_context','change_event_memory'}),
  ('accepted_memory','Что показывает принятая Snapshot Memory по сравнению с предыдущим проверенным снимком?',{'market_structure','change_event_memory'}),
]

options=webdriver.ChromeOptions()
for arg in ('--headless=new','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars'):
  options.add_argument(arg)
options.set_capability('goog:loggingPrefs', {'browser':'ALL'})
driver=webdriver.Chrome(options=options)
report={'checks':{},'measurements':{},'routes':[],'failures':[],'browser_severe':[]}

def wait_for(selector, timeout=45):
  return WebDriverWait(driver,timeout).until(lambda d:d.find_element(By.CSS_SELECTOR,selector))

def rect(selector):
  return driver.execute_script('const r=document.querySelector(arguments[0]).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};',selector)

def css(selector, prop):
  return driver.execute_script('return getComputedStyle(document.querySelector(arguments[0])).getPropertyValue(arguments[1]).trim()',selector,prop)

try:
  producer_payload=json.loads(urlopen(producer,timeout=30).read().decode('utf-8'))
  accepted_timestamp=producer_payload['generated_at_utc']
  report['measurements']['accepted_timestamp']=accepted_timestamp

  for locale,routes in [('en',en),('ru',ru)]:
    for route_id,question,expected in routes:
      url=f'{base}?lang={locale}&q={quote(question)}'
      driver.set_window_size(1440,900)
      driver.get(url)
      wait_for('.reading')
      body=driver.find_element(By.TAG_NAME,'body').text
      main=driver.find_element(By.TAG_NAME,'main')
      primaries={node.get_attribute('data-module-id') for node in driver.find_elements(By.CSS_SELECTOR,'.phiPlane .primaryModule')}
      zones=driver.find_elements(By.CSS_SELECTOR,'.reading>.readingZone')
      modules=driver.find_elements(By.CSS_SELECTOR,'.phiPlane .phiModule')
      source_time=driver.find_element(By.CSS_SELECTOR,'.metricRibbon').get_attribute('data-source-generated-at')
      question_value=driver.find_element(By.CSS_SELECTOR,'textarea[name="q"]').get_attribute('value')
      complete='BTC Field Read unavailable' not in body and 'Чтение поля BTC недоступно' not in body
      item={'locale':locale,'route_id':route_id,'question':question,'complete':complete,'primary_modules':sorted(primaries),'source_generated_at_utc':source_time}
      report['routes'].append(item)
      key=f'{locale}_{route_id}'
      report['checks'][f'{key}_complete']=complete
      report['checks'][f'{key}_locale']=main.get_attribute('data-locale')==locale
      report['checks'][f'{key}_question_round_trip']=question_value==question
      report['checks'][f'{key}_three_zones']=len(zones)==3
      report['checks'][f'{key}_five_modules']=len(modules)==5
      report['checks'][f'{key}_two_primary']=len(primaries)==2
      report['checks'][f'{key}_expected_primary']=primaries==expected
      report['checks'][f'{key}_current_snapshot']=source_time==accepted_timestamp
      report['checks'][f'{key}_memory_eight']=len(driver.find_elements(By.CSS_SELECTOR,'.memoryAxis tbody tr'))==8
      report['checks'][f'{key}_source_proof']=len(driver.find_elements(By.CSS_SELECTOR,'.sourceProof .sourceRows li'))>=7
      report['checks'][f'{key}_proof_hash']=len(driver.find_element(By.CSS_SELECTOR,'.sourceProof').get_attribute('data-current-snapshot-sha'))==64
      report['checks'][f'{key}_no_overflow']=driver.execute_script('return document.documentElement.scrollWidth<=window.innerWidth+1')

    report['checks'][f'{locale}_five_example_links']=len(driver.find_elements(By.CSS_SELECTOR,'.exampleRouteList a'))==5
    report['checks'][f'{locale}_two_language_options']=len(driver.find_elements(By.CSS_SELECTOR,'.languageSelector a'))==2

  detected='Что изменилось в поле BTC и почему это важно?'
  driver.get(f'{base}?q={quote(detected)}')
  wait_for('.reading')
  report['checks']['ru_auto_detected']=driver.find_element(By.TAG_NAME,'main').get_attribute('data-locale')=='ru'
  report['checks']['ru_auto_detected_source']=driver.find_element(By.TAG_NAME,'main').get_attribute('data-locale-source')=='detected'

  explicit='What changed in the BTC field and why does it matter?'
  driver.get(f'{base}?lang=ru&q={quote(explicit)}')
  wait_for('.reading')
  explicit_body=driver.find_element(By.TAG_NAME,'body').text
  report['checks']['explicit_ru_overrides_question_language']='Итоговое чтение Космографа' in explicit_body

  trading='Стоит ли мне купить или продать BTC и какую ценовую цель использовать?'
  driver.get(f'{base}?lang=ru&q={quote(trading)}')
  wait_for('.reading')
  trading_body=driver.find_element(By.TAG_NAME,'body').text
  report['checks']['russian_trading_reframed']='Прямая торговая рекомендация удалена.' in trading_body
  report['checks']['russian_trading_no_actionable']=not re.search(r'\b(купи|продай|входи|выходи)\b',trading_body,re.I)

  driver.get(f'{base}?lang=ru&q=BTC')
  wait_for('#btc-question-title')
  invalid=driver.find_element(By.TAG_NAME,'body').text
  report['checks']['ru_validation_localized']='Скорректируйте вопрос или дату' in invalid
  report['checks']['invalid_has_zero_reading_zones']=len(driver.find_elements(By.CSS_SELECTOR,'.reading>.readingZone'))==0

  question=en[0][1]
  driver.set_window_size(1440,900)
  driver.get(f'{base}?lang=en&q={quote(question)}')
  wait_for('#executive-read-title')
  executive_primary=rect('.executivePrimary')
  executive_context=rect('.executiveContext')
  phi_primary=rect('.primaryField')
  phi_support=rect('.supportBand')
  report['measurements']['executive_phi_ratio']=executive_primary['width']/executive_context['width']
  report['measurements']['field_phi_ratio']=phi_primary['width']/phi_support['width']
  report['checks']['executive_phi_ratio']=1.57<=report['measurements']['executive_phi_ratio']<=1.67
  report['checks']['field_phi_ratio']=1.57<=report['measurements']['field_phi_ratio']<=1.67
  report['checks']['exactly_three_zones']=len(driver.find_elements(By.CSS_SELECTOR,'.reading>.readingZone'))==3
  report['checks']['five_modules']=len(driver.find_elements(By.CSS_SELECTOR,'.phiPlane .phiModule'))==5
  report['checks']['exactly_two_primary']=len(driver.find_elements(By.CSS_SELECTOR,'.phiPlane .primaryModule'))==2
  report['checks']['three_supporting_or_unavailable']=len(driver.find_elements(By.CSS_SELECTOR,'.phiPlane .supportModule'))==3
  report['checks']['six_metrics']=len(driver.find_elements(By.CSS_SELECTOR,'.metricRibbon>dl>div'))==6
  report['checks']['three_evidence_disclosures']=len(driver.find_elements(By.CSS_SELECTOR,'.evidenceStack>details'))==3
  report['checks']['field_anchor_glyphs_bounded']=len(driver.find_elements(By.CSS_SELECTOR,'.fieldAnchorGlyph'))==3
  report['checks']['one_example_relation_glyph']=len(driver.find_elements(By.CSS_SELECTOR,'.exampleRelationGlyph'))==1
  report['checks']['one_phi_relation_glyph']=len(driver.find_elements(By.CSS_SELECTOR,'.phiRouteGlyph'))==1
  report['checks']['one_state_glyph']=len(driver.find_elements(By.CSS_SELECTOR,'.fieldDirection i'))==1
  report['checks']['one_memory_transition_glyph']=len(driver.find_elements(By.CSS_SELECTOR,'.memoryScale i'))==1
  report['checks']['one_sealed_boundary_glyph']=len(driver.find_elements(By.CSS_SELECTOR,'.sealedBoundaryGlyph'))==1
  report['checks']['source_proof_quiet_only']=len(driver.find_elements(By.CSS_SELECTOR,'.sourceProof svg,.sourceProof .fieldAnchorGlyph,.sourceProof .sealedBoundaryGlyph'))==0
  report['checks']['no_external_icon_images']=len(driver.find_elements(By.CSS_SELECTOR,'img[src*="icon"],svg use'))==0
  report['checks']['no_continuous_animation']=driver.execute_script('return [...document.querySelectorAll("main *")].every(e=>getComputedStyle(e).animationName==="none")')
  report['checks']['btc_axis_not_circle']=css('.btcAxis','border-radius') in ('0px','')
  report['checks']['primary_type_hierarchy']=float(css('.primaryModule h3','font-size').replace('px',''))>float(css('.supportModule h3','font-size').replace('px',''))
  report['checks']['bronze_active']=css('.languageSelector a[aria-current="true"]','border-top-color') in ('rgb(181, 138, 85)','rgba(181, 138, 85, 1)')
  report['checks']['near_black_field']=css('body','background-color') in ('rgb(8, 7, 5)','rgba(8, 7, 5, 1)')
  report['checks']['warm_white_reading']=css('.executivePrimary h3','color') in ('rgb(238, 232, 220)','rgba(238, 232, 220, 1)')
  report['checks']['temporal_blue_limited']=css('.module-temporal_context h3','color') in ('rgb(120, 146, 174)','rgba(120, 146, 174, 1)')
  report['checks']['no_rejected_dashboard_patterns']=sum(len(driver.find_elements(By.CSS_SELECTOR,s)) for s in ['.metricGrid','.executiveGrid','.moduleNode','.btcCore','.memoryStrip'])==0
  report['checks']['canonical_names_visible']=all(name in driver.page_source for name in ['CoinGecko','DefiLlama','Snapshot Registry','Snapshot Delta'])
  driver.save_screenshot('artifacts/bilingual-glyph-desktop-en.png')

  driver.get(f'{base}?lang=ru&q={quote(ru[0][1])}')
  wait_for('#executive-read-title')
  ru_body=driver.find_element(By.TAG_NAME,'body').text
  report['checks']['ru_surface_localized']=all(token in ru_body for token in ['Итоговое чтение Космографа','Пятимодульное Φ-поле','Принятая память изменений','Доказательства и закрытие'])
  report['checks']['canonical_proof_names_preserved']=all(token in driver.page_source for token in ['CoinGecko','DefiLlama','Snapshot Registry','Snapshot Delta'])
  driver.save_screenshot('artifacts/bilingual-glyph-desktop-ru.png')

  driver.set_window_size(390,844)
  driver.get(f'{base}?lang=ru&q={quote(ru[0][1])}')
  wait_for('.reading')
  report['checks']['mobile_no_overflow']=driver.execute_script('return document.documentElement.scrollWidth<=window.innerWidth+1')
  report['checks']['mobile_five_modules']=len(driver.find_elements(By.CSS_SELECTOR,'.phiPlane .phiModule'))==5
  report['checks']['mobile_safe_field']=rect('.closingField')['height']>=128
  driver.execute_script('window.scrollTo(0,document.body.scrollHeight)')
  time.sleep(.2)
  report['checks']['bottom_quiet_field_last']=driver.execute_script('const e=document.querySelector(".closingField");return e.offsetTop+e.offsetHeight>=document.body.scrollHeight-1')
  driver.save_screenshot('artifacts/bilingual-glyph-mobile-ru.png')

  driver.set_window_size(1440,900)
  driver.get(f'{base}?lang=en')
  wait_for('textarea[name="q"]')
  driver.find_element(By.TAG_NAME,'body').send_keys(Keys.TAB)
  focus=driver.execute_script('const e=document.activeElement,s=getComputedStyle(e);return {tag:e.tagName,outline:s.outlineStyle,width:s.outlineWidth};')
  report['checks']['keyboard_focus_visible']=focus['tag'] in ['TEXTAREA','INPUT','BUTTON','A'] and focus['outline']!='none' and focus['width']!='0px'

  severe=[entry for entry in driver.get_log('browser') if entry.get('level')=='SEVERE' and 'favicon' not in entry.get('message','').lower()]
  report['checks']['browser_severe_none']=not severe
  report['browser_severe']=severe
  report['failures']=[key for key,value in report['checks'].items() if not value]
  assert not report['failures'], report['failures']
finally:
  driver.quit()
  Path('artifacts/btc-bilingual-glyph-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
