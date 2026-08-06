import json
import os
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


def wait_hydrated(driver, wait):
    wait.until(lambda d: d.find_elements(By.CSS_SELECTOR, '[data-session-hydrated="true"]'))


def newest_exchange(driver, wait):
    wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")) > 0)
    return driver.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")[-1]


def capture(driver, wait, name, expected_date, locale):
    wait_hydrated(driver, wait)
    exchange = newest_exchange(driver, wait)
    details = exchange.find_element(By.CSS_SELECTOR, 'details[data-answer-source-boundary="true"]')
    if not details.get_attribute("open"):
        driver.execute_script("arguments[0].open = true", details)
    field = details.find_element(By.CSS_SELECTOR, '[data-evidence-field="observation-period"]')
    wait.until(lambda _: field.is_displayed())
    session = session_state(driver)
    latest = session["turns"][-1]
    query = parse_qs(urlparse(driver.current_url).query)
    expected_dom = (
        f"{expected_date[8:10]}.{expected_date[5:7]}.{expected_date[:4]} UTC"
        if locale == "ru"
        else __import__("datetime").datetime.strptime(expected_date, "%Y-%m-%d").strftime("%d %b %Y").upper()
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
    return capture(driver, wait, name, date, locale)


def submit(driver, wait, question):
    previous = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage")
    form = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, "form.liveComposer"))
    textarea = form.find_element(By.CSS_SELECTOR, 'textarea[name="q"]')
    textarea.clear()
    textarea.send_keys(question)
    driver.execute_script("arguments[0].requestSubmit()", form)
    wait.until(EC.staleness_of(previous))
    wait_hydrated(driver, wait)


def open_ru_named_date_return(driver, wait):
    driver.get(f"{BASE}?lang=ru")
    driver.execute_script("window.sessionStorage.clear()")
    q1 = "Где находится Юпитер 6 августа 2026 года?"
    driver.get(f"{BASE}?lang=ru&q={quote(q1)}")
    wait_hydrated(driver, wait)
    submit(driver, wait, "Теперь перейди к протоколу Bitcoin.")
    submit(driver, wait, "Вернись к предыдущей теме.")
    result = capture(driver, wait, "ru_named_date_followup_explicit_return", "2026-08-06", "ru")
    result["checks"]["explicit_return_relation"] = result["context_relation"] == "RETURN_TO_PREVIOUS_TOPIC"
    result["checks"]["url_return_packet_exact"] = (
        result["url_return_start"] == "2026-08-06" and result["url_return_end"] == "2026-08-06"
    )
    result["status"] = "PASS" if all(result["checks"].values()) else "FAIL"
    return result


def main():
    driver = make_driver()
    wait = WebDriverWait(driver, 40)
    results = []
    error = None
    try:
        results.append(open_direct(
            driver, wait, "en_selected_2026_08_07", "en",
            "How does the selected date change temporal pressure?", "2026-08-07",
        ))
        results.append(open_direct(
            driver, wait, "en_selected_2030_01_01", "en",
            "How does the selected date change temporal pressure?", "2030-01-01",
        ))
        results.append(open_direct(
            driver, wait, "ru_selected_2026_08_06", "ru",
            "Как выбранная дата меняет временное давление?", "2026-08-06",
        ))
        results.append(open_ru_named_date_return(driver, wait))
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"
    finally:
        driver.quit()
    report = {
        "schema": "btc_temporal_semantic_dom_proof_v0_1",
        "status": "PASS" if error is None and len(results) == 4 and all(item["status"] == "PASS" for item in results) else "FAIL",
        "product_code_mutation": "NONE",
        "results": results,
        "error": error,
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
