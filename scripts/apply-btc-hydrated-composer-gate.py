from pathlib import Path

path = Path("components/btc/BtcCosmographerDialogue.tsx")
text = path.read_text(encoding="utf-8")
old_open = '''      <form className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live">'''
new_open = '''      {hydrated && <form className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live" data-session-hydrated="true">'''
old_close = '''      </form>
      <p className="liveBoundary">'''
new_close = '''      </form>}
      <p className="liveBoundary">'''
if text.count(old_open) != 1:
    raise SystemExit(f"expected one composer open, found {text.count(old_open)}")
if text.count(old_close) != 1:
    raise SystemExit(f"expected one composer close, found {text.count(old_close)}")
text = text.replace(old_open, new_open, 1).replace(old_close, new_close, 1)
path.write_text(text, encoding="utf-8")
Path(__file__).unlink()
