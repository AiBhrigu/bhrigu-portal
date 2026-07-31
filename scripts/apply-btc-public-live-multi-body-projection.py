from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


# Native/Next scroll restoration can run after focus. Align the newest answer by
# absolute document coordinate immediately and across bounded delayed passes.
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
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
    '''  useEffect(() => {
    if (!hydrated || !newestRef.current) return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const focusNewest = () => {
      const node = newestRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      const absoluteTop = window.scrollY + node.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(0, absoluteTop - 18), behavior: "auto" });
    };
    focusNewest();
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusNewest);
    });
    const restorationGuard = window.setTimeout(focusNewest, 80);
    const lateRestorationGuard = window.setTimeout(focusNewest, 240);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(restorationGuard);
      window.clearTimeout(lateRestorationGuard);
    };
  }, [hydrated, turns.length]);''',
)

# The visual gate waits for both focus and the governed top alignment before
# measuring the first viewport.
path = "scripts/verify-btc-public-live-visual-information-acceptance.py"
replace_once(
    path,
    '''        WebDriverWait(driver, 45).until(
            lambda instance: instance.execute_script(
                "return document.activeElement === document.querySelector('.cosmographerTurn');"
            )
        )
''',
    '''        WebDriverWait(driver, 45).until(
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
''',
)

print("PASS_PUBLIC_LIVE_ABSOLUTE_NEWEST_ANSWER_ALIGNMENT_REPAIR")
