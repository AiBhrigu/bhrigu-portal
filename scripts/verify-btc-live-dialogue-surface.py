import base64
import json
import os
import time
from pathlib import Path
from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

base = os.environ.get("BTC_LIVE_PREVIEW_BASE", "http://127.0.0.1:3110")
question = "What changed in the BTC field, why does it matter, and what should I watch next?"
options = webdriver.ChromeOptions()
for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"):
    options.add_argument(argument)
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
driver = webdriver.Chrome(options=options)
report = {"checks": {}, "measurements": {}, "failures": [], "browser_severe": []}


def wait(selector, timeout=45):
    return WebDriverWait(driver, timeout).until(lambda d: d.find_element(By.CSS_SELECTOR, selector))


def rect(selector):
    return driver.execute_script(
        "const r=document.querySelector(arguments[0]).getBoundingClientRect();"
        "return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,left:r.left,right:r.right};",
        selector,
    )


def no_overflow():
    return driver.execute_script("return document.documentElement.scrollWidth<=window.innerWidth+1")


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


try:
    Path("artifacts").mkdir(exist_ok=True)
    driver.set_window_size(1440, 1100)
    driver.get(f"{base}/crypto-astro/btc?lang=en")
    hero_cta = wait(".heroDialogueCta")
    wait(".staticRouteProof")
    viewport_height = driver.execute_script("return window.innerHeight")
    cta_rect = rect(".heroDialogueCta")
    portal_nav = rect("nav[aria-label='Portal navigation']")
    report["checks"]["landing_single_dialogue_cta"] = len(driver.find_elements(By.CSS_SELECTOR, ".heroDialogueCta")) == 1
    report["checks"]["landing_has_no_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, "main textarea[name='q']")) == 0
    report["checks"]["landing_cta_targets_live"] = "/crypto-astro/btc/live" in hero_cta.get_attribute("href")
    report["checks"]["landing_cta_in_first_viewport"] = cta_rect["top"] < viewport_height
    report["checks"]["landing_portal_nav_hidden"] = not driver.find_element(By.CSS_SELECTOR, "nav[aria-label='Portal navigation']").is_displayed()
    report["checks"]["five_static_routes_preserved"] = len(driver.find_elements(By.CSS_SELECTOR, ".exampleRouteList a")) == 5
    report["checks"]["landing_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-clean-dialogue-landing-desktop-en.png")

    driver.set_window_size(390, 844)
    driver.get(f"{base}/crypto-astro/btc?lang=en")
    wait(".heroDialogueCta")
    wait(".staticRouteProof")
    mobile_landing_height = driver.execute_script("return window.innerHeight")
    mobile_cta = rect(".heroDialogueCta")
    proof_header = rect(".staticProofHeader")
    proof_routes = rect(".staticExampleRoutes")
    route_rects = driver.execute_script(
        "return [...document.querySelectorAll('.exampleRouteList a')].map(e=>{"
        "const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};});"
    )
    report["checks"]["mobile_landing_cta_in_first_viewport"] = mobile_cta["bottom"] <= mobile_landing_height
    report["checks"]["mobile_static_portal_nav_hidden"] = not driver.find_element(By.CSS_SELECTOR, "nav[aria-label='Portal navigation']").is_displayed()
    report["checks"]["mobile_static_single_column"] = proof_routes["top"] >= proof_header["bottom"] - 1
    report["checks"]["mobile_static_routes_bounded"] = all(item["left"] >= 0 and item["right"] <= 390 for item in route_rects)
    report["checks"]["mobile_static_routes_do_not_overlap"] = all(route_rects[index]["bottom"] <= route_rects[index + 1]["top"] + 1 for index in range(len(route_rects) - 1))
    report["checks"]["mobile_static_has_no_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, "main textarea[name='q']")) == 0
    report["checks"]["mobile_static_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-clean-dialogue-landing-mobile-first-screen-en.png")
    full_page_screenshot("artifacts/btc-clean-dialogue-landing-mobile-full-en.png")

    driver.get(f"{base}/crypto-astro/btc/live?lang=en")
    wait(".liveDialogueShell")
    report["checks"]["empty_live_has_one_composer"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveDialogueShell textarea[name='q']")) == 1
    report["checks"]["empty_live_has_no_analytics_cards"] = sum(len(driver.find_elements(By.CSS_SELECTOR, selector)) for selector in (".liveEvidenceRail", ".liveMetricField", ".answerDecisionGrid", ".liveFullField")) == 0
    report["checks"]["empty_live_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-clean-dialogue-empty-desktop-en.png")

    q = quote(question)
    driver.get(f"{base}/crypto-astro/btc/live?lang=en&q={q}")
    wait(".liveThread")
    wait(".cosmographerTurn .answerHeader")
    shell = rect(".liveDialogueShell")
    answer = rect(".cosmographerTurn .answerHeader")
    composer = rect(".liveComposer")
    report["measurements"]["shell_width"] = shell["width"]
    report["measurements"]["answer_top"] = answer["top"]
    report["measurements"]["composer_top"] = composer["top"]
    report["checks"]["live_single_column_measure"] = shell["width"] <= 800
    report["checks"]["user_turn_present"] = len(driver.find_elements(By.CSS_SELECTOR, ".userTurn")) == 1
    report["checks"]["cosmographer_turn_present"] = len(driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")) >= 1
    report["checks"]["answer_before_next_composer"] = answer["top"] < composer["top"]
    report["checks"]["answer_enters_first_viewport"] = answer["top"] < viewport_height
    report["checks"]["live_has_one_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveDialogueShell textarea[name='q']")) == 1
    report["checks"]["live_has_no_analytics_cards"] = sum(len(driver.find_elements(By.CSS_SELECTOR, selector)) for selector in (".liveEvidenceRail", ".liveMetricField", ".answerDecisionGrid", ".liveFullField")) == 0
    report["checks"]["live_portal_nav_hidden"] = not driver.find_element(By.CSS_SELECTOR, "nav[aria-label='Portal navigation']").is_displayed()
    report["checks"]["live_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-clean-dialogue-answer-desktop-en.png")

    driver.set_window_size(390, 844)
    driver.get(f"{base}/crypto-astro/btc/live?lang=ru&q={q}")
    wait(".liveThread")
    wait(".cosmographerTurn .answerHeader")
    mobile_height = driver.execute_script("return window.innerHeight")
    mobile_answer = rect(".cosmographerTurn .answerHeader")
    mobile_composer = rect(".liveComposer")
    report["checks"]["mobile_single_column"] = rect(".liveDialogueShell")["width"] <= 390
    report["checks"]["mobile_answer_enters_first_viewport"] = mobile_answer["top"] < mobile_height
    report["checks"]["mobile_answer_before_next_composer"] = mobile_answer["top"] < mobile_composer["top"]
    report["checks"]["mobile_has_no_analytics_cards"] = sum(len(driver.find_elements(By.CSS_SELECTOR, selector)) for selector in (".liveEvidenceRail", ".liveMetricField", ".answerDecisionGrid", ".liveFullField")) == 0
    report["checks"]["mobile_no_overflow"] = no_overflow()
    time.sleep(0.2)
    driver.save_screenshot("artifacts/btc-clean-dialogue-answer-mobile-ru.png")

    severe = [entry for entry in driver.get_log("browser") if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "").lower()]
    report["checks"]["browser_severe_none"] = not severe
    report["browser_severe"] = severe
    report["failures"] = [name for name, passed in report["checks"].items() if not passed]
    assert not report["failures"], report["failures"]
finally:
    Path("artifacts").mkdir(exist_ok=True)
    Path("artifacts/btc-live-dialogue-visual-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    driver.quit()
