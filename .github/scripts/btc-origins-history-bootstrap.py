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
for line in payload.splitlines():
    normalized.append(line[10:] if line.startswith("          ") else line)
material = "\n".join(normalized) + "\n"
material = material.replace(
    "    count = text.count(old)\n",
    "    count = text.count(old)\n    print(f'PATCH_ATTEMPT {path} count={count} anchor={old[:80]!r}')\n",
    1,
)
script = Path("/tmp/btc-origins-history-apply.py")
script.write_text(material, encoding="utf-8")
subprocess.run(["python3", str(script)], check=True)
