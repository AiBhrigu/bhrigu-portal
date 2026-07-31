from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# Browser scroll restoration can override the first React effect after a GET
# navigation. Disable restoration on the live dialogue and focus/scroll the newest
# answer again across two animation frames.
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''  useEffect(() => {
    if (!hydrated || !newestRef.current) return;
    newestRef.current.focus({ preventScroll: true });
    newestRef.current.scrollIntoView({ block: "nearest" });
  }, [hydrated, turns.length]);''',
    '''  useEffect(() => {
    if (!hydrated || !newestRef.current) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const focusNewest = () => {
      const node = newestRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      node.scrollIntoView({ block: "start", inline: "nearest", behavior: "auto" });
    };
    focusNewest();
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusNewest);
    });
    return () => window.cancelAnimationFrame(firstFrame);
  }, [hydrated, turns.length]);''',
)

replace_once(
    "lib/btc-live-dialogue-style.ts",
    '''.dialogueTurn{display:grid;gap:8px;outline:none}''',
    '''.dialogueTurn{display:grid;gap:8px;outline:none;scroll-margin-top:18px}''',
)

# Measure only after the application has focused the newest answer. A bounded
# viewport capture is sufficient evidence; Chrome element screenshots time out on
# very tall bridge answers.
path = "scripts/verify-btc-public-live-visual-information-acceptance.py"
replace_once(
    path,
    '''        WebDriverWait(driver, 45).until(
            lambda instance: (
                instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-answer-mode") == mode
                and instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-semantic-context-relation") == relation
                and instance.find_element(By.CSS_SELECTOR, ".cosmographerTurn").get_attribute("data-route-subject") == subject
            )
        )
''',
    '''        WebDriverWait(driver, 45).until(
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
''',
)
replace_once(
    path,
    '''    answer.screenshot(str(ARTIFACTS / f"{label}-answer.png"))''',
    '''    driver.save_screenshot(str(ARTIFACTS / f"{label}-answer.png"))''',
)

print("PASS_PUBLIC_LIVE_NEWEST_ANSWER_FOCUS_REPAIR")
