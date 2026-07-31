from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


path = "scripts/verify-btc-public-live-visual-information-acceptance.py"
replace_once(
    path,
    '''def wait_state(driver, question, mode, relation, subject, expected_turns):
    WebDriverWait(driver, 45).until(lambda instance: current_question(instance) == question)
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
    return newest(driver)
''',
    '''def session_turn_count(driver):
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
    except Exception:
        print("STATE_WAIT_DIAGNOSTIC", json.dumps(state_snapshot(driver), ensure_ascii=False))
        raise
    return newest(driver)
''',
)

print("PASS_PUBLIC_LIVE_VISUAL_SESSION_READY_PATCH")
