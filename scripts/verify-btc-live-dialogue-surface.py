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


try:
    Path("artifacts").mkdir(exist_ok=True)
    driver.set_window_size(1440, 1100)
    driver.get(f"{base}/crypto-astro/btc?lang=en")
    hero_card = wait(".heroQuestionCard")
    wait(".heroProductCopy")
    landing_card = rect(".heroQuestionCard")
    landing_copy = rect(".heroProductCopy")
    viewport_height = driver.execute_script("return window.innerHeight")
    report["checks"]["landing_question_in_first_viewport"] = landing_card["top"] < viewport_height and landing_card["bottom"] > 0
    report["checks"]["landing_form_targets_live"] = hero_card.find_element(By.CSS_SELECTOR, "form").get_attribute("action").endswith("/crypto-astro/btc/live")
    report["checks"]["five_static_routes_preserved"] = len(driver.find_elements(By.CSS_SELECTOR, ".exampleRouteList a")) == 5
    report["measurements"]["landing_phi_ratio"] = landing_card["width"] / landing_copy["width"]
    report["checks"]["landing_phi_ratio"] = 1.54 <= report["measurements"]["landing_phi_ratio"] <= 1.69
    report["checks"]["landing_no_overflow"] = no_overflow()
    landing_button = rect(".heroQuestionControls button")
    portal_nav = rect("nav[aria-label='Portal navigation']")
    report["measurements"]["landing_cta_bottom"] = landing_button["bottom"]
    report["measurements"]["portal_nav_top"] = portal_nav["top"]
    report["checks"]["landing_cta_clear_of_portal_nav"] = landing_button["bottom"] <= portal_nav["top"] - 8
    blue_token = driver.execute_script("return getComputedStyle(document.documentElement).getPropertyValue('--bl').trim()")
    normalized_blue = blue_token.replace(" ", "").replace("0.22", ".22")
    report["measurements"]["blue_structure_token"] = blue_token
    report["checks"]["landing_blue_structure_token"] = normalized_blue == "rgba(106,168,255,.22)"
    driver.save_screenshot("artifacts/btc-free-question-landing-desktop-en.png")

    q = quote(question)
    driver.get(f"{base}/crypto-astro/btc/live?lang=en&q={q}")
    wait("[data-live-dialogue='btc-free-question']")
    wait(".cosmographerTurn .answerHeader")
    conversation = rect(".liveConversation")
    evidence = rect(".liveEvidenceRail")
    header_title = rect(".liveConversationHeader h1")
    header_intro = rect(".liveConversationHeader>p")
    report["measurements"]["dialogue_phi_ratio"] = conversation["width"] / evidence["width"]
    report["measurements"]["header_title_right"] = header_title["right"]
    report["measurements"]["header_title_bottom"] = header_title["bottom"]
    report["measurements"]["header_intro_left"] = header_intro["left"]
    report["measurements"]["header_intro_top"] = header_intro["top"]
    report["checks"]["dialogue_phi_ratio"] = 1.54 <= report["measurements"]["dialogue_phi_ratio"] <= 1.69
    answer_header = rect(".cosmographerTurn .answerHeader")
    repeat_composer = rect(".liveComposer")
    report["measurements"]["answer_header_top"] = answer_header["top"]
    report["measurements"]["repeat_composer_top"] = repeat_composer["top"]
    report["checks"]["answer_before_repeat_composer"] = answer_header["top"] < repeat_composer["top"]
    report["checks"]["answer_enters_first_viewport"] = answer_header["top"] < viewport_height * 0.9
    horizontal_separation = header_title["right"] <= header_intro["left"] - 8
    vertical_separation = header_title["bottom"] <= header_intro["top"] - 8
    report["checks"]["live_header_no_collision"] = horizontal_separation or vertical_separation
    report["checks"]["user_turn_present"] = len(driver.find_elements(By.CSS_SELECTOR, ".userTurn")) == 1
    report["checks"]["cosmographer_turn_present"] = len(driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")) >= 1
    report["checks"]["concise_decision_cells"] = len(driver.find_elements(By.CSS_SELECTOR, ".answerDecisionGrid>div")) == 5
    report["checks"]["four_current_metrics"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveMetricField>div")) == 4
    report["checks"]["full_field_collapsed"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveFullField:not([open])")) == 1
    report["checks"]["evidence_rail_present"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveEvidenceRail")) == 1
    report["checks"]["dialogue_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-free-question-live-desktop-en.png")

    driver.set_window_size(390, 844)
    driver.get(f"{base}/crypto-astro/btc?lang=ru")
    mobile_card = wait(".heroQuestionCard")
    mobile_rect = rect(".heroQuestionCard")
    mobile_height = driver.execute_script("return window.innerHeight")
    report["checks"]["mobile_question_reaches_first_view"] = mobile_rect["top"] < mobile_height * 1.25
    report["checks"]["mobile_landing_no_overflow"] = no_overflow()
    driver.execute_script("arguments[0].scrollIntoView({block:'center'})", mobile_card)
    time.sleep(0.2)
    driver.save_screenshot("artifacts/btc-free-question-landing-mobile-ru.png")

    driver.get(f"{base}/crypto-astro/btc/live?lang=ru&q={q}")
    wait(".liveComposer")
    wait(".cosmographerTurn .answerHeader")
    report["checks"]["mobile_dialogue_no_overflow"] = no_overflow()
    report["checks"]["mobile_single_column"] = rect(".liveConversation")["width"] >= rect(".liveEvidenceRail")["width"] - 2
    report["checks"]["mobile_answer_before_repeat_composer"] = rect(".cosmographerTurn .answerHeader")["top"] < rect(".liveComposer")["top"]
    driver.save_screenshot("artifacts/btc-free-question-live-mobile-ru.png")

    severe = [entry for entry in driver.get_log("browser") if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "").lower()]
    report["checks"]["browser_severe_none"] = not severe
    report["browser_severe"] = severe
    report["failures"] = [name for name, passed in report["checks"].items() if not passed]
    assert not report["failures"], report["failures"]
finally:
    Path("artifacts").mkdir(exist_ok=True)
    Path("artifacts/btc-live-dialogue-visual-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    driver.quit()
