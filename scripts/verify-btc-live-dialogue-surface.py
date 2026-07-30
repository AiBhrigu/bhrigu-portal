import base64
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, quote, urlencode, urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

base = os.environ.get("BTC_LIVE_PREVIEW_BASE", "http://127.0.0.1:3110")
SESSION_KEY = "bhrigu:btc-free-dialogue:session:v0_1"
options = webdriver.ChromeOptions()
for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"):
    options.add_argument(argument)
options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
driver = webdriver.Chrome(options=options)
report = {
    "checks": {},
    "measurements": {},
    "semantic_samples": [],
    "session_states": ["1-turn", "3-turn", "8-turn", "clarification", "source-changed", "source-unavailable"],
    "failures": [],
    "browser_severe": [],
}


def wait(selector, timeout=45):
    return WebDriverWait(driver, timeout).until(lambda d: d.find_element(By.CSS_SELECTOR, selector))


def wait_turns(expected, timeout=45):
    return WebDriverWait(driver, timeout).until(
        lambda d: len(d.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == expected
    )


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


def clear_session():
    driver.execute_script("sessionStorage.removeItem(arguments[0])", SESSION_KEY)


def submitted_question_visible(driver_instance, question, previous_turns):
    params = parse_qs(urlparse(driver_instance.current_url).query)
    if params.get("q", [""])[0] != question:
        return False
    exchanges = driver_instance.find_elements(By.CSS_SELECTOR, ".dialogueExchange")
    if len(exchanges) < previous_turns + 1:
        return False
    return any(
        node.text.strip() == question
        for node in driver_instance.find_elements(By.CSS_SELECTOR, ".dialogueExchange .userTurn .turnBody p")
    )


def button_center_is_clear(driver_instance, button):
    return bool(driver_instance.execute_script(
        "const e=arguments[0];"
        "const r=e.getBoundingClientRect();"
        "if(!r.width||!r.height)return false;"
        "const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);"
        "return !!hit&&(hit===e||e.contains(hit));",
        button,
    ))


def submit_question(question):
    previous_turns = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange"))
    textarea = wait("textarea[name='q']")
    textarea.clear()
    textarea.send_keys(question)
    button = driver.find_element(By.CSS_SELECTOR, ".liveComposer button[type='submit']")
    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center',inline:'nearest'});",
        button,
    )
    WebDriverWait(driver, 20).until(
        lambda d: button.is_displayed() and button.is_enabled() and button_center_is_clear(d, button)
    )
    button.click()
    wait(".liveDialogueShell")
    WebDriverWait(driver, 60).until(
        lambda d: submitted_question_visible(d, question, previous_turns)
    )


def sample_answer(locale, question, slug, width, height):
    driver.set_window_size(width, height)
    driver.get(f"{base}/crypto-astro/btc/live?lang={locale}&q={quote(question)}")
    turn = wait(".cosmographerTurn[data-question-class]")
    wait(".cosmographerTurn .answerHeader")
    headline = driver.find_element(By.CSS_SELECTOR, ".cosmographerTurn .answerHeader h2").text
    direct = driver.find_element(By.CSS_SELECTOR, "[data-answer-direct='true']").text
    evidence = [item.text for item in driver.find_elements(By.CSS_SELECTOR, "[data-answer-section='evidence'] li")]
    limit_text = driver.find_element(By.CSS_SELECTOR, "[data-answer-section='limit']").text
    change_text = driver.find_element(By.CSS_SELECTOR, "[data-answer-section='change']").text
    source_text = driver.find_element(By.CSS_SELECTOR, "[data-answer-source-boundary='true']").text
    item = {
        "locale": locale,
        "question": question,
        "question_class": turn.get_attribute("data-question-class"),
        "facets": turn.get_attribute("data-question-facets"),
        "answer_state": turn.get_attribute("data-answer-state"),
        "headline": headline,
        "direct": direct,
        "evidence": evidence,
        "limit": limit_text,
        "change": change_text,
        "source": source_text,
        "no_overflow": no_overflow(),
    }
    report["semantic_samples"].append(item)
    driver.save_screenshot(f"artifacts/btc-question-specific-{slug}-{locale}-{width}.png")
    return item


def make_turn(index, locale="en", state="CONFIRMED", question_class="btc_gravity", source_changed=False):
    return {
        "turn_id": f"fixture-turn-{locale}-{index}",
        "created_at_utc": f"2026-07-{20 + min(index, 9):02d}T00:00:00Z",
        "locale": locale,
        "user_text": ("Вопрос " if locale == "ru" else "Question ") + str(index),
        "effective_question": ("Доминирование BTC. Почему это важно?" if locale == "ru" else "BTC dominance. Why does it matter?"),
        "observation_date": "2026-07-30",
        "question_class": question_class,
        "question_facets": ["reason"],
        "answer_state": state,
        "headline": ("Лидерство BTC подтверждается" if locale == "ru" else "BTC leadership is supported"),
        "direct_answer": ("Проверенный локальный ход " if locale == "ru" else "Verified local turn ") + str(index),
        "evidence_lines": ["BTC dominance: 61%.", "Alt breadth 24h / 7d: 32% / 38%.", "ETH rotation anchor: 18%."],
        "contradiction_or_limit": "The accepted evidence remains bounded.",
        "what_would_change_the_read": "A later accepted snapshot with opposing breadth would change the read.",
        "source_boundary": "Research context only. No forecast, trading signal or price target.",
        "source_snapshot_generated_at_utc": "2026-07-30T00:00:00Z",
        "proof_available": True,
        "context_relation": "EXPLAIN_PRIOR",
        "source_binding_changed": source_changed,
    }


def set_session(turns, compacted=False):
    payload = {
        "schema": "btc_free_dialogue_session_v0_1",
        "session_id": "fixture-session",
        "locale": turns[-1]["locale"] if turns else "en",
        "created_at_utc": "2026-07-30T00:00:00Z",
        "updated_at_utc": "2026-07-30T00:00:00Z",
        "turn_count": len(turns),
        "compacted": compacted,
        "source_binding": {
            "deployment_sha": None,
            "snapshot_generated_at_utc": turns[-1]["source_snapshot_generated_at_utc"] if turns else None,
            "observation_date": "2026-07-30" if turns else None,
        },
        "turns": turns,
    }
    driver.execute_script(
        "sessionStorage.setItem(arguments[0],arguments[1])",
        SESSION_KEY,
        json.dumps(payload, ensure_ascii=False),
    )


try:
    Path("artifacts").mkdir(exist_ok=True)

    driver.set_window_size(1440, 1100)
    driver.get(f"{base}/crypto-astro/btc?lang=en")
    hero_cta = wait(".heroDialogueCta")
    wait(".staticRouteProof")
    viewport_height = driver.execute_script("return window.innerHeight")
    cta_rect = rect(".heroDialogueCta")
    report["checks"]["landing_single_dialogue_cta"] = len(driver.find_elements(By.CSS_SELECTOR, ".heroDialogueCta")) == 1
    report["checks"]["landing_has_no_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, "main textarea[name='q']")) == 0
    report["checks"]["landing_cta_targets_live"] = "/crypto-astro/btc/live" in hero_cta.get_attribute("href")
    report["checks"]["landing_cta_in_first_viewport"] = cta_rect["top"] < viewport_height
    report["checks"]["landing_portal_nav_hidden"] = not driver.find_element(By.CSS_SELECTOR, "nav[aria-label='Portal navigation']").is_displayed()
    report["checks"]["five_static_routes_preserved"] = len(driver.find_elements(By.CSS_SELECTOR, ".exampleRouteList a")) == 5
    report["checks"]["landing_no_overflow"] = no_overflow()
    driver.save_screenshot("artifacts/btc-session-dialogue-landing-desktop-en.png")

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
    driver.save_screenshot("artifacts/btc-session-dialogue-landing-mobile-first-screen-en.png")

    samples = [
        ("en", "Do stablecoin share, DeFi TVL and DEX volume confirm current BTC liquidity conditions?", "liquidity", 1440, 1100),
        ("en", "Do regime, Market Field Score and market cap confirm the current BTC structure?", "structure", 1440, 1100),
        ("ru", "Что изменила принятая память BTC по сравнению с предыдущим снимком?", "memory", 390, 844),
        ("ru", "Как выбранная дата меняет временной контекст и давление BTC?", "temporal", 390, 844),
    ]
    observed = [sample_answer(*sample) for sample in samples]
    report["checks"]["four_question_classes_visualized"] = len({item["question_class"] for item in observed}) == 4
    report["checks"]["four_distinct_headlines"] = len({item["headline"] for item in observed}) == 4
    report["checks"]["all_samples_have_direct_answer"] = all(item["direct"] for item in observed)
    report["checks"]["all_samples_have_three_evidence_lines"] = all(len(item["evidence"]) >= 1 for item in observed)
    report["checks"]["all_samples_have_limit_and_change"] = all(item["limit"] and item["change"] for item in observed)
    report["checks"]["all_samples_source_bound"] = all("forecast" in item["source"].lower() or "прогноз" in item["source"].lower() for item in observed)
    report["checks"]["all_samples_no_overflow"] = all(item["no_overflow"] for item in observed)
    report["checks"]["generic_mixed_signals_absent"] = all(item["headline"].lower() != "mixed signals" for item in observed)

    driver.set_window_size(1440, 1200)
    driver.get(f"{base}/crypto-astro/btc/live?lang=en")
    wait(".liveDialogueShell")
    clear_session()
    driver.refresh()
    wait(".liveDialogueShell")
    submit_question("Do BTC dominance and altcoin breadth confirm BTC leadership?")
    wait_turns(1)
    wait("input[name='fc']")
    report["checks"]["one_turn_session_visible"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 1
    report["checks"]["one_turn_tab_memory_note"] = "Memory only in this tab" in driver.find_element(By.CSS_SELECTOR, "[data-session-memory-note='tab-only']").text
    driver.save_screenshot("artifacts/btc-session-1-turn-desktop-en.png")

    submit_question("Why?")
    wait_turns(2)
    second = driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")[-1]
    report["checks"]["why_follow_up_resolved"] = second.get_attribute("data-context-relation") == "EXPLAIN_PRIOR"
    report["checks"]["why_inherits_gravity"] = second.get_attribute("data-question-class") == "btc_gravity"

    submit_question("Does liquidity confirm it?")
    wait_turns(3)
    third = driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")[-1]
    report["checks"]["three_turn_session_visible"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 3
    report["checks"]["liquidity_follow_up_resolved"] = third.get_attribute("data-context-relation") == "CONFIRM_WITH_MODULE"
    report["checks"]["liquidity_follow_up_routed"] = third.get_attribute("data-question-class") == "liquidity"
    report["checks"]["same_tab_route_persistence"] = "Turns: 3" in driver.find_element(By.CSS_SELECTOR, "[data-session-turn-count]").text
    last_answer = rect(".dialogueExchange:last-child .cosmographerTurn")
    composer = rect(".liveComposer")
    report["checks"]["latest_answer_not_covered"] = last_answer["bottom"] <= composer["top"] + 2
    report["checks"]["three_turn_no_overflow"] = no_overflow()
    full_page_screenshot("artifacts/btc-session-3-turn-desktop-en.png")

    handles_before = set(driver.window_handles)
    driver.execute_script(f"window.open('{base}/crypto-astro/btc/live?lang=en','_blank','noopener')")
    WebDriverWait(driver, 20).until(lambda d: len(d.window_handles) == len(handles_before) + 1)
    new_handle = next(handle for handle in driver.window_handles if handle not in handles_before)
    original_handle = next(iter(handles_before))
    driver.switch_to.window(new_handle)
    wait(".liveDialogueShell")
    report["checks"]["separate_tab_isolated"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 0
    driver.close()
    driver.switch_to.window(original_handle)

    driver.set_window_size(390, 844)
    driver.get(f"{base}/crypto-astro/btc/live?lang=ru")
    wait(".liveDialogueShell")
    set_session([make_turn(index, locale="ru") for index in range(1, 9)])
    driver.refresh()
    wait_turns(8)
    report["checks"]["eight_turn_thread_visible"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 8
    report["checks"]["eight_turn_mobile_no_overflow"] = no_overflow()
    driver.execute_script("document.querySelector('.liveComposer').scrollIntoView({block:'center'})")
    composer_mobile = rect(".liveComposer")
    report["checks"]["eight_turn_composer_reachable"] = composer_mobile["bottom"] > 0 and composer_mobile["top"] < 844
    full_page_screenshot("artifacts/btc-session-8-turn-mobile-ru.png")

    clear_session()
    driver.get(f"{base}/crypto-astro/btc/live?lang=en&q={quote('Why?')}")
    wait(".dialogueStateCLARIFICATION")
    report["checks"]["no_context_clarification_fail_closed"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueStateCLARIFICATION")) == 1
    report["checks"]["clarification_has_no_market_class"] = driver.find_element(By.CSS_SELECTOR, ".dialogueStateCLARIFICATION").get_attribute("data-question-class") == ""
    driver.save_screenshot("artifacts/btc-session-clarification-mobile-en.png")

    clear_session()
    params = {
        "lang": "en",
        "q": "Why?",
        "fc": "btc_follow_up_context_v0_1",
        "pc": "btc_gravity",
        "pf": "confirmation",
        "ps": "SPLIT",
        "pd": "2026-07-29",
        "pt": "2020-01-01T00:00:00Z",
    }
    driver.get(f"{base}/crypto-astro/btc/live?{urlencode(params)}")
    wait("[data-source-changed='true']")
    report["checks"]["source_changed_disclosed"] = len(driver.find_elements(By.CSS_SELECTOR, "[data-source-changed='true']")) == 1
    driver.save_screenshot("artifacts/btc-session-source-changed-mobile-en.png")

    driver.get(f"{base}/crypto-astro/btc/live?lang=en")
    wait(".liveDialogueShell")
    failed_turn = make_turn(1, state="FAILURE")
    failed_turn["question_class"] = None
    failed_turn["question_facets"] = []
    failed_turn["headline"] = "Source temporarily unavailable"
    failed_turn["direct_answer"] = "The accepted source could not be verified. Local conversation history remains available."
    failed_turn["evidence_lines"] = []
    failed_turn["contradiction_or_limit"] = None
    failed_turn["what_would_change_the_read"] = None
    failed_turn["source_boundary"] = None
    failed_turn["proof_available"] = False
    set_session([failed_turn])
    driver.refresh()
    wait(".dialogueStateFAILURE")
    report["checks"]["source_unavailable_history_visible"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueStateFAILURE")) == 1
    driver.save_screenshot("artifacts/btc-session-source-unavailable-mobile-en.png")

    driver.execute_script("sessionStorage.setItem(arguments[0],'{bad')", SESSION_KEY)
    driver.refresh()
    wait(".liveComposer")
    report["checks"]["malformed_storage_recovers"] = driver.execute_script("return sessionStorage.getItem(arguments[0])", SESSION_KEY) is None

    driver.execute_script("sessionStorage.setItem(arguments[0],JSON.stringify({schema:'wrong'}))", SESSION_KEY)
    driver.refresh()
    wait(".liveComposer")
    report["checks"]["schema_mismatch_recovers"] = driver.execute_script("return sessionStorage.getItem(arguments[0])", SESSION_KEY) is None

    long_turns = []
    for index in range(1, 21):
        turn = make_turn(index)
        turn["direct_answer"] = "D" * 2300
        turn["evidence_lines"] = ["E" * 780, "F" * 780, "G" * 780]
        turn["contradiction_or_limit"] = "L" * 1700
        turn["what_would_change_the_read"] = "C" * 1700
        turn["source_boundary"] = "S" * 1500
        long_turns.append(turn)
    set_session(long_turns)
    driver.refresh()
    wait(".liveThread")
    compacted_raw = driver.execute_script("return sessionStorage.getItem(arguments[0])", SESSION_KEY)
    compacted_value = json.loads(compacted_raw)
    report["checks"]["session_compaction_under_64kb"] = len(compacted_raw.encode("utf-8")) <= 64 * 1024
    report["checks"]["session_compaction_retains_latest_six"] = 6 <= len(compacted_value["turns"]) <= 20
    report["checks"]["session_compaction_flag_visible"] = compacted_value["compacted"] is True and len(driver.find_elements(By.CSS_SELECTOR, ".liveCompactionNotice")) == 1

    button = wait(".liveNewConversation")
    button.click()
    WebDriverWait(driver, 10).until(lambda d: d.switch_to.alert)
    driver.switch_to.alert.accept()
    WebDriverWait(driver, 30).until(lambda d: "q=" not in d.current_url)
    wait(".liveComposer")
    report["checks"]["new_conversation_clears_local_history"] = driver.execute_script("return sessionStorage.getItem(arguments[0])", SESSION_KEY) is None
    report["checks"]["new_conversation_returns_empty_thread"] = len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) == 0

    report["checks"]["live_has_one_question_input"] = len(driver.find_elements(By.CSS_SELECTOR, ".liveDialogueShell textarea[name='q']")) == 1
    report["checks"]["live_has_no_analytics_cards"] = sum(len(driver.find_elements(By.CSS_SELECTOR, selector)) for selector in (".liveEvidenceRail", ".liveMetricField", ".answerDecisionGrid", ".liveFullField")) == 0
    report["checks"]["live_portal_nav_hidden"] = not driver.find_element(By.CSS_SELECTOR, "nav[aria-label='Portal navigation']").is_displayed()
    report["checks"]["live_no_overflow"] = no_overflow()

    severe = [
        entry for entry in driver.get_log("browser")
        if entry.get("level") == "SEVERE" and "favicon" not in entry.get("message", "").lower()
    ]
    report["checks"]["browser_severe_none"] = not severe
    report["browser_severe"] = severe
    report["failures"] = [name for name, passed in report["checks"].items() if not passed]
    assert not report["failures"], report["failures"]
finally:
    Path("artifacts").mkdir(exist_ok=True)
    Path("artifacts/btc-live-dialogue-visual-report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    driver.quit()
