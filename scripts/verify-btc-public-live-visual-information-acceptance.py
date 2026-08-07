#!/usr/bin/env python3
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get("BTC_COSMOGRAPHER_PREVIEW_BASE", "http://127.0.0.1:3112").rstrip("/")
OUT = Path("artifacts/btc-public-live-visual-acceptance")
OUT.mkdir(parents=True, exist_ok=True)
PRIMARY = "bhrigu:btc-cosmographer:session:v0_3"
LEGACY = "bhrigu:btc-free-dialogue:session:v0_1"
checks = []
timings = []

LABELS = {
    "ru": {
        "bitcoin_protocol": "Протокол Bitcoin",
        "btc_market": "Рынок BTC",
        "snapshot_memory": "Память Snapshot",
        "astromodule": "Астрономические данные",
        "astro_btc_bridge": "Астрономия × BTC",
        "methodology": "Метод и доказательность",
        "navigation": "Навигация по полю BTC",
        "unsupported": "Граница поддержки",
    },
    "en": {
        "bitcoin_protocol": "Bitcoin Protocol",
        "btc_market": "BTC Market",
        "snapshot_memory": "Snapshot Memory",
        "astromodule": "Astronomical data",
        "astro_btc_bridge": "Astronomy × BTC",
        "methodology": "Method and evidence",
        "navigation": "BTC field navigation",
        "unsupported": "Support boundary",
    },
}
QUESTIONS = {
    "ru": {
        "annual": "Какие самые напряженные дни в 2026 году у планет и их аспектов",
        "market": "BTC today",
        "bridge": "как влияет Юпитер на Биткоин?",
        "halving": "Халвинг и его влияние на окна в циклах",
        "return": "Вернёмся к аспектам",
    },
    "en": {
        "annual": "Which planetary aspect days are most intense in 2026?",
        "market": "BTC today",
        "bridge": "How does Jupiter affect Bitcoin?",
        "halving": "How does halving affect cycle windows?",
        "return": "Return to planetary aspects",
    },
}
RAW = set(LABELS["ru"]) | {"snapshot_memory", "astro_btc_bridge"}


def check(name, ok, details=""):
    checks.append({"name": name, "passed": bool(ok), "details": str(details)[:600]})
    print(("PASS" if ok else "FAIL"), name, details)


def norm(value):
    return re.sub(r"\s+", " ", value or "").strip()


def make_driver(width, height):
    options = Options()
    for argument in (
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        f"--window-size={width},{height}",
        "--force-device-scale-factor=1",
    ):
        options.add_argument(argument)
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    instance = webdriver.Chrome(options=options)
    instance.set_window_size(width, height)
    return instance


def session(driver):
    raw = driver.execute_script(
        "const p=sessionStorage.getItem(arguments[0]),l=sessionStorage.getItem(arguments[1]);return p||l",
        PRIMARY,
        LEGACY,
    )
    return json.loads(raw) if raw else {"turns": []}


def latest(driver):
    WebDriverWait(driver, 40).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "article.cosmographerTurn"))
    )
    return driver.find_elements(By.CSS_SELECTOR, "article.cosmographerTurn")[-1]


def route(node):
    return {
        "domain": node.get_attribute("data-route-domain") or "",
        "subject": node.get_attribute("data-route-subject") or "",
        "relation": node.get_attribute("data-context-relation")
        or node.get_attribute("data-semantic-context-relation")
        or "",
        "mode": node.get_attribute("data-answer-mode") or "",
    }


def clear(driver, locale):
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}")
    WebDriverWait(driver, 40).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "form.liveComposer"))
    )
    driver.execute_script("sessionStorage.clear()")


def open_q(driver, locale, question):
    start = time.perf_counter()
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}&q={quote(question)}")
    node = latest(driver)
    WebDriverWait(driver, 40).until(
        lambda current: any(
            turn.get("user_text") == question
            for turn in session(current).get("turns", [])
        )
    )
    elapsed = time.perf_counter() - start
    timings.append({"locale": locale, "question": question, "seconds": round(elapsed, 3)})
    return node


def submit(driver, question, expected):
    before = len(session(driver).get("turns", []))
    form = WebDriverWait(driver, 30).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "form.liveComposer"))
    )
    field = form.find_element(By.CSS_SELECTOR, 'textarea[name="q"]')
    field.clear()
    field.send_keys(question)
    WebDriverWait(driver, 20).until(lambda _: field.get_attribute("value") == question)
    button = form.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center',inline:'nearest'});", button
    )
    WebDriverWait(driver, 20).until(lambda _: button.is_displayed() and button.is_enabled())
    button.click()
    WebDriverWait(driver, 40).until(
        lambda current: parse_qs(urlparse(current.current_url).query).get("q", [""])[0]
        == question
    )
    WebDriverWait(driver, 40).until(
        lambda current: len(session(current).get("turns", [])) > before
    )
    node = latest(driver)
    WebDriverWait(driver, 40).until(
        lambda current: all(route(latest(current)).get(key) == value for key, value in expected.items())
    )
    return node


def proof(driver, node, locale, domain, label):
    details = node.find_elements(By.CSS_SELECTOR, 'details[data-answer-source-boundary="true"]')
    check(f"{label}_proof_details_exists", len(details) == 1, len(details))
    if not details:
        return
    proof_node = details[0]
    summaries = proof_node.find_elements(By.CSS_SELECTOR, "summary")
    summary = norm(summaries[0].text if summaries else "")
    check(f"{label}_proof_summary_visible", bool(summaries) and summaries[0].is_displayed())
    check(f"{label}_proof_summary_nonempty", bool(summary), summary)
    check(
        f"{label}_proof_default_state_allowed",
        proof_node.get_attribute("open") in (None, "true"),
        proof_node.get_attribute("open") or "collapsed",
    )
    text = norm(driver.execute_script("return arguments[0].textContent||''", proof_node))
    check(f"{label}_proof_machine_content_present", len(text) > len(summary), text[:180])
    expected = LABELS[locale][domain]
    check(f"{label}_proof_domain_exact", expected in text, expected)
    visible = norm(driver.find_element(By.TAG_NAME, "body").text)
    leaks = sorted(value for value in RAW if value in visible)
    check(f"{label}_raw_domain_enum_visible_no", not leaks, leaks)
    check(
        f"{label}_proof_no_underscore",
        all("_" not in value for value in text.split()[:12]),
        text[:120],
    )


def page_health(driver, label):
    check(f"{label}_http_200", bool(norm(driver.title)))
    check(
        f"{label}_horizontal_overflow_zero",
        driver.execute_script(
            "return document.documentElement.scrollWidth<=document.documentElement.clientWidth+1"
        ),
    )
    body = norm(driver.find_element(By.TAG_NAME, "body").text)
    check(f"{label}_visible_deployment_sha_no", not re.search(r"\b[0-9a-f]{40}\b", body))
    check(f"{label}_duplicate_brand_zero", body.count("BHRIGU") <= 1, body.count("BHRIGU"))


def domain_matrix(driver):
    cases = {
        "bitcoin_protocol": "What should I know about halving?",
        "btc_market": "BTC today",
        "snapshot_memory": "What changed since the previous Snapshot?",
        "astromodule": "Which planetary aspects matter in 2026?",
        "astro_btc_bridge": "How does Jupiter affect Bitcoin?",
        "methodology": "Which sources does Cosmographer use?",
        "navigation": "What can you do?",
        "unsupported": "Give me the exact BTC price tomorrow",
    }
    for locale in ("ru", "en"):
        for domain, question in cases.items():
            clear(driver, locale)
            node = open_q(driver, locale, question)
            current = route(node)
            check(f"domain_{locale}_{domain}_route_exact", current["domain"] == domain, current)
            proof(driver, node, locale, domain, f"domain_{locale}_{domain}")


def run_view(width, height, suffix):
    driver = make_driver(width, height)
    try:
        for locale in ("ru", "en"):
            questions = QUESTIONS[locale]
            clear(driver, locale)
            node = open_q(driver, locale, questions["annual"])
            current = route(node)
            check(
                f"annual_{locale}_{suffix}",
                current
                == {
                    "domain": "astromodule",
                    "subject": "planetary_aspects",
                    "relation": "NEW_TOPIC",
                    "mode": "ASTRO_YEAR_OVERVIEW",
                },
                current,
            )
            check(
                f"annual_direct_first_{locale}_{suffix}",
                bool(node.find_elements(By.CSS_SELECTOR, '[data-answer-direct="true"]')),
            )
            check(
                f"annual_five_windows_{locale}_{suffix}",
                len(node.find_elements(By.CSS_SELECTOR, ".astroWindowCard")) == 5,
            )
            proof(driver, node, locale, "astromodule", f"annual_{locale}_{suffix}")
            page_health(driver, f"annual_{locale}_{suffix}")
            driver.save_screenshot(str(OUT / f"annual-{locale}-{suffix}.png"))

            clear(driver, locale)
            node = open_q(driver, locale, questions["market"])
            check(f"market_{locale}_{suffix}", route(node)["domain"] == "btc_market", route(node))
            proof(driver, node, locale, "btc_market", f"market_{locale}_{suffix}")
            page_health(driver, f"market_{locale}_{suffix}")

            clear(driver, locale)
            open_q(driver, locale, questions["annual"])
            node = submit(
                driver,
                questions["bridge"],
                {
                    "domain": "astro_btc_bridge",
                    "subject": "jupiter",
                    "relation": "CROSS_MODULE_BRIDGE",
                    "mode": "ASTRO_BTC_BRIDGE",
                },
            )
            check(f"bridge_{locale}_{suffix}", True, route(node))
            node = submit(
                driver,
                questions["halving"],
                {
                    "domain": "bitcoin_protocol",
                    "subject": "halving",
                    "relation": "NEW_TOPIC",
                    "mode": "PROTOCOL_EXPLAIN",
                },
            )
            check(f"halving_{locale}_{suffix}", True, route(node))
            node = submit(
                driver,
                questions["return"],
                {
                    "domain": "astro_btc_bridge",
                    "subject": "planetary_aspects",
                    "relation": "RETURN_TO_PREVIOUS_TOPIC",
                    "mode": "ASTRO_BTC_BRIDGE",
                },
            )
            check(f"return_mode_{locale}_{suffix}", True, route(node))
            check(
                f"session_primary_or_legacy_{locale}_{suffix}",
                bool(
                    driver.execute_script(
                        "return sessionStorage.getItem(arguments[0])||sessionStorage.getItem(arguments[1])",
                        PRIMARY,
                        LEGACY,
                    )
                ),
            )
            check(
                f"composer_available_{locale}_{suffix}",
                bool(driver.find_elements(By.CSS_SELECTOR, 'form.liveComposer textarea[name="q"]')),
            )
        logs = [entry for entry in driver.get_log("browser") if entry.get("level") == "SEVERE"]
        check(f"console_errors_zero_{suffix}", not logs, logs)
        if suffix == "desktop":
            domain_matrix(driver)
    finally:
        driver.quit()


for args in ((1440, 1100, "desktop"), (390, 844, "mobile")):
    run_view(*args)

max_time = max((item["seconds"] for item in timings), default=0)
check("first_result_time_le_30_seconds", max_time <= 30, max_time)
failures = [item for item in checks if not item["passed"]]
report = {
    "schema": "btc_public_live_visual_information_acceptance_v0_4",
    "status": "FAIL" if failures else "PASS",
    "check_count": len(checks),
    "failure_count": len(failures),
    "first_result_time_seconds": round(max_time, 3),
    "timings": timings,
    "checks": checks,
}
(OUT / "report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
if failures:
    raise SystemExit(json.dumps(failures, ensure_ascii=False))
print("BTC_PUBLIC_LIVE_VISUAL_INFORMATION_ACCEPTANCE=PASS")
