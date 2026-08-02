import base64
import json
import os
import re
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

BASE = os.environ.get(
    "BTC_COSMOGRAPHER_PREVIEW_BASE",
    "http://127.0.0.1:3110",
).rstrip("/")
ARTIFACTS = Path("artifacts/btc-public-live-visual-acceptance")
ARTIFACTS.mkdir(parents=True, exist_ok=True)

PUBLIC_DOMAIN_LABELS = {
    "Протокол Bitcoin",
    "Bitcoin Protocol",
    "Рынок BTC",
    "BTC Market",
    "Память снимков",
    "Snapshot Memory",
    "Астрономические данные",
    "Astronomical data",
    "Астрономия × BTC",
    "Astronomy × BTC",
    "Метод и доказательность",
    "Method and evidence",
    "Навигация по полю BTC",
    "BTC field navigation",
    "Граница поддержки",
    "Support boundary",
}

report = {
    "schema": "btc_cosmographer_public_live_visual_information_acceptance_v0_1",
    "status": "PASS",
    "checks": {},
    "measurements": [],
    "states": [],
    "failures": [],
    "browser_severe": [],
    "ignored_local_network_noise": [],
}


def check(name, passed, details=""):
    passed = bool(passed)
    report["checks"][name] = {"passed": passed, "details": str(details)[:900]}
    print(f"{'PASS' if passed else 'FAIL'} {name}{' · ' + str(details)[:350] if details else ''}")
    if not passed:
        report["failures"].append(name)


def options():
    value = webdriver.ChromeOptions()
    for argument in (
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--window-position=0,0",
    ):
        value.add_argument(argument)
    value.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    return value


def wait(driver, selector, timeout=45):
    return WebDriverWait(driver, timeout).until(
        lambda instance: instance.find_element(By.CSS_SELECTOR, selector)
    )


def current_question(driver):
    return parse_qs(urlparse(driver.current_url).query).get("q", [""])[0]


def newest(driver):
    return wait(driver, ".cosmographerTurn")


def session_turn_count(driver):
    return int(driver.execute_script(
        """
        const raw=sessionStorage.getItem('bhrigu:btc-free-dialogue:session:v0_1');
        if(!raw) return 0;
        try {
          const value=JSON.parse(raw);
          return Array.isArray(value.turns) ? value.turns.length : 0;
        } catch (_) {
          return -1;
        }
        """
    ))


def state_snapshot(driver):
    answers = driver.find_elements(By.CSS_SELECTOR, ".cosmographerTurn")
    answer = answers[0] if answers else None
    return {
        "url": driver.current_url,
        "question": current_question(driver),
        "dom_turns": len(driver.find_elements(By.CSS_SELECTOR, ".dialogueExchange")),
        "session_turns": session_turn_count(driver),
        "mode": answer.get_attribute("data-answer-mode") if answer else None,
        "relation": answer.get_attribute("data-semantic-context-relation") if answer else None,
        "subject": answer.get_attribute("data-route-subject") if answer else None,
    }


def wait_state(driver, question, mode, relation, subject, expected_turns):
    try:
        WebDriverWait(driver, 45).until(lambda instance: current_question(instance) == question)
        WebDriverWait(driver, 45).until(lambda instance: session_turn_count(instance) >= expected_turns)
        WebDriverWait(driver, 45).until(
            lambda instance: len(instance.find_elements(By.CSS_SELECTOR, ".dialogueExchange")) >= expected_turns
        )
        WebDriverWait(driver, 45).until(
            lambda instance: (
                instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-answer-mode") == mode
                and instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-semantic-context-relation") == relation
                and instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-route-subject") == subject
            )
        )
        WebDriverWait(driver, 45).until(
            lambda instance: instance.execute_script(
                "return document.activeElement === document.querySelector('.cosmographerTurn');"
            )
        )
        WebDriverWait(driver, 45).until(
            lambda instance: instance.execute_script(
                "const node=document.querySelector('.cosmographerTurn');"
                "if(!node) return false;"
                "const top=node.getBoundingClientRect().top;"
                "return top >= 0 && top <= 64;"
            )
        )
    except Exception:
        print("STATE_WAIT_DIAGNOSTIC", json.dumps(state_snapshot(driver), ensure_ascii=False))
        raise
    return newest(driver)


def submit(driver, question, mode, relation, subject, expected_turns):
    form = wait(driver, "form.liveComposer")
    field = form.find_element(By.CSS_SELECTOR, "textarea[name='q']")
    field.clear()
    field.send_keys(question)
    button = form.find_element(By.CSS_SELECTOR, "button[type='submit']")
    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center',inline:'nearest'});",
        button,
    )
    WebDriverWait(driver, 20).until(lambda _: button.is_displayed() and button.is_enabled())
    driver.execute_script("arguments[0].requestSubmit(arguments[1]);", form, button)
    return wait_state(driver, question, mode, relation, subject, expected_turns)


def visual_metrics(driver, label):
    answer = newest(driver)
    heading = answer.find_element(By.CSS_SELECTOR, "h2")
    direct = answer.find_element(By.CSS_SELECTOR, "[data-answer-direct='true']")
    composer = driver.find_element(By.CSS_SELECTOR, "form.liveComposerAfterAnswer")
    values = driver.execute_script(
        """
        const answer=arguments[0], heading=arguments[1], direct=arguments[2], composer=arguments[3];
        const a=answer.getBoundingClientRect();
        const h=heading.getBoundingClientRect();
        const d=direct.getBoundingClientRect();
        const c=composer.getBoundingClientRect();
        const absolute=(rect)=>({top:rect.top+window.scrollY,bottom:rect.bottom+window.scrollY});
        const aa=absolute(a), cc=absolute(c);
        return {
          scrollY: window.scrollY,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          pageWidth: document.documentElement.scrollWidth,
          pageHeight: document.documentElement.scrollHeight,
          answerTop: a.top,
          answerBottom: a.bottom,
          headingTop: h.top,
          headingBottom: h.bottom,
          directTop: d.top,
          directBottom: d.bottom,
          answerWidth: a.width,
          composerTop: c.top,
          composerDistanceAfterAnswer: cc.top-aa.bottom,
        };
        """,
        answer,
        heading,
        direct,
        composer,
    )
    values["label"] = label
    report["measurements"].append(values)
    check(f"{label}_no_horizontal_overflow", values["pageWidth"] <= values["viewportWidth"] + 1, values)
    check(
        f"{label}_heading_fully_in_first_viewport",
        values["headingTop"] >= 0 and values["headingBottom"] <= values["viewportHeight"],
        values,
    )
    check(
        f"{label}_direct_answer_begins_in_first_viewport",
        values["directTop"] >= 0 and values["directTop"] < values["viewportHeight"],
        values,
    )
    check(
        f"{label}_continuation_within_one_viewport_after_answer",
        0 <= values["composerDistanceAfterAnswer"] <= values["viewportHeight"],
        values,
    )
    check(f"{label}_answer_within_viewport_width", values["answerWidth"] <= values["viewportWidth"] + 1, values)
    driver.save_screenshot(str(ARTIFACTS / f"{label}-viewport.png"))
    driver.save_screenshot(str(ARTIFACTS / f"{label}-answer.png"))
    return values


def proof_layer_check(driver, label):
    proof = newest(driver).find_element(By.CSS_SELECTOR, ".answerSource")
    spans = proof.find_elements(By.CSS_SELECTOR, ":scope > div > span")
    first = spans[0].text.strip() if spans else ""
    check(
        f"{label}_public_proof_uses_human_domain_label",
        first in PUBLIC_DOMAIN_LABELS and "_" not in first,
        first,
    )


def section_ids(driver):
    return [
        item.get_attribute("data-semantic-answer-section")
        for item in newest(driver).find_elements(By.CSS_SELECTOR, "[data-semantic-answer-section]")
    ]


def window_checks(driver, label, expected_count, desktop):
    section = newest(driver).find_element(By.CSS_SELECTOR, "[data-semantic-answer-section='main_windows']")
    cards = section.find_elements(By.CSS_SELECTOR, ".astroWindowCard")
    ranks = section.find_elements(By.CSS_SELECTOR, ".astroWindowRank")
    ranges = section.find_elements(By.CSS_SELECTOR, ".astroWindowRange")
    check(f"{label}_window_card_count", len(cards) == expected_count, len(cards))
    check(f"{label}_rank_is_separate", len(ranks) == expected_count, len(ranks))
    check(f"{label}_range_is_separate", len(ranges) == expected_count, len(ranges))
    starts = [card.get_attribute("data-window-start") for card in cards]
    check(f"{label}_chronological_card_order", starts == sorted(starts) and all(starts), starts)
    if cards:
        grid = section.find_element(By.CSS_SELECTOR, ".astroWindowGrid")
        columns = driver.execute_script(
            "return getComputedStyle(arguments[0]).gridTemplateColumns.split(' ').filter(Boolean).length;",
            grid,
        )
        check(f"{label}_responsive_grid_columns", columns == (2 if desktop else 1), columns)


def transition_check(driver, label, expected=True):
    disclosures = newest(driver).find_elements(By.CSS_SELECTOR, "details[data-complete-transitions='collapsed']")
    if not expected:
        check(f"{label}_no_full_transition_repeat", len(disclosures) == 0, len(disclosures))
        return
    check(f"{label}_one_transition_disclosure", len(disclosures) == 1, len(disclosures))
    if disclosures:
        detail = disclosures[0]
        items = detail.find_elements(By.CSS_SELECTOR, "li")
        check(f"{label}_transition_disclosure_closed", not bool(detail.get_attribute("open")))
        check(f"{label}_complete_transition_inventory", len(items) == 14, len(items))


def state_record(driver, label):
    answer = newest(driver)
    item = {
        "label": label,
        "domain": answer.get_attribute("data-route-domain"),
        "subject": answer.get_attribute("data-route-subject"),
        "relation": answer.get_attribute("data-semantic-context-relation"),
        "mode": answer.get_attribute("data-answer-mode"),
        "sections": section_ids(driver),
        "headline": answer.find_element(By.CSS_SELECTOR, "h2").text,
    }
    report["states"].append(item)
    return item


def open_initial(driver, locale, question, mode, relation, subject):
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}")
    driver.execute_script("sessionStorage.clear(); localStorage.removeItem('btc-live-dialogue');")
    driver.get(f"{BASE}/crypto-astro/btc/live?lang={locale}&q={quote(question)}")
    return wait_state(driver, question, mode, relation, subject, 1)


def run_ru_sequence(driver, width, height, suffix):
    desktop = width > 760
    driver.set_window_size(width, height)
    annual_question = "Какие аспекты планет важны в 2026 году?"
    open_initial(driver, "ru", annual_question, "ASTRO_YEAR_OVERVIEW", "NEW_TOPIC", "planetary_aspects")
    annual_state = state_record(driver, f"ru-annual-{suffix}")
    window_checks(driver, f"ru_annual_{suffix}", 5, desktop)
    transition_check(driver, f"ru_annual_{suffix}", True)
    proof_layer_check(driver, f"ru_annual_{suffix}")
    visual_metrics(driver, f"ru-annual-{suffix}")

    submit(driver, "Почему это важно?", "ASTRO_YEAR_OVERVIEW", "FOLLOW_UP", "planetary_aspects", 2)
    follow_state = state_record(driver, f"ru-follow-{suffix}")
    check(f"ru_follow_{suffix}_focused_sections", len(follow_state["sections"]) <= 3, follow_state["sections"])
    check(f"ru_follow_{suffix}_no_annual_windows", "main_windows" not in follow_state["sections"], follow_state["sections"])
    transition_check(driver, f"ru_follow_{suffix}", False)
    proof_layer_check(driver, f"ru_follow_{suffix}")
    visual_metrics(driver, f"ru-follow-{suffix}")

    submit(driver, "Ликвидность подтверждает?", "ASTRO_BTC_BRIDGE", "CROSS_MODULE_BRIDGE", "planetary_aspects", 3)
    bridge_state = state_record(driver, f"ru-bridge-{suffix}")
    market = newest(driver).find_element(By.CSS_SELECTOR, "[data-semantic-answer-section='market_layer']")
    windows = newest(driver).find_element(By.CSS_SELECTOR, "[data-semantic-answer-section='main_windows']")
    market_top, windows_top = driver.execute_script(
        "return [arguments[0].getBoundingClientRect().top, arguments[1].getBoundingClientRect().top];",
        market,
        windows,
    )
    check(f"ru_bridge_{suffix}_market_first_visually", market_top < windows_top, f"{market_top}/{windows_top}")
    check(
        f"ru_bridge_{suffix}_market_first_semantically",
        bridge_state["sections"] and bridge_state["sections"][0] == "market_layer",
        bridge_state["sections"],
    )
    window_checks(driver, f"ru_bridge_{suffix}", 5, desktop)
    proof_layer_check(driver, f"ru_bridge_{suffix}")
    visual_metrics(driver, f"ru-bridge-{suffix}")

    submit(driver, "Теперь расскажи о халвинге", "PROTOCOL_EXPLAIN", "NEW_TOPIC", "halving", 4)
    halving_state = state_record(driver, f"ru-halving-{suffix}")
    check(f"ru_halving_{suffix}_no_astro_shell", "аспект" not in halving_state["headline"].casefold(), halving_state["headline"])
    proof_layer_check(driver, f"ru_halving_{suffix}")
    visual_metrics(driver, f"ru-halving-{suffix}")

    submit(driver, "Вернёмся к аспектам", "ASTRO_YEAR_OVERVIEW", "RETURN_TO_PREVIOUS_TOPIC", "planetary_aspects", 5)
    return_state = state_record(driver, f"ru-return-{suffix}")
    window_checks(driver, f"ru_return_{suffix}", 3, desktop)
    transition_check(driver, f"ru_return_{suffix}", False)
    check(f"ru_return_{suffix}_continuation_cue", "краткое продолжение" in return_state["headline"].casefold(), return_state["headline"])
    proof_layer_check(driver, f"ru_return_{suffix}")
    visual_metrics(driver, f"ru-return-{suffix}")
    return annual_state, bridge_state


def run_en_annual(driver, width, height, suffix):
    desktop = width > 760
    driver.set_window_size(width, height)
    question = "Which planetary aspects matter in 2026?"
    open_initial(driver, "en", question, "ASTRO_YEAR_OVERVIEW", "NEW_TOPIC", "planetary_aspects")
    state = state_record(driver, f"en-annual-{suffix}")
    window_checks(driver, f"en_annual_{suffix}", 5, desktop)
    transition_check(driver, f"en_annual_{suffix}", True)
    proof_layer_check(driver, f"en_annual_{suffix}")
    visual_metrics(driver, f"en-annual-{suffix}")
    return state


def run_named_body_sequence(driver, width, height, suffix):
    driver.set_window_size(width, height)
    driver.get(f"{BASE}/crypto-astro/btc/live?lang=ru")
    driver.execute_script("sessionStorage.clear(); localStorage.removeItem('btc-live-dialogue');")
    driver.refresh()
    wait(driver, ".liveComposer")
    check(
        f"named_{suffix}_clean_session_no_active_subject",
        not driver.find_elements(By.CSS_SELECTOR, "[data-active-context='true']"),
    )

    annual_question = "Как движется Юпитер в 2026 году?"
    driver.get(f"{BASE}/crypto-astro/btc/live?lang=ru&q={quote(annual_question)}")
    wait_state(driver, annual_question, "ASTRO_INTERVAL", "NEW_TOPIC", "jupiter", 1)
    active = wait(driver, "[data-active-context='true']")
    composer = wait(driver, "form.liveComposer")
    active_before_composer = driver.execute_script(
        "return Boolean(arguments[0].compareDocumentPosition(arguments[1]) & Node.DOCUMENT_POSITION_FOLLOWING);",
        active,
        composer,
    )
    check(f"named_{suffix}_active_subject_jupiter", active.get_attribute("data-active-subject") == "jupiter")
    check(f"named_{suffix}_active_period_2026", active.get_attribute("data-active-period") == "2026")
    check(f"named_{suffix}_active_context_before_composer", active.is_displayed() and active_before_composer)

    fields = newest(driver).find_elements(By.CSS_SELECTOR, "[data-evidence-field]")
    field_values = {item.get_attribute("data-evidence-field"): item.text for item in fields}
    check(f"named_{suffix}_three_distinct_evidence_fields", set(field_values) == {
        "observation-period",
        "evidence-coverage",
        "evidence-revision-or-generated-time",
    }, field_values)
    check(
        f"named_{suffix}_evidence_coverage_is_not_freshness",
        "2026-01-01" in field_values.get("evidence-coverage", "") and
        "2026-12-31" in field_values.get("evidence-coverage", "") and
        "проверен" not in field_values.get("evidence-coverage", "").casefold(),
        field_values,
    )
    check(
        f"named_{suffix}_astro_revision_unavailable_explicit",
        "не опубликовано" in field_values.get("evidence-revision-or-generated-time", "").casefold(),
        field_values,
    )

    follow_question = "Какие самые напряжённые дни?"
    submit(driver, follow_question, "ASTRO_INTERVAL", "FOLLOW_UP", "jupiter", 2)
    follow_state = state_record(driver, f"jupiter-ranked-{suffix}")
    direct = newest(driver).find_element(By.CSS_SELECTOR, "[data-answer-direct='true']")
    top_windows = newest(driver).find_element(By.CSS_SELECTOR, "[data-semantic-answer-section='top_dates_or_windows']")
    direct_before_windows = driver.execute_script(
        "return arguments[0].getBoundingClientRect().top < arguments[1].getBoundingClientRect().top;",
        direct,
        top_windows,
    )
    check(f"named_{suffix}_ranked_answer_order", direct_before_windows, follow_state["sections"])
    check(
        f"named_{suffix}_ranked_sections_exact",
        follow_state["sections"] == ["top_dates_or_windows", "significance", "conditions_and_limits"],
        follow_state["sections"],
    )
    check(f"named_{suffix}_full_annual_timeline_not_repeated", "timeline" not in follow_state["sections"], follow_state["sections"])
    active = wait(driver, "[data-active-context='true']")
    check(f"named_{suffix}_jupiter_context_retained", active.get_attribute("data-active-subject") == "jupiter")
    boundary_text = newest(driver).text.casefold()
    check(
        f"named_{suffix}_proof_and_safety_boundaries_present",
        "не доказывает влияние" in boundary_text and "торговым сигналом" in boundary_text and
        bool(newest(driver).find_elements(By.CSS_SELECTOR, "[data-answer-source-boundary='true']")),
    )
    visual_metrics(driver, f"jupiter-ranked-{suffix}")
    active = wait(driver, "[data-active-context='true']")
    driver.execute_script("arguments[0].scrollIntoView({block:'center',inline:'nearest'});", active)
    driver.save_screenshot(str(ARTIFACTS / f"active-subject-jupiter-{suffix}.png"))

    mercury_question = "Теперь Меркурий в 2026 году"
    submit(driver, mercury_question, "ASTRO_INTERVAL", "NEW_TOPIC", "mercury", 3)
    active = wait(driver, "[data-active-context='true']")
    check(f"named_{suffix}_explicit_mercury_override", active.get_attribute("data-active-subject") == "mercury")
    check(f"named_{suffix}_mercury_period_2026", active.get_attribute("data-active-period") == "2026")
    check(
        f"named_{suffix}_no_horizontal_overflow_after_override",
        driver.execute_script("return document.documentElement.scrollWidth <= window.innerWidth + 1;"),
    )
    driver.execute_script("arguments[0].scrollIntoView({block:'center',inline:'nearest'});", active)
    driver.save_screenshot(str(ARTIFACTS / f"active-subject-mercury-{suffix}.png"))


def write_gallery():
    cards = []
    for image in sorted(ARTIFACTS.glob("*-viewport.png")):
        answer = image.with_name(image.name.replace("-viewport.png", "-answer.png"))
        cards.append(
            f"<article><h2>{image.stem.replace('-viewport','')}</h2>"
            f"<img src='{image.name}' alt='{image.stem} viewport'>"
            f"<img src='{answer.name}' alt='{answer.stem}'></article>"
        )
    html = """<!doctype html><html><head><meta charset='utf-8'><title>BTC public live visual acceptance</title>
<style>body{background:#080b11;color:#eef3fa;font-family:system-ui;margin:20px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}article{border:1px solid #2a3a50;border-radius:16px;padding:14px;background:#0d141e}img{display:block;width:100%;height:auto;margin-top:10px;border-radius:10px}h1,h2{margin:0 0 10px}</style></head><body><h1>BTC public live visual acceptance</h1><main>""" + "".join(cards) + "</main></body></html>"
    (ARTIFACTS / "gallery.html").write_text(html, encoding="utf-8")


drivers = []
try:
    desktop_driver = webdriver.Chrome(options=options())
    drivers.append(desktop_driver)
    ru_desktop, bridge_desktop = run_ru_sequence(desktop_driver, 1440, 1100, "desktop")
    en_desktop = run_en_annual(desktop_driver, 1440, 1100, "desktop")
    run_named_body_sequence(desktop_driver, 1440, 1100, "desktop")

    mobile_driver = webdriver.Chrome(options=options())
    drivers.append(mobile_driver)
    ru_mobile, bridge_mobile = run_ru_sequence(mobile_driver, 390, 844, "mobile")
    en_mobile = run_en_annual(mobile_driver, 390, 844, "mobile")
    run_named_body_sequence(mobile_driver, 390, 844, "mobile")

    check("ru_en_desktop_section_parity", ru_desktop["sections"] == en_desktop["sections"], f"{ru_desktop['sections']} / {en_desktop['sections']}")
    check("ru_en_mobile_section_parity", ru_mobile["sections"] == en_mobile["sections"], f"{ru_mobile['sections']} / {en_mobile['sections']}")
    check("desktop_mobile_annual_structure_parity", ru_desktop["sections"] == ru_mobile["sections"], f"{ru_desktop['sections']} / {ru_mobile['sections']}")
    check("desktop_mobile_bridge_structure_parity", bridge_desktop["sections"] == bridge_mobile["sections"], f"{bridge_desktop['sections']} / {bridge_mobile['sections']}")

    raw_severe = []
    for driver in drivers:
        raw_severe.extend(entry for entry in driver.get_log("browser") if entry.get("level") == "SEVERE")
    ignored = [entry for entry in raw_severe if "/favicon.ico" in entry.get("message", "")]
    severe = [entry for entry in raw_severe if entry not in ignored]
    report["ignored_local_network_noise"] = ignored
    report["browser_severe"] = severe
    check("browser_has_no_severe_application_errors", not severe, severe)
finally:
    for driver in drivers:
        driver.quit()

report["status"] = "FAIL" if report["failures"] else "PASS"
write_gallery()
(ARTIFACTS / "visual-acceptance-report.json").write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"BTC_PUBLIC_LIVE_VISUAL_INFORMATION_ACCEPTANCE={report['status']} checks={len(report['checks'])} failures={len(report['failures'])}")
if report["failures"]:
    raise SystemExit(1)
