import json
import os
from urllib.parse import quote, urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "http://127.0.0.1:3000/crypto-astro/btc/live"
SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3"

options = webdriver.ChromeOptions()
for argument in (
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--window-size=1280,1000",
):
    options.add_argument(argument)

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 30)
trace = {"schema": "btc_date_return_packet_trace_v0_1", "steps": []}


def session_value():
    raw = driver.execute_script(
        "return window.sessionStorage.getItem(arguments[0]);", SESSION_KEY
    )
    return json.loads(raw) if raw else None


def form_values():
    form = wait.until(
        lambda d: d.find_element(By.CSS_SELECTOR, 'form.liveComposer[data-session-hydrated="true"]')
    )
    values = {}
    for node in form.find_elements(By.CSS_SELECTOR, "input[type='hidden']"):
        values[node.get_attribute("name")] = node.get_attribute("value")
    return values


def turn_values():
    values = []
    for node in driver.find_elements(By.CSS_SELECTOR, "article[data-route-domain]"):
        values.append({
            "domain": node.get_attribute("data-route-domain"),
            "subject": node.get_attribute("data-route-subject"),
            "relation": node.get_attribute("data-context-relation"),
            "disposition": node.get_attribute("data-route-disposition"),
        })
    return values


def snapshot(label):
    session = session_value()
    trace["steps"].append({
        "label": label,
        "url": driver.current_url,
        "query": parse_qs(urlparse(driver.current_url).query),
        "form": form_values(),
        "session": session,
        "turns": turn_values(),
    })


def submit(question):
    previous = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage")
    textarea = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, 'textarea[name="q"]'))
    textarea.clear()
    textarea.send_keys(question)
    driver.execute_script(
        "arguments[0].requestSubmit()",
        driver.find_element(By.CSS_SELECTOR, "form.liveComposer"),
    )
    wait.until(EC.staleness_of(previous))
    wait.until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")
    )
    wait.until(
        lambda d: d.find_elements(By.CSS_SELECTOR, 'form.liveComposer[data-session-hydrated="true"]')
    )


try:
    driver.get(f"{BASE}?lang=en")
    driver.execute_script("window.sessionStorage.clear()")
    driver.get(
        f"{BASE}?lang=en&q={quote('Where is Jupiter on August 6, 2026?')}"
    )
    snapshot("after_t1")

    submit("Now switch to the Bitcoin protocol.")
    snapshot("after_t2_before_return")

    submit("Return to the previous topic.")
    snapshot("after_t3_return")
finally:
    driver.quit()

os.makedirs("artifacts", exist_ok=True)
path = "artifacts/btc-date-return-packet-trace.json"
with open(path, "w", encoding="utf-8") as handle:
    json.dump(trace, handle, ensure_ascii=False, indent=2)
print(json.dumps(trace, ensure_ascii=False))
