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
    hero_cta = wait(".heroDialogueCta")
    wait(".staticRouteProof")
    viewport_height = driver.execute_script("return window.innerHeight")
    cta_rect = rect(".heroDialogueCta")
    portal_nav = rect("nav[aria-label='Portal navigation']")
    report["checks"]["landing_single_dialogue_cta"] = len(driver.find_elements(By.CSS_SELECTOR, ".heroDialogueCta")) == 1
    report["checks"]["landing_has_no_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, "main textarea[name='q']")) == 0
    report["checks"]["landing_cta_targets_live"] = "/crypto-astro/btc/live" in hero_cta.get_attribute("href")
    report["checks"]["landing_cta_in_first_viewport"] = cta_rect["top"] < viewport_height
    report["checks"]["landing_cta_clear_of_portal_nav"] = cta_rect["bottom"] <= portal_nav["top"] - 8
    report["checks"]["five_static_routes_preserved"] = len(driver.find_elements(By.CSS_SELECTOR, ".exampleRouteList a")) == 5
    report["checks"]["landing_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-clean-dialogue-landing-desktop-en.png")

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
