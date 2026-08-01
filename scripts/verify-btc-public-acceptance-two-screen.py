#!/usr/bin/env python3
import json
import os
import time
from pathlib import Path
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = os.environ.get("BTC_COSMOGRAPHER_PREVIEW_BASE", "http://127.0.0.1:3110").rstrip("/")
OUT = Path("artifacts/btc-public-acceptance-two-screen")
OUT.mkdir(parents=True, exist_ok=True)
checks = []

def check(name, passed, details=""):
    checks.append({"name": name, "passed": bool(passed), "details": str(details)[:600]})
    print(("PASS" if passed else "FAIL"), name, details)

def make_driver(width, height):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument("--force-device-scale-factor=1")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(width, height)
    return driver

def no_overflow(driver):
    return driver.execute_script("return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1")

def font_family(driver, selector):
    return driver.execute_script(
        "return getComputedStyle(document.querySelector(arguments[0])).fontFamily", selector
    )

def run_entry(driver, suffix):
    driver.get(f"{BASE}/crypto-astro/btc?lang=ru")
    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".heroProductEntry")))
    time.sleep(0.4)
    h1 = driver.find_element(By.CSS_SELECTOR, ".heroProductCopy h1").text
    cta = driver.find_element(By.CSS_SELECTOR, ".heroDialogueCta")
    outcomes = driver.find_elements(By.CSS_SELECTOR, ".productOutcomeGrid article")
    check(f"entry_h1_{suffix}", "BTC Field" in h1 or "Чтение поля BTC" in h1, h1)
    check(f"entry_cta_{suffix}", "/crypto-astro/btc/live" in cta.get_attribute("href"), cta.text)
    check(f"entry_four_outcomes_{suffix}", len(outcomes) == 4, len(outcomes))
    check(f"entry_no_overflow_{suffix}", no_overflow(driver))
    family = font_family(driver, ".heroProductCopy h1").lower()
    check(f"entry_non_mono_voice_{suffix}", "mono" not in family and "consolas" not in family, family)
    driver.save_screenshot(str(OUT / f"entry-{suffix}.png"))

def run_live(driver, suffix):
    question = quote("Какие самые напряженные дни в 2026 году у планет и их аспектов")
    driver.get(f"{BASE}/crypto-astro/btc/live?lang=ru&q={question}")
    WebDriverWait(driver, 40).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".cosmographerTurn")))
    time.sleep(0.5)
    turn = driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")[-1]
    check(f"live_multi_body_subject_{suffix}", turn.get_attribute("data-route-subject") == "planetary_aspects", turn.get_attribute("data-route-subject"))
    check(f"live_annual_mode_{suffix}", turn.get_attribute("data-answer-mode") == "ASTRO_YEAR_OVERVIEW", turn.get_attribute("data-answer-mode"))
    cards = turn.find_elements(By.CSS_SELECTOR, ".astroWindowCard")
    check(f"live_five_windows_{suffix}", len(cards) == 5, len(cards))
    check(f"live_rank_one_present_{suffix}", bool(turn.find_elements(By.CSS_SELECTOR, '.astroWindowCard[data-window-rank="1"]')))
    check(f"live_direct_answer_{suffix}", bool(turn.find_element(By.CSS_SELECTOR, ".answerLead").text.strip()))
    check(f"live_next_step_{suffix}", bool(turn.find_elements(By.CSS_SELECTOR, ".answerNextStep")))
    check(f"live_proof_disclosure_{suffix}", bool(turn.find_elements(By.CSS_SELECTOR, ".answerSourceDisclosure")))
    check(f"live_no_overflow_{suffix}", no_overflow(driver))
    family = font_family(driver, ".answerLead").lower()
    check(f"live_non_mono_voice_{suffix}", "mono" not in family and "consolas" not in family, family)
    driver.save_screenshot(str(OUT / f"live-{suffix}.png"))

    driver.get(f"{BASE}/crypto-astro/btc/live?lang=en&q={quote('BTC today')}")
    WebDriverWait(driver, 40).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".cosmographerTurn")))
    market_turn = driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")[-1]
    check(f"btc_today_market_{suffix}", market_turn.get_attribute("data-route-domain") == "btc_market", market_turn.get_attribute("data-route-domain"))

for width, height, suffix in [(1440, 1100, "desktop"), (390, 844, "mobile")]:
    driver = make_driver(width, height)
    try:
        run_entry(driver, suffix)
        run_live(driver, suffix)
    finally:
        driver.quit()

failures = [row for row in checks if not row["passed"]]
report = {
    "schema": "btc_cosmographer_public_acceptance_two_screen_report_v0_1",
    "status": "FAIL" if failures else "PASS",
    "preview_base": BASE,
    "check_count": len(checks),
    "failure_count": len(failures),
    "checks": checks,
}
(OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if failures:
    raise SystemExit(json.dumps(failures, ensure_ascii=False))
print("BTC_PUBLIC_ACCEPTANCE_TWO_SCREEN=PASS")
