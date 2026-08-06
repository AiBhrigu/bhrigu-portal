import json
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, quote, urlencode, urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "http://127.0.0.1:3000/crypto-astro/btc/live"
SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3"


def make_driver():
    options = webdriver.ChromeOptions()
    for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1280,1000"):
        options.add_argument(argument)
    return webdriver.Chrome(options=options)


def session_state(driver):
    raw = driver.execute_script("return window.sessionStorage.getItem(arguments[0])", SESSION_KEY)
    return json.loads(raw) if raw else None


def wait_session_turn(driver, wait, expected_user_text=None):
    def hydrated(d):
        session = session_state(d)
        if not session or not session.get("turns"):
            return False
        if expected_user_text is None:
            return session
        return session if session["turns"][-1].get("user_text") == expected_user_text else False
    return wait.until(hydrated)


def newest_exchange(driver, wait):
    wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")) > 0)
    return driver.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")[-1]


def capture(driver, wait, name, expected_date, locale, expected_user_text):
    stage = "live_shell"
    wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, ".liveDialogueShell"))
    stage = "session_hydration"
    session = wait_session_turn(driver, wait, expected_user_text)
    stage = "newest_exchange"
    exchange = newest_exchange(driver, wait)
    stage = "source_disclosure"
    details = exchange.find_element(By.CSS_SELECTOR, 'details[data-answer-source-boundary="true"]')
    driver.execute_script("arguments[0].open = true", details)
    stage = "observation_period_field"
    field = details.find_element(By.CSS_SELECTOR, '[data-evidence-field="observation-period"]')
    stage = "read_semantics"
    latest = session["turns"][-1]
    query = parse_qs(urlparse(driver.current_url).query)
    expected_dom = (
        f"{expected_date[8:10]}.{expected_date[5:7]}.{expected_date[:4]} UTC"
        if locale == "ru"
        else datetime.strptime(expected_date, "%Y-%m-%d").strftime("%d %b %Y").upper()
    )
    result = {
        "name": name,
        "locale": locale,
        "expected_date": expected_date,
        "current_url": driver.current_url,
        "url_date": (query.get("d") or [None])[0],
        "url_return_start": (query.get("rct0") or [None])[0],
        "url_return_end": (query.get("rct1") or [None])[0],
        "visible_text": field.text,
        "data_evidence_value": field.get_attribute("data-evidence-value") or "",
        "route_time_start": latest.get("time_start"),
        "route_time_end": latest.get("time_end"),
        "session_observation_date": latest.get("observation_date"),
        "session_user_text": latest.get("user_text"),
        "route_domain": exchange.get_attribute("data-route-domain") or "",
        "route_subject": exchange.get_attribute("data-route-subject") or "",
        "context_relation": exchange.get_attribute("data-context-relation") or "",
        "details_open": details.get_attribute("open") is not None,
        "completed_stage": stage,
    }
    result["checks"] = {
        "exact_date_in_route": latest.get("time_start") == expected_date and latest.get("time_end") == expected_date,
        "exact_date_in_session": latest.get("observation_date") == expected_date,
        "exact_date_in_dom_attribute": result["data_evidence_value"] == expected_dom,
        "exact_date_visible_after_disclosure_open": expected_dom in result["visible_text"],
        "details_open": result["details_open"],
    }
    result["status"] = "PASS" if all(result["checks"].values()) else "FAIL"
    return result


def open_direct(driver, wait, name, locale, question, date):
    driver.get(f"{BASE}?lang={locale}")
    driver.execute_script("window.sessionStorage.clear()")
    driver.get(f"{BASE}?{urlencode({'lang': locale, 'q': question, 'd': date})}")
    return capture(driver, wait, name, date, locale, question)


def submit(driver, wait, question):
    previous = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage")
    form = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, "form.liveComposer"))
    textarea = form.find_element(By.CSS_SELECTOR, 'textarea[name="q"]')
    textarea.clear()
    textarea.send_keys(question)
    driver.execute_script("arguments[0].requestSubmit()", form)
    wait.until(EC.staleness_of(previous))
    wait_session_turn(driver, wait, question)


def open_ru_named_date_return(driver, wait):
    driver.get(f"{BASE}?lang=ru")
    driver.execute_script("window.sessionStorage.clear()")
    q1 = "Где находится Юпитер 6 августа 2026 года?"
    q2 = "Теперь перейди к протоколу Bitcoin."
    q3 = "Вернись к предыдущей теме."
    driver.get(f"{BASE}?lang=ru&q={quote(q1)}")
    wait_session_turn(driver, wait, q1)
    submit(driver, wait, q2)
    submit(driver, wait, q3)
    result = capture(driver, wait, "ru_named_date_followup_explicit_return", "2026-08-06", "ru", q3)
    result["checks"]["explicit_return_relation"] = result["context_relation"] == "RETURN_TO_PREVIOUS_TOPIC"
    result["checks"]["url_return_packet_exact"] = (
        result["url_return_start"] == "2026-08-06" and result["url_return_end"] == "2026-08-06"
    )
    result["status"] = "PASS" if all(result["checks"].values()) else "FAIL"
    return result


def run_case(results, driver, wait, name, callback):
    try:
        result = callback()
        results.append(result)
        print(json.dumps({"case": name, "status": result["status"], "result": result}, ensure_ascii=False))
    except Exception as exc:
        failure = {
            "name": name,
            "status": "HARNESS_ERROR",
            "error": f"{type(exc).__name__}: {exc}",
            "current_url": driver.current_url,
            "body_excerpt": driver.find_element(By.TAG_NAME, "body").text[:2000] if driver.find_elements(By.TAG_NAME, "body") else "",
            "session": session_state(driver),
        }
        results.append(failure)
        print(json.dumps({"case": name, "status": "HARNESS_ERROR", "result": failure}, ensure_ascii=False))


def main():
    driver = make_driver()
    wait = WebDriverWait(driver, 40)
    results = []
    try:
        run_case(results, driver, wait, "en_selected_2026_08_07", lambda: open_direct(
            driver, wait, "en_selected_2026_08_07", "en",
            "How does the selected date change temporal pressure?", "2026-08-07",
        ))
        run_case(results, driver, wait, "en_selected_2030_01_01", lambda: open_direct(
            driver, wait, "en_selected_2030_01_01", "en",
            "How does the selected date change temporal pressure?", "2030-01-01",
        ))
        run_case(results, driver, wait, "ru_selected_2026_08_06", lambda: open_direct(
            driver, wait, "ru_selected_2026_08_06", "ru",
            "Как выбранная дата меняет временное давление?", "2026-08-06",
        ))
        run_case(results, driver, wait, "ru_named_date_followup_explicit_return", lambda: open_ru_named_date_return(driver, wait))
    finally:
        driver.quit()
    report = {
        "schema": "btc_temporal_semantic_dom_proof_v0_2",
        "status": "PASS" if len(results) == 4 and all(item["status"] == "PASS" for item in results) else "FAIL",
        "product_code_mutation": "NONE",
        "results": results,
    }
    os.makedirs("artifacts", exist_ok=True)
    Path("artifacts/btc-temporal-semantic-dom-proof.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False))
    if report["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
