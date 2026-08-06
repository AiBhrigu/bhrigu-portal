import json
import os
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "http://127.0.0.1:3000/crypto-astro/btc/live"
SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3"

BASE_CASES = [
    ("market", "What is the current BTC market structure?", "Why?", "Now switch to the Bitcoin protocol.", "btc_market", "market_structure", "bitcoin_protocol", "overview"),
    ("market", "Какова текущая рыночная структура BTC?", "Какие факты создают расхождение?", "Теперь перейди к протоколу Bitcoin.", "btc_market", "market_structure", "bitcoin_protocol", "overview"),
    ("current", "What is happening with BTC now?", "What changed most?", "What changed since the previous accepted Snapshot?", "btc_market", "general_btc_field", "snapshot_memory", "change_memory"),
    ("current", "Что происходит с BTC сейчас?", "Что изменилось сильнее?", "Что изменилось с предыдущего принятого Snapshot BTC?", "btc_market", "general_btc_field", "snapshot_memory", "change_memory"),
    ("snapshot", "What changed since the previous accepted BTC Snapshot?", "Why does that matter?", "Who was Satoshi Nakamoto?", "snapshot_memory", "change_memory", "bitcoin_protocol", "satoshi_history"),
    ("snapshot", "Что изменилось с предыдущего принятого Snapshot BTC?", "Почему это важно?", "Кто был Сатоши Накамото?", "snapshot_memory", "change_memory", "bitcoin_protocol", "satoshi_history"),
    ("issuance", "How are new bitcoin issued?", "Why does the subsidy decrease?", "What is the current BTC market structure?", "bitcoin_protocol", "subsidy", "btc_market", "market_structure"),
    ("issuance", "Как выпускаются новые биткоины?", "Почему субсидия уменьшается?", "Какова текущая рыночная структура BTC?", "bitcoin_protocol", "subsidy", "btc_market", "market_structure"),
    ("origins", "Who was Satoshi Nakamoto?", "What is known for certain?", "How did Bitcoin begin?", "bitcoin_protocol", "satoshi_history", "bitcoin_protocol", "bitcoin_origin"),
    ("origins", "Кто был Сатоши Накамото?", "Что известно точно?", "Как появился Bitcoin?", "bitcoin_protocol", "satoshi_history", "bitcoin_protocol", "bitcoin_origin"),
    ("astronomy", "Where is Jupiter on August 6, 2026?", "What aspect is most relevant?", "Now switch to the Bitcoin protocol.", "astromodule", "jupiter", "bitcoin_protocol", "overview"),
    ("astronomy", "Где находится Юпитер 6 августа 2026 года?", "Какой аспект наиболее значим?", "Теперь перейди к протоколу Bitcoin.", "astromodule", "jupiter", "bitcoin_protocol", "overview"),
    ("bridge", "How does Jupiter coincide with BTC market structure on August 6, 2026?", "Which facts create the divergence?", "Which sources support this comparison?", "astro_btc_bridge", "jupiter", "methodology", "source_and_method"),
    ("bridge", "Как Юпитер совпадает со структурой BTC 6 августа 2026 года?", "Какие факты создают расхождение?", "Какие источники поддерживают это сопоставление?", "astro_btc_bridge", "jupiter", "methodology", "source_and_method"),
    ("method", "Which sources and method support the current BTC read?", "Where is the inference boundary?", "What is happening with BTC now?", "methodology", "source_and_method", "btc_market", "general_btc_field"),
    ("method", "Какие источники и метод поддерживают текущее чтение BTC?", "Где проходит граница вывода?", "Что происходит с BTC сейчас?", "methodology", "source_and_method", "btc_market", "general_btc_field"),
    ("unsupported", "Give me a guaranteed BTC price target for tomorrow.", "What is the current BTC market structure?", "Now switch to the Bitcoin protocol.", "unsupported", "unsupported_market_request", "bitcoin_protocol", "overview"),
    ("unsupported", "Дай мне гарантированную цель цены BTC на завтра.", "Какова текущая рыночная структура BTC?", "Теперь перейди к протоколу Bitcoin.", "unsupported", "unsupported_market_request", "bitcoin_protocol", "overview"),
    ("return", "What is the current BTC market structure?", "Now switch to the Bitcoin protocol.", "Return to the previous topic.", "btc_market", "market_structure", "btc_market", "market_structure"),
    ("return", "Какова текущая рыночная структура BTC?", "Теперь перейди к протоколу Bitcoin.", "Вернись к предыдущей теме.", "btc_market", "market_structure", "btc_market", "market_structure"),
    ("date_return", "Where is Jupiter on August 6, 2026?", "Now switch to the Bitcoin protocol.", "Return to the previous topic.", "astromodule", "jupiter", "astromodule", "jupiter"),
    ("date_return", "Где находится Юпитер 6 августа 2026 года?", "Теперь перейди к протоколу Bitcoin.", "Вернись к предыдущей теме.", "astromodule", "jupiter", "astromodule", "jupiter"),
    ("parity", "What is the Bitcoin protocol?", "Why is proof of work important?", "What is happening with BTC now?", "bitcoin_protocol", "overview", "btc_market", "general_btc_field"),
    ("parity", "Что такое протокол Bitcoin?", "Почему доказательство работы важно?", "Что происходит с BTC сейчас?", "bitcoin_protocol", "overview", "btc_market", "general_btc_field"),
]

def attr(node, name):
    return node.get_attribute(name) or ""

def run_case(index, case):
    tag, q1, q2, q3, d1, s1, d3, s3 = case
    locale = "ru" if any("а" <= char.lower() <= "я" or char.lower() == "ё" for char in q1) else "en"
    width = 390 if index % 2 else 1280
    options = webdriver.ChromeOptions()
    for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", f"--window-size={width},1000"):
        options.add_argument(argument)
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 30)
    checks = []

    def record(name, passed, details=""):
        checks.append({"name": name, "passed": bool(passed), "details": details})
        if not passed:
            raise AssertionError(f"{name}: {details}")

    def turns():
        return driver.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")

    def latest():
        wait.until(lambda _: len(turns()) > 0)
        return turns()[-1]

    def submit(question):
        previous = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage")
        textarea = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, 'textarea[name="q"]'))
        textarea.clear()
        textarea.send_keys(question)
        driver.execute_script("arguments[0].requestSubmit()", driver.find_element(By.CSS_SELECTOR, "form.liveComposer"))
        wait.until(EC.staleness_of(previous))
        wait.until(lambda _: len(turns()) > 0)
        return latest()

    try:
        driver.get(f"{BASE}?lang={locale}")
        driver.execute_script("window.sessionStorage.clear()")
        driver.get(f"{BASE}?lang={locale}&q={quote(q1)}")
        first = latest()
        record("turn1_domain", attr(first, "data-route-domain") == d1, attr(first, "data-route-domain"))
        record("turn1_subject", attr(first, "data-route-subject") == s1, attr(first, "data-route-subject"))
        record("turn1_direct_first", bool(first.find_elements(By.CSS_SELECTOR, '[data-answer-direct="true"]')))
        record("html_lang", driver.find_element(By.TAG_NAME, "html").get_attribute("lang") == locale)
        second = submit(q2)
        record("turn2_not_clarify", attr(second, "data-route-disposition") != "CLARIFY", attr(second, "data-route-disposition"))
        if tag not in ("unsupported", "return", "date_return"):
            record("turn2_continuity", attr(second, "data-context-relation") in ("FOLLOW_UP", "CROSS_MODULE_BRIDGE"), attr(second, "data-context-relation"))
        elif tag in ("return", "date_return"):
            record("turn2_topic_switch", attr(second, "data-context-relation") == "NEW_TOPIC", attr(second, "data-context-relation"))
        second_period = ""
        if tag in ("astronomy", "bridge"):
            second_period = driver.find_element(By.CSS_SELECTOR, ".activeContextLine").get_attribute("data-active-period") or ""
        third = submit(q3)
        record("turn3_domain", attr(third, "data-route-domain") == d3, attr(third, "data-route-domain"))
        record("turn3_subject", attr(third, "data-route-subject") == s3, attr(third, "data-route-subject"))
        if tag in ("return", "date_return"):
            record("return_relation", attr(third, "data-context-relation") == "RETURN_TO_PREVIOUS_TOPIC", attr(third, "data-context-relation"))
        if tag in ("astronomy", "bridge"):
            record("exact_date_retained", "2026" in second_period, second_period)
        if tag == "date_return":
            return_period = driver.find_element(By.CSS_SELECTOR, ".activeContextLine").get_attribute("data-active-period") or ""
            record("exact_date_retained", "2026" in return_period, return_period)
            record("exact_date_not_month_only", any(token in return_period for token in ("06.08.2026", "06 AUG 2026", "2026-08-06")), return_period)
        visible = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage").text
        record("no_internal_authority_visible", "ACCEPTED_MARKET_RECORD_AND_VERIFIED" not in visible)
        record("evidence_disclosure", bool(driver.find_elements(By.CSS_SELECTOR, "details[data-answer-source-boundary]")))
        record("three_turns", len(turns()) >= 3, str(len(turns())))
        driver.execute_script("window.sessionStorage.clear()")
        driver.get(f"{BASE}?lang={locale}")
        record("clean_reset", not driver.find_elements(By.CSS_SELECTOR, ".liveThread"))
    finally:
        driver.quit()
    return {
        "index": index + 1,
        "tag": tag,
        "locale": locale,
        "viewport": "mobile" if width == 390 else "desktop",
        "checks": checks,
        "status": "PASS" if all(item["passed"] for item in checks) else "FAIL",
    }

results = []
error = None
try:
    for index, case in enumerate(BASE_CASES):
        results.append(run_case(index, case))
except Exception as exc:
    error = str(exc)

report = {
    "schema": "btc_natural_followup_conversation_acceptance_v0_1",
    "status": "PASS" if error is None and len(results) == 24 and all(row["status"] == "PASS" for row in results) else "FAIL",
    "dialogue_count": len(results),
    "required_dialogue_count": 24,
    "results": results,
    "error": error,
}
os.makedirs("artifacts", exist_ok=True)
with open("artifacts/btc-natural-followup-conversation-report.json", "w", encoding="utf-8") as handle:
    json.dump(report, handle, ensure_ascii=False, indent=2)
print(json.dumps(report, ensure_ascii=False))
if report["status"] != "PASS":
    raise SystemExit(1)