from pathlib import Path
import subprocess

workflow = Path(".github/workflows/btc-origins-history-bootstrap.yml")
raw = workflow.read_text(encoding="utf-8")
start_marker = "          python3 <<'PY'\n"
end_marker = "\n          PY\n\n      - name: Verify static acceptance before commit"
if start_marker not in raw or end_marker not in raw:
    raise SystemExit("BOOTSTRAP_PAYLOAD_MARKERS_NOT_FOUND")
payload = raw.split(start_marker, 1)[1].split(end_marker, 1)[0]
normalized = []
for line in payload.splitlines():
    normalized.append(line[10:] if line.startswith("          ") else line)
script = Path("/tmp/btc-origins-history-apply.py")
script.write_text("\n".join(normalized) + "\n", encoding="utf-8")
subprocess.run(["python3", str(script)], check=True)
