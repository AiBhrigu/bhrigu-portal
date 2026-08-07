#!/usr/bin/env python3
import json
import os
import re
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

DOMAIN_CASES = {
    "ru": [
        ("bitcoin_protocol", "Что мне нужно знать о халвинге?", "Протокол Bitcoin"),
        ("btc_market", "BTC today", "Рынок BTC"),
        ("snapshot_memory", "Что изменилось с прошлого Snapshot?", "Память Snapshot"),
        ("astromodule", "Какие аспекты планет важны в 2026 году?", "Астрономические данные"),
        ("astro_btc_bridge", "Как влияет Юпитер на Bitcoin?", "Астрономия × BTC"),
        ("methodology", "Какие источники использует Космограф?", "Метод и доказательность"),
        ("navigation", "Что ты умеешь?", "Навигация по полю BTC"),
        ("unsupported", "Дай точную цену BTC завтра", "Граница поддержки"),
    ],
    "en": [
        ("bitcoin_protocol", "What should I know about halving?", "Bitcoin Protocol"),
        ("btc_market", "BTC today", "BTC Market"),
        ("snapshot_memory", "What changed since the previous Snapshot?", "Snapshot Memory"),
        ("astromodule", "Which planetary aspects matter in 2026?", "Astronomical data"),
        ("astro_btc_bridge", "How does Jupiter affect Bitcoin?", "Astronomy × BTC"),
        ("methodology", "Which sources does Cosmographer use?", "Method and evidence"),
        ("navigation", "What can you do?", "BTC field navigation"),
        ("unsupported", "Give me the exact BTC price tomorrow", "Support boundary"),
    ],
}
RAW_DOMAINS = set(item[0] for rows in DOMAIN_CASES.values() for item in rows)


def check(name, passed, details=""):
    checks.append({"name": name, "passed": bool(passed), "details": str(details)[:600]})
    print(("PASS" if passed else "FAIL"), name, details)


def normalize(value):
    return re.sub(r"\s+", " ", value or "").strip()


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


def clear_session(driver, locale):
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}")
    WebDriverWait(driver, 40).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "form.liveComposer"))
    )
    driver.execute_script("window.sessionStorage.clear()")


def open_question(driver, locale, question):
    clear_session(driver, locale)
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}&q={quote(question)}")
    WebDriverWait(driver, 40).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "article.cosmographerTurn"))
    )
    WebDriverWait(driver, 40).until(
        lambda instance: instance.find_element(By.CSS_SELECTOR, "article.cosmographerTurn").get_attribute("data-route-domain")
    )
    return driver.find_element(By.CSS_SELECTOR, "article.cosmographerTurn")


def proof_contract(driver, turn, label, expected_domain, expected_label):
    proofs = turn.find_elements(By.CSS_SELECTOR, "details[data-answer-source-boundary='true']")
    check(f"{label}_proof_details_exists", len(proofs) == 1, len(proofs))
    if not proofs:
        return
    proof = proofs[0]
    summaries = proof.find_elements(By.CSS_SELECTOR, "summary")
    summary_text = normalize(summaries[0].text if summaries else "")
    check(f"{label}_proof_summary_visible", bool(summaries) and summaries[0].is_displayed())
    check(f"{label}_proof_summary_nonempty", bool(summary_text), summary_text)
    check(
        f"{label}_proof_default_state_allowed",
        proof.get_attribute("open") in (None, "true"),
        proof.get_attribute("open") or "collapsed",
    )
    machine_text = normalize(driver.execute_script("return arguments[0].textContent || ''", proof))
    domain_label = normalize(driver.execute_script(
        "return arguments[0].querySelector(':scope > div > span')?.textContent || ''", proof
    ))
    check(f"{label}_proof_machine_content_present", bool(machine_text) and len(machine_text) > len(summary_text), machine_text[:180])
    check(f"{label}_proof_domain_exact", domain_label == expected_label, domain_label)
    check(f"{label}_route_domain_exact", turn.get_attribute("data-route-domain") == expected_domain, turn.get_attribute("data-route-domain"))
    visible_body = normalize(driver.find_element(By.TAG_NAME, "body").text)
    leaked = sorted(domain for domain in RAW_DOMAINS if domain in visible_body)
    check(f"{label}_raw_domain_enum_visible_no", not leaked, leaked)
    check(f"{label}_proof_label_has_no_raw_enum", "_" not in domain_label, domain_label)


def run_entry(driver, suffix, locale):
    driver.get(f"{BASE}/crypto-astro/btc?lang={locale}")
    WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".heroProductEntry")))
    time.sleep(0.4)
    h1 = driver.find_element(By.CSS_SELECTOR, ".heroProductCopy h1").text
    cta = driver.find_element(By.CSS_SELECTOR, ".heroDialogueCta")
    outcomes = driver.find_elements(By.CSS_SELECTOR, ".productOutcomeGrid article")
    check(f"entry_h1_{locale}_{suffix}", "BTC Field" in h1 or "Чтение поля BTC" in h1, h1)
    check(f"entry_cta_{locale}_{suffix}", "/crypto-astro/btc/live" in cta.get_attribute("href"), cta.text)
    check(f"entry_four_outcomes_{locale}_{suffix}", len(outcomes) == 4, len(outcomes))
    check(f"entry_no_overflow_{locale}_{suffix}", no_overflow(driver))
    family = font_family(driver, ".heroProductCopy h1").lower()
    check(f"entry_non_mono_voice_{locale}_{suffix}", "mono" not in family and "consolas" not in family, family)
    body = driver.find_element(By.TAG_NAME, "body").text
    check(
        f"entry_no_public_deployment_debug_{locale}_{suffix}",
        "Deployment source" not in body and "Источник публикации" not in body,
    )
    snapshot_height = driver.find_element(By.CSS_SELECTOR, ".snapshotTruthStrip").rect["height"]
    snapshot_limit = 180 if locale == "ru" and suffix == "mobile" else 150
    check(f"entry_compact_snapshot_{locale}_{suffix}", snapshot_height < snapshot_limit, f"{snapshot_height} < {snapshot_limit}")
    driver.save_screenshot(str(OUT / f"entry-{locale}-{suffix}.png"))


def run_live(driver, suffix, locale):
    question = (
        "Какие самые напряженные дни в 2026 году у планет и их аспектов"
        if locale == "ru"
        else "Which planetary aspect days are most intense in 2026?"
    )
    turn = open_question(driver, locale, question)
    time.sleep(0.5)
    check(f"live_multi_body_subject_{locale}_{suffix}", turn.get_attribute("data-route-subject") == "planetary_aspects", turn.get_attribute("data-route-subject"))
    check(f"live_annual_mode_{locale}_{suffix}", turn.get_attribute("data-answer-mode") == "ASTRO_YEAR_OVERVIEW", turn.get_attribute("data-answer-mode"))
    cards = turn.find_elements(By.CSS_SELECTOR, ".astroWindowCard")
    check(f"live_five_windows_{locale}_{suffix}", len(cards) == 5, len(cards))
    check(f"live_rank_one_present_{locale}_{suffix}", bool(turn.find_elements(By.CSS_SELECTOR, '.astroWindowCard[data-window-rank="1"]')))
    check(f"live_direct_answer_{locale}_{suffix}", bool(turn.find_element(By.CSS_SELECTOR, ".answerLead").text.strip()))
    check(f"live_next_step_{locale}_{suffix}", bool(turn.find_elements(By.CSS_SELECTOR, ".answerNextStep")))
    proof_contract(
        driver,
        turn,
        f"live_annual_{locale}_{suffix}",
        "astromodule",
        "Астрономические данные" if locale == "ru" else "Astronomical data",
    )
    check(f"live_no_overflow_{locale}_{suffix}", no_overflow(driver))
    family = font_family(driver, ".answerLead").lower()
    check(f"live_non_mono_voice_{locale}_{suffix}", "mono" not in family and "consolas" not in family, family)
    driver.save_screenshot(str(OUT / f"live-{locale}-{suffix}.png"))

    market_turn = open_question(driver, locale, "BTC today")
    check(f"btc_today_market_{locale}_{suffix}", market_turn.get_attribute("data-route-domain") == "btc_market", market_turn.get_attribute("data-route-domain"))


def run_domain_label_matrix(driver):
    for locale, cases in DOMAIN_CASES.items():
        for expected_domain, question, expected_label in cases:
            turn = open_question(driver, locale, question)
            proof_contract(
                driver,
                turn,
                f"domain_{locale}_{expected_domain}",
                expected_domain,
                expected_label,
            )


for width, height, suffix in [(1440, 1100, "desktop"), (390, 844, "mobile")]:
    driver = make_driver(width, height)
    try:
        for locale in ("ru", "en"):
            run_entry(driver, suffix, locale)
            run_live(driver, suffix, locale)
        if suffix == "desktop":
            run_domain_label_matrix(driver)
    finally:
        driver.quit()

failures = [row for row in checks if not row["passed"]]
report = {
    "schema": "btc_cosmographer_public_acceptance_two_screen_report_v0_2",
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
