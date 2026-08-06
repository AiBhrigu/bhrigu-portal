from pathlib import Path

path = Path("scripts/apply-btc-natural-followup-repair.py")
text = path.read_text(encoding="utf-8")

text = text.replace(
    "from textwrap import dedent\n",
    "from textwrap import dedent\nimport re\n",
    1,
)

start = text.index("def replace_once(path, old, new):")
end = text.index("\n\nroute =", start)

replacement = '''def replace_once(path, old, new):
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    label = old.splitlines()[0][:120]
    if count == 1:
        target.write_text(text.replace(old, new, 1), encoding="utf-8")
        print(f"APPLY_OK {path} · {label}")
        return
    if count > 1:
        raise SystemExit(f"{path}: non-unique exact anchor count={count} · {label!r}")
    lines = old.splitlines()
    pattern = "\\n".join(r"^[ \\t]*" + re.escape(line.lstrip()) for line in lines)
    matches = list(re.finditer(pattern, text, flags=re.MULTILINE))
    if len(matches) != 1:
        raise SystemExit(f"{path}: fuzzy anchor count={len(matches)} · {label!r}")
    match = matches[0]
    target.write_text(text[:match.start()] + new + text[match.end():], encoding="utf-8")
    print(f"APPLY_FUZZY_OK {path} · {label}")'''

path.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
Path(__file__).unlink()
