from pathlib import Path
import subprocess

raw = subprocess.check_output([
    "git",
    "show",
    "83b47fa904754221549aed4f3e82c5a022446489:.github/workflows/btc-origins-history-bootstrap.yml",
], text=True)
start_marker = "          python3 <<'PY'\n"
end_marker = "\n          PY\n\n      - name: Verify static acceptance before commit"
if start_marker not in raw or end_marker not in raw:
    raise SystemExit("BOOTSTRAP_PAYLOAD_MARKERS_NOT_FOUND")
payload = raw.split(start_marker, 1)[1].split(end_marker, 1)[0]
normalized = []
in_triple_string = False
for line in payload.splitlines():
    candidate = line if in_triple_string else (line[10:] if line.startswith("          ") else line)
    normalized.append(candidate)
    if candidate.count("'''") % 2 == 1:
        in_triple_string = not in_triple_string
if in_triple_string:
    raise SystemExit("BOOTSTRAP_TRIPLE_STRING_NOT_CLOSED")
script = Path("/tmp/btc-origins-history-apply.py")
script.write_text("\n".join(normalized) + "\n", encoding="utf-8")
subprocess.run(["python3", str(script)], check=True)
