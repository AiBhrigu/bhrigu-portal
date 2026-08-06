from pathlib import Path

path = Path("components/btc/BtcCosmographerDialogue.tsx")
text = path.read_text(encoding="utf-8")
old = '''  const returnContextTurn = contextTurnIndex > 0
    ? latestContextTurn(turns.slice(0, contextTurnIndex))
    : null;'''
new = '''  const returnContextTurn = contextTurnIndex > 0
    ? turns[contextTurnIndex - 1] ?? null
    : turns.length > 1
      ? turns[turns.length - 2] ?? null
      : null;'''
if text.count(old) != 1:
    raise SystemExit(f"expected one return anchor block, found {text.count(old)}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
Path(__file__).unlink()
