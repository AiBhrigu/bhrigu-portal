import base64
import json
import os
from pathlib import Path
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get("BTC_COSMOGRAPHER_LOCAL_RC_BASE", "http://127.0.0.1:4185").rstrip("/")
ARTIFACTS = Path("artifacts/btc-cosmographer-usability")
ARTIFACTS.mkdir(parents=True, exist_ok=True)

options = webdriver.ChromeOptions()
for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"):
    options.add_argument(argument)
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
driver = webdriver.Chrome(options=options)

report = {
    "schema": "btc_cosmographer_multi_body_local_rc_usability_v0_1",
    "status": "PASS",
    "checks": {},
    "measurements": [],
    "failures": [],
    "browser_severe": [],
}


def wait(selector, timeout=45):
    return WebDriverWait(driver, timeout).until(lambda d: d.find_element(By.CSS_SELECTOR, selector))


def check(name, passed, details=""):
    passed = bool(passed)
    report["checks"][name] = {"passed": passed, "details": str(details)[:700]}
    print(f"{'PASS' if passed else 'FAIL'} {name}{' · ' + str(details)[:300] if details else ''}")
    if not passed:
        report["failures"].append(name)


def no_overflow():
    return bool(driver.execute_script("return document.documentElement.scrollWidth <= window.innerWidth + 1"))


def full_page_screenshot(path):
    metrics = driver.execute_cdp_cmd("Page.getLayoutMetrics", {})
    size = metrics["cssContentSize"]
    payload = driver.execute_cdp_cmd(
        "Page.captureScreenshot",
        {
            "format": "png",
            "captureBeyondViewport": True,
            "clip": {"x": 0, "y": 0, "width": size["width"], "height": size["height"], "scale": 1},
        },
    )
    Path(path).write_bytes(base64.b64decode(payload["data"]))


def article_metrics(label, width, height):
    article = wait("#answer")
    heading = wait("#answer h2")
    values = driver.execute_script(
        "const a=arguments[0].getBoundingClientRect();const h=arguments[1].getBoundingClientRect();"
        "return {articleTop:a.top,headingTop:h.top,headingBottom:h.bottom,scrollHeight:document.documentElement.scrollHeight,viewport:window.innerHeight};",
        article,
        heading,
    )
    values.update({"label": label, "width": width, "height": height})
    report["measurements"].append(values)
    check(f"{label}_no_horizontal_overflow", no_overflow(), values)
    check(f"{label}_answer_heading_first_viewport", values["headingTop"] >= 0 and values["headingBottom"] <= values["viewport"], values)
    check(f"{label}_continuation_form", len(driver.find_elements(By.CSS_SELECTOR, "form[data-question-form='continuation']")) == 1)
    check(f"{label}_labels_visible", len(driver.find_elements(By.CSS_SELECTOR, ".form label")) >= 4)
    check(f"{label}_diagnostics_closed", not driver.find_element(By.CSS_SELECTOR, ".diagnostics").get_attribute("open"))
    full_page_screenshot(ARTIFACTS / f"{label}.png")


def submit_continuation(question):
    form = wait("form[data-question-form='continuation']")
    field = form.find_element(By.CSS_SELECTOR, "input[name='q']")
    field.clear()
    field.send_keys(question)
    form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(driver, 45).until(lambda d: quote(question, safe="") in d.current_url or question in d.current_url)
    wait("#answer")


def state_assertions(label, expected_domain, expected_relation, expected_mode):
    article = wait("#answer")
    actual = {
        "domain": article.get_attribute("data-route-domain"),
        "relation": article.get_attribute("data-context-relation"),
        "mode": article.get_attribute("data-answer-mode"),
    }
    check(f"{label}_semantic_state", actual == {
        "domain": expected_domain,
        "relation": expected_relation,
        "mode": expected_mode,
    }, actual)
    active = driver.find_elements(By.CSS_SELECTOR, ".journey li[aria-current='step']")
    check(f"{label}_one_active_journey_step", len(active) == 1, len(active))


def run_ru_sequence(width, height, suffix):
    driver.set_window_size(width, height)
    question = "Какие аспекты планет важны в 2026 году?"
    driver.get(f"{BASE}/crypto-astro/btc/local-rc?lang=ru&q={quote(question)}")
    state_assertions(f"ru_overview_{suffix}", "astromodule", "NEW_TOPIC", "ASTRO_YEAR_OVERVIEW")
    check(f"ru_overview_{suffix}_five_window_cards", len(driver.find_elements(By.CSS_SELECTOR, "[data-window-rank]")) == 5)
    transitions = driver.find_element(By.CSS_SELECTOR, "[data-complete-transitions='collapsed']")
    check(f"ru_overview_{suffix}_transitions_collapsed", not transitions.get_attribute("open"))
    article_metrics(f"ru-overview-{suffix}", width, height)

    submit_continuation("Почему это важно?")
    state_assertions(f"ru_follow_up_{suffix}", "astromodule", "FOLLOW_UP", "ASTRO_YEAR_OVERVIEW")
    check(f"ru_follow_up_{suffix}_focused_sections", len(driver.find_elements(By.CSS_SELECTOR, "#answer > .section")) <= 3)
    check(f"ru_follow_up_{suffix}_no_full_windows", not driver.find_elements(By.CSS_SELECTOR, "[data-answer-section='main_windows']"))
    check(f"ru_follow_up_{suffix}_dynamic_shell", "Почему" in driver.find_element(By.CSS_SELECTOR, ".hero h1").text)
    article_metrics(f"ru-follow-up-{suffix}", width, height)

    submit_continuation("А ликвидность это подтверждает?")
    state_assertions(f"ru_bridge_{suffix}", "astro_btc_bridge", "CROSS_MODULE_BRIDGE", "ASTRO_BTC_BRIDGE")
    sections = driver.find_elements(By.CSS_SELECTOR, "#answer > .section")
    first_section = sections[0].get_attribute("data-answer-section") if sections else ""
    check(f"ru_bridge_{suffix}_market_first", first_section == "market_layer", first_section)
    check(f"ru_bridge_{suffix}_dynamic_shell", "Astro × BTC" in driver.find_element(By.CSS_SELECTOR, ".hero h1").text)
    article_metrics(f"ru-bridge-{suffix}", width, height)

    submit_continuation("Теперь о халвинге")
    state_assertions(f"ru_halving_{suffix}", "bitcoin_protocol", "NEW_TOPIC", "PROTOCOL_EXPLAIN")
    shell_title = driver.find_element(By.CSS_SELECTOR, ".hero h1").text
    check(f"ru_halving_{suffix}_protocol_shell", "халвинг" in shell_title.casefold() and "аспекты 2026" not in shell_title.casefold(), shell_title)
    article_metrics(f"ru-halving-{suffix}", width, height)

    submit_continuation("Вернёмся к аспектам")
    state_assertions(f"ru_return_{suffix}", "astromodule", "RETURN_TO_PREVIOUS_TOPIC", "ASTRO_YEAR_OVERVIEW")
    check(f"ru_return_{suffix}_compact_recap", 1 <= len(driver.find_elements(By.CSS_SELECTOR, "[data-window-rank]")) <= 3)
    check(f"ru_return_{suffix}_no_transition_repeat", not driver.find_elements(By.CSS_SELECTOR, "[data-complete-transitions='collapsed']"))
    check(f"ru_return_{suffix}_dynamic_shell", "Возврат" in driver.find_element(By.CSS_SELECTOR, ".hero h1").text)
    article_metrics(f"ru-return-{suffix}", width, height)


def run_en_overview(width, height, suffix):
    driver.set_window_size(width, height)
    question = "Which planetary aspects matter in 2026?"
    driver.get(f"{BASE}/crypto-astro/btc/local-rc?lang=en&q={quote(question)}")
    state_assertions(f"en_overview_{suffix}", "astromodule", "NEW_TOPIC", "ASTRO_YEAR_OVERVIEW")
    check(f"en_overview_{suffix}_five_window_cards", len(driver.find_elements(By.CSS_SELECTOR, "[data-window-rank]")) == 5)
    check(f"en_overview_{suffix}_english_shell", "Planetary aspects" in driver.find_element(By.CSS_SELECTOR, ".hero h1").text)
    article_metrics(f"en-overview-{suffix}", width, height)


try:
    run_ru_sequence(1440, 1100, "desktop")
    run_en_overview(1440, 1100, "desktop")
    run_ru_sequence(390, 844, "mobile")
    run_en_overview(390, 844, "mobile")

    severe = [entry for entry in driver.get_log("browser") if entry.get("level") == "SEVERE"]
    report["browser_severe"] = severe
    check("browser_has_no_severe_errors", not severe, severe)
finally:
    driver.quit()

report["status"] = "FAIL" if report["failures"] else "PASS"
(ARTIFACTS / "usability-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if report["failures"]:
    raise SystemExit(1)
print(f"BTC_COSMOGRAPHER_LOCAL_RC_USABILITY={report['status']} checks={len(report['checks'])}")
