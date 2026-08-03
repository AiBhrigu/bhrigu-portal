import base64
import json
import os
from pathlib import Path
from urllib.parse import urlencode

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get("BTC_COSMOGRAPHER_PREVIEW_BASE", "http://127.0.0.1:3110").rstrip("/")
REQUIRED_SESSION_SCHEMA = os.environ.get("BTC_COSMOGRAPHER_REQUIRED_SESSION_SCHEMA", "").strip()
EXPECTED_DEPLOYMENT_SHA = os.environ.get("BTC_COSMOGRAPHER_EXPECTED_DEPLOYMENT_SHA", "").strip()
CONTEXT_FIELDS = ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"]
SESSION_CONTRACTS = {
    "btc_cosmographer_dialogue_session_v0_2": {
        "key": "bhrigu:btc-free-dialogue:session:v0_1",
        "stale_keys": ["bhrigu:btc-cosmographer:session:v0_2"],
    },
    "btc_cosmographer_dialogue_session_v0_3": {
        "key": "bhrigu:btc-cosmographer:session:v0_3",
        "stale_keys": [
            "bhrigu:btc-free-dialogue:session:v0_1",
            "bhrigu:btc-cosmographer:session:v0_1",
            "bhrigu:btc-cosmographer:session:v0_2",
        ],
    },
}

options = webdriver.ChromeOptions()
for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"):
    options.add_argument(argument)
driver = webdriver.Chrome(options=options)
report = {
    "schema": "btc_cosmographer_visual_report_v0_2",
    "checks": {},
    "failures": [],
    "session_contract": None,
}


def mark(name, passed, detail=None):
    report["checks"][name] = bool(passed)
    if not passed:
        report["failures"].append({"check": name, "detail": detail})


def wait_answer():
    return WebDriverWait(driver, 60).until(
        lambda d: d.find_element(By.CSS_SELECTOR, ".dialogueExchange:last-child .cosmographerTurn")
    )


def projection():
    node = wait_answer()
    return {
        "domain": node.get_attribute("data-route-domain"),
        "subject": node.get_attribute("data-route-subject"),
        "relation": node.get_attribute("data-context-relation"),
        "mode": node.get_attribute("data-answer-mode"),
        "text": node.text,
    }


def context_packet():
    packet = {}
    for name in CONTEXT_FIELDS:
        packet[name] = driver.find_element(By.CSS_SELECTOR, f"input[name='{name}']").get_attribute("value")
    return packet


def open_question(question, context=None):
    params = {"lang": "ru", "q": question}
    if context:
        params.update(context)
    driver.get(f"{BASE}/crypto-astro/btc/live?{urlencode(params)}")
    return projection()


def no_overflow():
    return driver.execute_script(
        "return document.documentElement.scrollWidth <= window.innerWidth + 1"
    )


def full_screenshot(path):
    metrics = driver.execute_cdp_cmd("Page.getLayoutMetrics", {})
    size = metrics["cssContentSize"]
    payload = driver.execute_cdp_cmd("Page.captureScreenshot", {
        "format": "png",
        "captureBeyondViewport": True,
        "clip": {"x": 0, "y": 0, "width": size["width"], "height": size["height"], "scale": 1},
    })
    Path(path).write_bytes(base64.b64decode(payload["data"]))


def resolve_session_contract():
    schema = driver.execute_script(
        "const root=document.querySelector('main[data-session-schema]');"
        "const meta=document.querySelector('meta[name=\"btc-dialogue-session-schema\"]');"
        "return (root && root.dataset.sessionSchema) || (meta && meta.content) || '';"
    )
    if not schema:
        schema = "btc_cosmographer_dialogue_session_v0_2"
    supported = schema in SESSION_CONTRACTS
    mark("session_schema_supported", supported, schema)
    if REQUIRED_SESSION_SCHEMA:
        mark("required_session_schema", schema == REQUIRED_SESSION_SCHEMA, {
            "actual": schema,
            "required": REQUIRED_SESSION_SCHEMA,
        })
    contract = SESSION_CONTRACTS.get(schema)
    report["session_contract"] = {
        "schema": schema,
        "key": contract["key"] if contract else None,
        "required_schema": REQUIRED_SESSION_SCHEMA or None,
    }
    return schema, contract


def clear_session(contract):
    keys = [contract["key"], *contract["stale_keys"]]
    driver.execute_script(
        "for (const key of arguments[0]) sessionStorage.removeItem(key);",
        keys,
    )


def read_session_fail_closed(schema, contract):
    if contract is None:
        return None
    try:
        stored = WebDriverWait(driver, 30).until(
            lambda d: d.execute_script(
                "return sessionStorage.getItem(arguments[0]);",
                contract["key"],
            ) or False
        )
    except TimeoutException:
        mark("session_storage_present", False, {"key": contract["key"], "schema": schema})
        return None

    mark("session_storage_present", True, {"key": contract["key"], "schema": schema})
    try:
        session = json.loads(stored)
    except (TypeError, json.JSONDecodeError) as error:
        mark("session_json_valid", False, str(error))
        return None
    mark("session_json_valid", True)
    mark("session_schema_matches_runtime", session.get("schema") == schema, {
        "actual": session.get("schema"),
        "expected": schema,
    })
    return session


try:
    Path("artifacts").mkdir(exist_ok=True)
    driver.set_window_size(1440, 1200)
    driver.get(f"{BASE}/crypto-astro/btc/live?lang=ru")
    WebDriverWait(driver, 60).until(lambda d: d.find_element(By.CSS_SELECTOR, "textarea[name='q']"))
    session_schema, session_contract = resolve_session_contract()
    if session_contract:
        clear_session(session_contract)

    if EXPECTED_DEPLOYMENT_SHA:
        served_head = driver.execute_script(
            "const root=document.querySelector('main[data-deployment-head-sha]');"
            "const meta=document.querySelector('meta[name=\"btc-deployment-source-sha\"]');"
            "return (root && root.dataset.deploymentHeadSha) || (meta && meta.content) || '';"
        )
        mark("deployment_sha_matches", served_head == EXPECTED_DEPLOYMENT_SHA, {
            "actual": served_head,
            "expected": EXPECTED_DEPLOYMENT_SHA,
        })

    supply = open_question("Какое количество монет BTC?")
    mark("supply_protocol", supply["domain"] == "bitcoin_protocol" and supply["subject"] == "supply", supply)
    mark("supply_fact_mode", supply["mode"] == "PROTOCOL_FACT", supply)
    mark("supply_direct", "20 999 999,9769" in supply["text"], supply["text"])
    mark("desktop_no_overflow_supply", no_overflow())

    jupiter = open_question("Юпитер как повлиял за 6 месяцев в 2026 году?", context_packet())
    mark("jupiter_new_topic", jupiter["domain"] == "astromodule" and jupiter["subject"] == "jupiter" and jupiter["relation"] == "NEW_TOPIC", jupiter)
    mark("jupiter_interval", jupiter["mode"] == "ASTRO_INTERVAL", jupiter)
    mark("jupiter_evidence", "2026-03-11" in jupiter["text"] and "2026-06-30" in jupiter["text"], jupiter["text"])

    bridge = open_question("А ликвидность это подтверждает?", context_packet())
    mark("cross_module_bridge", bridge["domain"] == "astro_btc_bridge" and bridge["subject"] == "jupiter" and bridge["relation"] == "CROSS_MODULE_BRIDGE", bridge)
    mark("bridge_mode", bridge["mode"] == "ASTRO_BTC_BRIDGE", bridge)

    halving = open_question("Теперь вернемся к халвингу", context_packet())
    mark("return_to_halving", halving["domain"] == "bitcoin_protocol" and halving["subject"] == "halving" and halving["relation"] == "RETURN_TO_PREVIOUS_TOPIC", halving)
    mark("four_turn_thread", len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 4)
    mark("desktop_no_overflow_thread", no_overflow())
    full_screenshot("artifacts/btc-cosmographer-route-desktop.png")

    session = read_session_fail_closed(session_schema, session_contract)
    if session is not None:
        mark("session_four_turns", len(session.get("turns", [])) == 4)
        mark("session_no_transcript_transport", all(
            "prior_answer_text" not in json.dumps(turn)
            for turn in session.get("turns", [])
        ))
    else:
        mark("session_four_turns", False, "session unavailable")
        mark("session_no_transcript_transport", False, "session unavailable")

    driver.set_window_size(390, 844)
    if session_contract:
        clear_session(session_contract)
    mobile = open_question("Юпитер как повлиял за 6 месяцев в 2026 году?")
    mark("mobile_astromodule", mobile["domain"] == "astromodule" and mobile["mode"] == "ASTRO_INTERVAL", mobile)
    mark("mobile_no_overflow", no_overflow())
    mark("mobile_composer_visible", driver.find_element(By.CSS_SELECTOR, ".liveComposer").is_displayed())
    full_screenshot("artifacts/btc-cosmographer-route-mobile.png")
finally:
    driver.quit()

Path("artifacts/btc-cosmographer-route-visual-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
if report["failures"]:
    raise SystemExit(json.dumps(report["failures"], ensure_ascii=False, indent=2))
print("BTC_COSMOGRAPHER_ROUTE_VISUAL=PASS")
