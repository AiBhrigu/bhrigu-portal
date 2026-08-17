"""
BTC Cosmographer Canonical 140 Replay Harness
schema: btc_cosmographer_replay_harness_v0_1

Test-infrastructure-only. Do NOT run against Production without explicit authority.
Real 140 replay requires --target-url, --expected-source-sha, --expected-deployment-sha at runtime.

Usage:
  python3 scripts/run-btc-cosmographer-canonical-140-replay.py \\
    --target-url https://... \\
    --expected-source-sha <sha> \\
    --expected-deployment-sha <sha> \\
    [--output-dir ./replay-out] \\
    [--concurrency 1] \\
    [--case-ids FG-001,FG-002]

PRODUCT_CODE_MUTATION=FORBIDDEN
MERGE=FORBIDDEN
REAL_CANONICAL_140_REPLAY_IN_THIS_ATOM=FORBIDDEN
"""

from __future__ import annotations

import argparse
import csv
import datetime
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

# ---------------------------------------------------------------------------
# Authority constants
# ---------------------------------------------------------------------------
CORPUS_AUTHORITY_SHA256 = "ef7a08fa8c4bf764650ffce4a3cb85c7eebf6f19b1409446e5cba92ef06340bd"
STATE_PACKETS_AUTHORITY_SHA256 = "631f71d5c2b095248fa3ba9c66d3739d559576e59f93bf1e35e3304f2aa3a464"
TOTAL_CASES = 140
UNIQUE_CASE_IDS = 140
LAYER_COUNTS: Dict[str, int] = {
    "FOUNDER_GOLDEN_SET": 14,
    "AI_MODE_COVERAGE_CORPUS": 72,
    "REGRESSION_CORPUS": 27,
    "ADVERSARIAL_AND_AMBIGUITY_CORPUS": 27,
}
PACKET_SCHEMA = "btc_cosmographer_evaluator_state_packet_v0_1"
SESSION_MODES = {"CLEAN_SESSION", "NEW_CONVERSATION_CLEAN", "EXACT_PRIOR_TURN_SEQUENCE"}

REPO_ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = REPO_ROOT / "tests" / "fixtures" / "btc-cosmographer-canonical-140-v0_1.csv"
PACKETS_PATH = REPO_ROOT / "tests" / "fixtures" / "btc-cosmographer-canonical-state-packets-v0_1.json"

VERDICTS = ("PASS", "FAIL", "BLOCKED")

FAILURE_CLASSES = [
    "ROUTING",
    "CONTEXT_MEMORY",
    "FOLLOW_UP",
    "SUBJECT_RESOLUTION",
    "TIME_SCOPE",
    "FALSE_CLARIFICATION",
    "KNOWLEDGE_MISSING",
    "EVIDENCE",
    "FRESHNESS",
    "PROTOCOL_KNOWLEDGE",
    "MARKET_KNOWLEDGE",
    "ASTRO_FIELD",
    "ASTRO_X_BTC",
    "ANSWER_GRAMMAR",
    "ANSWER_DIRECTNESS",
    "CAUSAL_BOUNDARY",
    "TRADING_BOUNDARY",
    "UNKNOWN_REFUSAL",
    "INTENTIONAL_BOUNDARY",
    "OTHER_EXACTLY_DESCRIBED",
]

MANDATORY_CAPTURE_FIELDS = [
    "ROUTE_DOMAIN",
    "ROUTE_SUBJECT",
    "INTENTS",
    "CONTEXT_RELATION",
    "TIME_SCOPE",
    "ANSWER_STATE",
    "ANSWER_MODE",
    "ROUTE_DISPOSITION",
    "PRIMARY_AUTHORITY",
    "EVIDENCE_LEVELS",
    "SOURCE_REVISION",
    "FRESHNESS",
    "BINANCE_BINDING_STATE",
    "DIRECT_ANSWER",
    "BOUNDARY_STATE",
]


# ---------------------------------------------------------------------------
# Fixture validation
# ---------------------------------------------------------------------------

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_string(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _verify_packet_hash(p: Dict, file_sha_is_authority: bool) -> bool:
    """
    Verify a packet's declared packet_hash.

    When the packets file's SHA256 matches the frozen authority (file_sha_is_authority=True),
    the file-level check already proves byte-for-byte integrity; we validate only format
    (must be a well-formed sha256:<64-hex> value).

    When file SHA was overridden or is unknown (file_sha_is_authority=False, e.g. in selftests
    that patch the authority), we re-derive the hash from packet content and compare strictly.
    This is the gate that rejects a syntactically valid but incorrect hash.
    """
    declared = p.get("packet_hash", "")
    if not declared:
        return False
    hash_value = declared[len("sha256:"):] if declared.startswith("sha256:") else declared
    # Must be exactly 64 lowercase hex chars
    if not (len(hash_value) == 64 and all(c in "0123456789abcdef" for c in hash_value)):
        return False
    if file_sha_is_authority:
        # File-level SHA256 already proves integrity; trust opaque authority hash
        return True
    # File SHA not authoritative (patched in selftest) → re-derive and compare
    p_for_hash = {k: v for k, v in p.items() if k != "packet_hash"}
    expected = sha256_string(json.dumps(p_for_hash, sort_keys=True, ensure_ascii=False))
    return hash_value == expected


def validate_fixtures(corpus_path: Path, packets_path: Path) -> tuple[list, list, list]:
    """
    Validate fixture files against authority. Returns (csv_rows, packets, packets_index).
    Raises SystemExit on any violation.
    """
    errors: List[str] = []

    # Hash validation
    corpus_sha = sha256_file(corpus_path)
    if corpus_sha != CORPUS_AUTHORITY_SHA256:
        errors.append(
            f"CORPUS_HASH_MISMATCH: expected={CORPUS_AUTHORITY_SHA256} actual={corpus_sha}"
        )

    packets_sha = sha256_file(packets_path)
    packets_file_is_authority = (packets_sha == STATE_PACKETS_AUTHORITY_SHA256)
    if not packets_file_is_authority:
        errors.append(
            f"STATE_PACKETS_HASH_MISMATCH: expected={STATE_PACKETS_AUTHORITY_SHA256} actual={packets_sha}"
        )

    if errors:
        for e in errors:
            print(f"FIXTURE_VALIDATION_ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    # Load CSV
    with open(corpus_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        csv_rows = list(reader)

    if len(csv_rows) != TOTAL_CASES:
        print(
            f"FIXTURE_VALIDATION_ERROR: total_cases expected={TOTAL_CASES} actual={len(csv_rows)}",
            file=sys.stderr,
        )
        sys.exit(1)

    case_ids = [r["CASE_ID"] for r in csv_rows]
    if len(set(case_ids)) != UNIQUE_CASE_IDS:
        print(
            f"FIXTURE_VALIDATION_ERROR: duplicate_case_ids detected; unique={len(set(case_ids))} expected={UNIQUE_CASE_IDS}",
            file=sys.stderr,
        )
        sys.exit(1)

    # Layer counts
    from collections import Counter
    layer_counts = Counter(r["CORPUS_LAYER"] for r in csv_rows)
    for layer, expected_count in LAYER_COUNTS.items():
        actual = layer_counts.get(layer, 0)
        if actual != expected_count:
            print(
                f"FIXTURE_VALIDATION_ERROR: layer_count {layer} expected={expected_count} actual={actual}",
                file=sys.stderr,
            )
            sys.exit(1)

    # Load packets
    with open(packets_path, encoding="utf-8") as f:
        packets_doc = json.load(f)

    packets: List[Dict] = packets_doc["packets"]

    # One packet per case ID
    packet_case_ids = [p["case_id"] for p in packets]
    if len(packet_case_ids) != TOTAL_CASES:
        print(
            f"FIXTURE_VALIDATION_ERROR: packet_count expected={TOTAL_CASES} actual={len(packet_case_ids)}",
            file=sys.stderr,
        )
        sys.exit(1)

    if len(set(packet_case_ids)) != UNIQUE_CASE_IDS:
        print(
            f"FIXTURE_VALIDATION_ERROR: duplicate_packet_case_ids detected",
            file=sys.stderr,
        )
        sys.exit(1)

    # All CSV case IDs must have a packet
    csv_id_set = set(case_ids)
    packet_id_set = set(packet_case_ids)
    missing = csv_id_set - packet_id_set
    if missing:
        print(
            f"FIXTURE_VALIDATION_ERROR: missing_packets for case_ids={sorted(missing)}",
            file=sys.stderr,
        )
        sys.exit(1)

    # Validate all packet hashes
    packets_index: Dict[str, Dict] = {}
    for p in packets:
        declared = p.get("packet_hash")
        if not declared:
            print(
                f"FIXTURE_VALIDATION_ERROR: packet_hash missing for case_id={p['case_id']}",
                file=sys.stderr,
            )
            sys.exit(1)
        if not _verify_packet_hash(p, packets_file_is_authority):
            print(
                f"FIXTURE_VALIDATION_ERROR: packet_hash invalid for case_id={p['case_id']} value={declared!r}",
                file=sys.stderr,
            )
            sys.exit(1)
        packets_index[p["case_id"]] = p

    return csv_rows, packets, packets_index


# ---------------------------------------------------------------------------
# Browser session helpers (thin wrappers around Selenium)
# ---------------------------------------------------------------------------

def _make_driver():
    from selenium import webdriver

    options = webdriver.ChromeOptions()
    for arg in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"):
        options.add_argument(arg)
    # Enable performance logging for HTTP response header capture (required for source SHA)
    caps = {
        "goog:loggingPrefs": {"performance": "ALL"},
    }
    for k, v in caps.items():
        options.set_capability(k, v)
    return webdriver.Chrome(options=options)


def _parse_perf_log_entries(entries: list) -> tuple:
    """
    Parse an already-read list of Chrome performance log entries and extract:
    - source_sha: from x-btc-deployment-source-sha header in the first Document response
      (source SHA header is always set on the main Document response, not XHR/Fetch)
    - headers: full lower-cased header dict from the first Document response;
      falls back to the first XHR/Fetch response if no Document response is found,
      preserving the original _capture_response_headers() fallback behaviour.

    Returns (source_sha_or_None, headers_dict).
    Consumes no additional log reads.
    """
    source_sha: Optional[str] = None
    headers: Dict[str, Any] = {}
    fallback_headers: Dict[str, Any] = {}
    for entry in entries:
        try:
            msg = json.loads(entry.get("message", "{}"))
            params = msg.get("message", {}).get("params", {})
            if msg.get("message", {}).get("method") == "Network.responseReceived":
                resp_type = params.get("type", "")
                resp = params.get("response", {})
                raw_hdrs = resp.get("headers", {})
                hdrs = {k.lower(): v for k, v in raw_hdrs.items()}
                if resp_type == "Document":
                    # Source SHA is always on the main Document response
                    if source_sha is None:
                        sha = hdrs.get("x-btc-deployment-source-sha")
                        if sha:
                            source_sha = sha.strip()
                    # Document headers take priority for the response_headers dict
                    if not headers:
                        headers = hdrs
                elif resp_type in ("XHR", "Fetch") and not fallback_headers:
                    # Preserve original fallback behaviour from _capture_response_headers
                    fallback_headers = hdrs
        except Exception:
            continue
    return source_sha, headers if headers else fallback_headers


def _extract_source_sha_from_perf_log(driver) -> Optional[str]:
    """
    Extract the source SHA from the HTTP response header `x-btc-deployment-source-sha`
    of the main Document response, using the Chrome performance log (CDP).
    Returns None if not found.

    NOTE: This drains the performance log. Use _capture_identity_and_headers when
    both source SHA and response headers are needed from the same navigation.
    """
    try:
        entries = driver.get_log("performance")
        source_sha, _ = _parse_perf_log_entries(entries)
        return source_sha
    except Exception:
        return None


def _capture_identity_and_headers(driver) -> Dict[str, Any]:
    """
    Read the Chrome performance log EXACTLY ONCE per navigation and extract
    source SHA (from x-btc-deployment-source-sha header) and response headers.
    Also reads deployment SHA from DOM (a separate JS call, not the performance log).

    Returns {source_sha, deployment_sha, response_headers}.

    This is the single-read replacement for the former separate
    _capture_sha_headers() + _capture_response_headers() pair.
    """
    # Read performance log exactly once
    try:
        entries = driver.get_log("performance")
    except Exception:
        entries = []

    source_sha, response_headers = _parse_perf_log_entries(entries)

    # Deployment SHA from DOM (JS execute_script, not the performance log)
    try:
        deployment_sha = driver.execute_script(
            "return document.querySelector('[data-deployment-head-sha]')?.getAttribute('data-deployment-head-sha') || null"
        )
    except Exception:
        deployment_sha = None

    return {
        "source_sha": source_sha,
        "deployment_sha": deployment_sha,
        "response_headers": response_headers,
    }


def _capture_observation(driver) -> Dict[str, Any]:
    """
    Capture mandatory evaluator fields from the last cosmographerTurn in the DOM.
    All fields are read from real product DOM attributes; missing fields yield None (never guessed).

    Attribute mapping (per actual product DOM at BASE_SHA):
    - data-route-domain          → ROUTE_DOMAIN
    - data-route-subject         → ROUTE_SUBJECT
    - data-question-facets       → INTENTS  (NOT data-intents)
    - data-context-relation      → CONTEXT_RELATION
    - data-answer-state          → ANSWER_STATE
    - data-answer-mode           → ANSWER_MODE
    - data-route-disposition     → ROUTE_DISPOSITION
    - data-primary-authority     → PRIMARY_AUTHORITY
    - .answerLead[data-answer-direct="true"] text → DIRECT_ANSWER (NOT data-direct-answer attr)
    - data-evidence-metadata dl  → evidence metadata fields (observation-period, coverage, revision)
    - data-evidence-artifact-targets → evidence targets
    - data-semantic-answer-section   → answer section order/ids
    - data-answer-source-boundary section → SOURCE_BOUNDARY / BOUNDARY_STATE
    - data-binance-binding-status    → BINANCE_BINDING_STATE
    - sessionStorage / session schema → EVIDENCE_LEVELS, TIME_SCOPE, SOURCE_REVISION, FRESHNESS
    """
    obs: Dict[str, Any] = {}
    try:
        node = driver.execute_script(
            "const nodes = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "return nodes.length ? nodes[nodes.length - 1] : null;"
        )
    except Exception:
        node = None

    if node is None:
        for f in MANDATORY_CAPTURE_FIELDS:
            obs[f] = None
        obs["_dom_available"] = False
        return obs

    obs["_dom_available"] = True

    # Direct data-attribute fields on cosmographerTurn
    for attr, field in [
        ("data-route-domain", "ROUTE_DOMAIN"),
        ("data-route-subject", "ROUTE_SUBJECT"),
        ("data-question-facets", "INTENTS"),       # real product attr (NOT data-intents)
        ("data-context-relation", "CONTEXT_RELATION"),
        ("data-answer-state", "ANSWER_STATE"),
        ("data-answer-mode", "ANSWER_MODE"),
        ("data-route-disposition", "ROUTE_DISPOSITION"),
        ("data-primary-authority", "PRIMARY_AUTHORITY"),
    ]:
        try:
            obs[field] = node.get_attribute(attr)
        except Exception:
            obs[field] = None

    # DIRECT_ANSWER: text of .answerLead[data-answer-direct="true"] (not a data-attr on turn)
    try:
        obs["DIRECT_ANSWER"] = driver.execute_script(
            "const turn = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "if (!turn.length) return null;"
            "const last = turn[turn.length - 1];"
            "const lead = last.querySelector('.answerLead[data-answer-direct=\"true\"]');"
            "return lead ? lead.textContent : null;"
        )
    except Exception:
        obs["DIRECT_ANSWER"] = None

    # Answer section order/identifiers: data-semantic-answer-section values in DOM order
    try:
        obs["_answer_section_ids"] = driver.execute_script(
            "const turn = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "if (!turn.length) return [];"
            "const last = turn[turn.length - 1];"
            "return Array.from(last.querySelectorAll('[data-semantic-answer-section]'))"
            "  .map(el => el.getAttribute('data-semantic-answer-section'));"
        )
    except Exception:
        obs["_answer_section_ids"] = []

    # SOURCE_BOUNDARY / BOUNDARY_STATE: text from data-answer-source-boundary section
    try:
        obs["BOUNDARY_STATE"] = driver.execute_script(
            "const turn = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "if (!turn.length) return null;"
            "const last = turn[turn.length - 1];"
            "const bd = last.querySelector('[data-answer-source-boundary]');"
            "return bd ? bd.textContent?.trim() : null;"
        )
    except Exception:
        obs["BOUNDARY_STATE"] = None

    # Evidence metadata fields (observation-period, evidence-coverage, evidence-revision)
    try:
        obs["_evidence_metadata"] = driver.execute_script(
            "const turn = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "if (!turn.length) return {};"
            "const last = turn[turn.length - 1];"
            "const meta = {};"
            "last.querySelectorAll('[data-evidence-metadata] [data-evidence-field]').forEach(el => {"
            "  meta[el.getAttribute('data-evidence-field')] = el.getAttribute('data-evidence-value');"
            "});"
            "return meta;"
        )
        # SOURCE_REVISION: evidence-revision-or-generated-time field
        obs["SOURCE_REVISION"] = (obs.get("_evidence_metadata") or {}).get(
            "evidence-revision-or-generated-time"
        )
        obs["_evidence_observation_period"] = (obs.get("_evidence_metadata") or {}).get(
            "observation-period"
        )
        obs["_evidence_coverage"] = (obs.get("_evidence_metadata") or {}).get(
            "evidence-coverage"
        )
    except Exception:
        obs["_evidence_metadata"] = {}
        obs["SOURCE_REVISION"] = None

    # Evidence artifact targets: data-evidence-artifact-targets list items
    try:
        obs["_evidence_targets"] = driver.execute_script(
            "const turn = document.querySelectorAll('.dialogueExchange .cosmographerTurn');"
            "if (!turn.length) return [];"
            "const last = turn[turn.length - 1];"
            "const ul = last.querySelector('[data-evidence-artifact-targets]');"
            "if (!ul) return [];"
            "return Array.from(ul.querySelectorAll('li')).map(li => ({"
            "  label: li.querySelector('a')?.textContent?.trim(),"
            "  url: li.querySelector('a')?.href,"
            "  revision: li.querySelector('code')?.textContent?.trim()"
            "}));"
        )
    except Exception:
        obs["_evidence_targets"] = []

    # BINANCE_BINDING_STATE: from data-binance-binding-status (on BinanceLiveBindingPanel).
    # When no binding panel is present, record explicit NOT_APPLICABLE (not null ambiguity).
    try:
        binance_val = driver.execute_script(
            "const el = document.querySelector('[data-binance-binding-status]');"
            "return el ? el.getAttribute('data-binance-binding-status') : 'NOT_APPLICABLE';"
        )
        obs["BINANCE_BINDING_STATE"] = binance_val if binance_val else "NOT_APPLICABLE"
    except Exception:
        obs["BINANCE_BINDING_STATE"] = "NOT_APPLICABLE"

    # Runtime schema and session schema from main element
    try:
        obs["_runtime_schema"] = driver.execute_script(
            "return document.querySelector('[data-runtime-schema]')?.getAttribute('data-runtime-schema') || null;"
        )
        obs["_session_schema"] = driver.execute_script(
            "return document.querySelector('[data-session-schema]')?.getAttribute('data-session-schema') || null;"
        )
    except Exception:
        obs["_runtime_schema"] = None
        obs["_session_schema"] = None

    # Capture full text of answer turn
    try:
        obs["_answer_text"] = node.text
    except Exception:
        obs["_answer_text"] = None

    return obs


def _capture_session_state(driver) -> Dict[str, Any]:
    """Read session storage / localStorage for session schema key."""
    try:
        session_raw = driver.execute_script(
            "const keys = ['bhrigu:btc-cosmographer:session:v0_3',"
            "'bhrigu:btc-free-dialogue:session:v0_1'];"
            "for (const k of keys) {"
            "  const v = sessionStorage.getItem(k) || localStorage.getItem(k);"
            "  if (v) return {key: k, value: v};"
            "}"
            "return null;"
        )
    except Exception:
        session_raw = None
    if session_raw is None:
        return {}
    try:
        parsed = json.loads(session_raw["value"])
        return {"session_key": session_raw["key"], "session_value": parsed}
    except Exception:
        return {"session_key": session_raw.get("key"), "session_raw": session_raw.get("value")}


def _capture_next_data(driver) -> Dict[str, Any]:
    """
    Capture window.__NEXT_DATA__.props.pageProps from the page.
    Returns an empty dict if unavailable.
    """
    try:
        data = driver.execute_script(
            "try { return window.__NEXT_DATA__?.props?.pageProps || {}; } catch(e) { return {}; }"
        )
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _extract_session_fields(session_state: Dict[str, Any], next_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extract evaluator fields from the serialized session and __NEXT_DATA__.

    BtcDialogueTurn fields used:
      - `evidence_levels` → EVIDENCE_LEVELS
      - `time_start` / `time_end` → TIME_SCOPE (derived range; NOT a direct field on BtcDialogueTurn)
      - `source_snapshot_generated_at_utc` → SOURCE_REVISION (when not already captured from DOM)

    FRESHNESS is derived from window.__NEXT_DATA__.props.pageProps.sourceContext.state (page props),
    not from a BtcDialogueTurn field (which does not expose a `freshness` field).

    Returns a dict of field overrides for the observation.
    """
    out: Dict[str, Any] = {
        "EVIDENCE_LEVELS": None,
        "TIME_SCOPE": None,
        "FRESHNESS": None,
        "_latest_turn": None,
        "_session_evidence": None,
    }
    session_value = session_state.get("session_value")
    if isinstance(session_value, dict):
        turns = session_value.get("turns", [])
        if turns:
            latest = turns[-1]
            out["_latest_turn"] = latest
            out["EVIDENCE_LEVELS"] = latest.get("evidence_levels")
            # Derive TIME_SCOPE from time_start / time_end (BtcDialogueTurn fields)
            t_start = latest.get("time_start")
            t_end = latest.get("time_end")
            if t_start and t_end:
                out["TIME_SCOPE"] = f"{t_start}/{t_end}"
            elif t_start:
                out["TIME_SCOPE"] = t_start
            elif t_end:
                out["TIME_SCOPE"] = t_end
            # SOURCE_REVISION from session turn if not already in DOM evidence
            out["_session_source_snapshot"] = latest.get("source_snapshot_generated_at_utc")
        out["_session_evidence"] = session_value.get("evidence")

    # FRESHNESS from __NEXT_DATA__ page props sourceContext
    if next_data:
        source_context = next_data.get("sourceContext") or {}
        freshness_state = source_context.get("state")
        if freshness_state:
            out["FRESHNESS"] = freshness_state

    return out


def _wait_for_answer(driver, timeout: int = 60) -> bool:
    """Wait until a .cosmographerTurn element appears. Returns True if found."""
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.common.by import By

    try:
        WebDriverWait(driver, timeout).until(
            lambda d: d.find_elements(By.CSS_SELECTOR, ".dialogueExchange .cosmographerTurn")
        )
        return True
    except Exception:
        return False


def _submit_question(driver, target_url: str, question: str, locale: str):
    """Navigate to target URL and submit a question via the form."""
    params = {"lang": locale.lower(), "q": question}
    url = f"{target_url.rstrip('/')}/crypto-astro/btc/live?{urlencode(params)}"
    driver.get(url)


def _submit_question_in_existing_session(driver, question: str, locale: str) -> bool:
    """
    Submit a follow-up question in an already-open session by typing into the input form.
    Returns True if the input was found and submitted.
    """
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait

    try:
        # Wait for input field
        WebDriverWait(driver, 10).until(
            lambda d: d.find_elements(By.CSS_SELECTOR, "input[name='q'], textarea[name='q'], form input[type='text']")
        )
        inputs = driver.find_elements(By.CSS_SELECTOR, "input[name='q'], textarea[name='q'], form input[type='text']")
        if not inputs:
            return False
        inp = inputs[-1]
        inp.clear()
        inp.send_keys(question)
        # Find submit button or press Enter
        btns = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], form button")
        if btns:
            btns[-1].click()
        else:
            from selenium.webdriver.common.keys import Keys
            inp.send_keys(Keys.RETURN)
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Precondition gate
# ---------------------------------------------------------------------------

def _check_per_turn_contract(
    turn_contract: Dict[str, Any],
    obs: Dict[str, Any],
    turn_index: int,
    submitted_question: Optional[str] = None,
) -> Optional[str]:
    """
    Validate observable state after a setup turn against the frozen per-turn contract
    from `prior_turns.value[turn_index - 1]`.

    Validates all observable fixed fields from the per-turn contract:
      route_domain, route_subject, context_relation,
      answer_state (from expected_answer_state.value), answer_mode, route_disposition,
      expected_intents (each declared intent must appear in INTENTS),
      expected_active_period (start/end dates must appear in TIME_SCOPE),
      question_exact (if submitted_question provided, must match contract),
      locale (packet-level check; session observable when available).

    COPY_EXACT_OBSERVED_FIELD fields are not compared here; they bind after observation.

    Returns a BLOCKED reason string if mismatch, or None if OK.
    """
    mismatches: List[str] = []

    # question_exact: packet integrity — submitted question must match frozen contract
    if submitted_question is not None:
        contract_q = turn_contract.get("question_exact")
        if contract_q and submitted_question != contract_q:
            mismatches.append(
                f"question_exact: submitted={submitted_question!r} contract={contract_q!r}"
            )

    # locale: validate contract locale matches packet locale if observable in obs
    contract_locale = turn_contract.get("locale")
    obs_locale = (obs.get("_session_locale") or "").lower()
    if contract_locale and obs_locale and obs_locale != contract_locale.lower():
        mismatches.append(
            f"locale: expected={contract_locale!r} observed={obs_locale!r}"
        )

    # expected_route_domain
    exp_domain = turn_contract.get("expected_route_domain")
    obs_domain = (obs.get("ROUTE_DOMAIN") or "").lower()
    if exp_domain and obs_domain != exp_domain.lower():
        mismatches.append(
            f"route_domain: expected={exp_domain!r} observed={obs_domain!r}"
        )

    # expected_route_subject
    exp_subject = turn_contract.get("expected_route_subject")
    obs_subject = (obs.get("ROUTE_SUBJECT") or "").lower()
    if exp_subject and obs_subject != exp_subject.lower():
        mismatches.append(
            f"route_subject: expected={exp_subject!r} observed={obs_subject!r}"
        )

    # expected_intents (list): each declared intent must appear in observed INTENTS
    exp_intents = turn_contract.get("expected_intents")
    if isinstance(exp_intents, list) and exp_intents:
        obs_intents_str = (obs.get("INTENTS") or "").lower()
        for intent in exp_intents:
            if intent.lower() not in obs_intents_str:
                mismatches.append(
                    f"intents: expected_intent={intent!r} not found in INTENTS={obs.get('INTENTS')!r}"
                )

    # expected_context_relation
    exp_cr = turn_contract.get("expected_context_relation")
    obs_cr = (obs.get("CONTEXT_RELATION") or "").upper()
    if exp_cr and obs_cr != exp_cr.upper():
        mismatches.append(
            f"context_relation: expected={exp_cr!r} observed={obs_cr!r}"
        )

    # expected_answer_state: dict with mode/value or a string
    exp_answer_state_raw = turn_contract.get("expected_answer_state")
    if exp_answer_state_raw:
        if isinstance(exp_answer_state_raw, dict):
            exp_as_value = exp_answer_state_raw.get("value", "")
        else:
            exp_as_value = str(exp_answer_state_raw)
        obs_as = (obs.get("ANSWER_STATE") or "").upper()
        if exp_as_value and obs_as != exp_as_value.upper():
            mismatches.append(
                f"answer_state: expected={exp_as_value!r} observed={obs_as!r}"
            )

    # expected_answer_mode
    exp_am = turn_contract.get("expected_answer_mode")
    obs_am = (obs.get("ANSWER_MODE") or "").upper()
    if exp_am and obs_am != exp_am.upper():
        mismatches.append(
            f"answer_mode: expected={exp_am!r} observed={obs_am!r}"
        )

    # expected_active_period: start/end dates must appear in TIME_SCOPE
    exp_period = turn_contract.get("expected_active_period")
    if isinstance(exp_period, dict):
        obs_ts = (obs.get("TIME_SCOPE") or "")
        exp_start = exp_period.get("start")
        exp_end = exp_period.get("end")
        if exp_start and exp_start not in obs_ts:
            mismatches.append(
                f"active_period.start: expected={exp_start!r} not found in TIME_SCOPE={obs_ts!r}"
            )
        if exp_end and exp_end not in obs_ts:
            mismatches.append(
                f"active_period.end: expected={exp_end!r} not found in TIME_SCOPE={obs_ts!r}"
            )

    # expected_route_disposition
    exp_disp = turn_contract.get("expected_route_disposition")
    obs_disp = (obs.get("ROUTE_DISPOSITION") or "").upper()
    if exp_disp and obs_disp != exp_disp.upper():
        mismatches.append(
            f"route_disposition: expected={exp_disp!r} observed={obs_disp!r}"
        )

    if mismatches:
        return (
            f"SETUP_PRECONDITION_MISMATCH: turn_{turn_index} "
            + "; ".join(mismatches)
        )
    return None


def _check_precondition_against_packet(
    packet: Dict[str, Any],
    obs: Dict[str, Any],
    session_state: Dict[str, Any],
    setup_turn_index: int,
    submitted_question: Optional[str] = None,
) -> Optional[str]:
    """
    Compare the observable session/context state after a setup turn against
    the frozen packet's per-turn contract (from prior_turns.value[i]).
    Falls back to expected_context_packet for final-state validation.
    Returns a BLOCKED reason string if mismatch, or None if OK.

    runtime_seed.value.precondition_gate =
      "COMPARE_OBSERVED_SESSION_AND_CONTEXT_TO_FROZEN_PACKET_BEFORE_TARGET; MISMATCH=BLOCKED"
    """
    # Per-turn contract from prior_turns.value[setup_turn_index - 1]
    prior_turns = packet.get("prior_turns") or {}
    prior_turns_value = prior_turns.get("value") or []
    idx = setup_turn_index - 1  # 0-based
    if idx < len(prior_turns_value):
        turn_contract = prior_turns_value[idx]
        return _check_per_turn_contract(
            turn_contract, obs, setup_turn_index,
            submitted_question=submitted_question,
        )

    # Fallback: expected_context_packet for packets that don't have per-turn contracts
    expected_ctx = packet.get("expected_context_packet")
    if not expected_ctx or not isinstance(expected_ctx, dict):
        return None

    mismatches: List[str] = []
    expected_domain = expected_ctx.get("prior_domain")
    observed_domain = (obs.get("ROUTE_DOMAIN") or "").lower()
    if expected_domain and observed_domain != expected_domain.lower():
        mismatches.append(
            f"prior_domain: expected={expected_domain!r} observed={observed_domain!r}"
        )

    expected_subject = expected_ctx.get("prior_subject")
    observed_subject = (obs.get("ROUTE_SUBJECT") or "").lower()
    if expected_subject and observed_subject != expected_subject.lower():
        mismatches.append(
            f"prior_subject: expected={expected_subject!r} observed={observed_subject!r}"
        )

    expected_answer_state = expected_ctx.get("prior_answer_state")
    observed_answer_state = (obs.get("ANSWER_STATE") or "").upper()
    if expected_answer_state and observed_answer_state != expected_answer_state.upper():
        mismatches.append(
            f"prior_answer_state: expected={expected_answer_state!r} observed={observed_answer_state!r}"
        )

    if mismatches:
        return (
            f"SETUP_PRECONDITION_MISMATCH: turn_{setup_turn_index} "
            + "; ".join(mismatches)
        )
    return None


# ---------------------------------------------------------------------------
# Batch identity preflight
# ---------------------------------------------------------------------------

def _batch_identity_preflight(
    driver,
    target_url: str,
    expected_source_sha: str,
    expected_deployment_sha: str,
) -> tuple:
    """
    Navigate to the target URL and verify that the served source/deployment SHAs
    match the expected values.

    Reads the Chrome performance log EXACTLY ONCE per navigation (via
    _capture_identity_and_headers) to obtain both the source SHA and response
    headers without a second log drain.

    Returns a 3-tuple: (block_reason_or_None, served_source_sha, served_deployment_sha).
    - block_reason is None when identity is confirmed (PASS).
    - served_source_sha and served_deployment_sha are the observed values even when
      they are wrong/missing, so they can always be recorded in the run manifest.

    Source SHA: HTTP response header `x-btc-deployment-source-sha` (performance log).
    Deployment SHA: DOM attribute `data-deployment-head-sha`.
    Both must be present and match; any mismatch blocks the entire batch.
    """
    try:
        base_url = f"{target_url.rstrip('/')}/crypto-astro/btc/live"
        driver.get(base_url)
        # Give the page a moment to load and emit Network events
        time.sleep(2)
        # Single log read — extracts source SHA, deployment SHA, and response headers
        identity = _capture_identity_and_headers(driver)
        served_source = identity.get("source_sha")
        served_deploy = identity.get("deployment_sha")

        reasons: List[str] = []
        if not served_source or served_source != expected_source_sha:
            reasons.append(
                f"SOURCE_SHA_MISMATCH: expected={expected_source_sha} served={served_source}"
            )
        if not served_deploy or served_deploy != expected_deployment_sha:
            reasons.append(
                f"DEPLOYMENT_SHA_MISMATCH: expected={expected_deployment_sha} served={served_deploy}"
            )
        if reasons:
            block_reason = (
                "BATCH_IDENTITY_BLOCKED: "
                + "; ".join(reasons)
                + f" | served_source={served_source} served_deploy={served_deploy}"
            )
            return block_reason, served_source, served_deploy
        return None, served_source, served_deploy
    except Exception as exc:
        return f"BATCH_IDENTITY_BLOCKED: preflight_error={exc}", None, None


# ---------------------------------------------------------------------------
# Verdict evaluation
# ---------------------------------------------------------------------------

def _is_binance_trading_intent(obs: Dict[str, Any]) -> bool:
    """Detect trading-intent Binance fetch (boundary failure)."""
    boundary = (obs.get("BOUNDARY_STATE") or "").upper()
    binance = (obs.get("BINANCE_BINDING_STATE") or "").upper()
    boundary_violation = (
        "TRADING_BOUNDARY_VIOLATION" in boundary
        or "TRADING_INTENT" in boundary
        or boundary == "TRADING"
    )
    binance_trading = "TRADING_INTENT" in binance
    return boundary_violation or binance_trading


def _validate_final_state_before_target(
    packet: Dict[str, Any],
    obs: Dict[str, Any],
    session_state: Dict[str, Any],
) -> Optional[str]:
    """
    Validate the final expected_context_packet and expected_session_state cardinality predicates
    from the frozen packet against observations captured after the LAST setup turn.

    Must be called only after all setup turns are complete, before target submission.
    Returns a BLOCKED reason string if any fixed field mismatches, or None if OK.
    """
    mismatches: List[str] = []

    # --- expected_context_packet fixed fields ---
    expected_ctx = packet.get("expected_context_packet")
    if isinstance(expected_ctx, dict):
        # prior_domain
        exp_domain = expected_ctx.get("prior_domain")
        obs_domain = (obs.get("ROUTE_DOMAIN") or "").lower()
        if exp_domain and obs_domain != exp_domain.lower():
            mismatches.append(
                f"expected_context_packet.prior_domain: expected={exp_domain!r} observed={obs_domain!r}"
            )

        # prior_subject
        exp_subject = expected_ctx.get("prior_subject")
        obs_subject = (obs.get("ROUTE_SUBJECT") or "").lower()
        if exp_subject and obs_subject != exp_subject.lower():
            mismatches.append(
                f"expected_context_packet.prior_subject: expected={exp_subject!r} observed={obs_subject!r}"
            )

        # prior_answer_state
        exp_as = expected_ctx.get("prior_answer_state")
        obs_as = (obs.get("ANSWER_STATE") or "").upper()
        if exp_as and obs_as != exp_as.upper():
            mismatches.append(
                f"expected_context_packet.prior_answer_state: expected={exp_as!r} observed={obs_as!r}"
            )

        # prior_intents (list): each declared intent must appear in observed INTENTS
        exp_intents = expected_ctx.get("prior_intents")
        if isinstance(exp_intents, list) and exp_intents:
            obs_intents_str = (obs.get("INTENTS") or "").lower()
            for intent in exp_intents:
                if intent.lower() not in obs_intents_str:
                    mismatches.append(
                        f"expected_context_packet.prior_intents: intent={intent!r} not found "
                        f"in observed INTENTS={obs.get('INTENTS')!r}"
                    )

        # prior_time_start / prior_time_end → TIME_SCOPE
        obs_ts = (obs.get("TIME_SCOPE") or "")
        prior_time_start = expected_ctx.get("prior_time_start")
        prior_time_end = expected_ctx.get("prior_time_end")
        if prior_time_start and prior_time_start not in obs_ts:
            mismatches.append(
                f"expected_context_packet.prior_time_start: expected={prior_time_start!r} "
                f"not found in TIME_SCOPE={obs_ts!r}"
            )
        if prior_time_end and prior_time_end not in obs_ts:
            mismatches.append(
                f"expected_context_packet.prior_time_end: expected={prior_time_end!r} "
                f"not found in TIME_SCOPE={obs_ts!r}"
            )

    # --- expected_session_state cardinality predicates ---
    expected_ss = packet.get("expected_session_state")
    if isinstance(expected_ss, dict):
        session_value = (session_state.get("session_value") or {}) if session_state else {}

        # locale
        exp_locale = expected_ss.get("locale")
        obs_locale = (session_value.get("locale") or "").lower()
        if exp_locale and obs_locale and obs_locale != exp_locale.lower():
            mismatches.append(
                f"expected_session_state.locale: expected={exp_locale!r} observed={obs_locale!r}"
            )

        # turn_count
        exp_turn_count = expected_ss.get("turn_count")
        if isinstance(exp_turn_count, int):
            obs_turns = session_value.get("turns")
            obs_turn_count = len(obs_turns) if isinstance(obs_turns, list) else None
            if obs_turn_count is not None and obs_turn_count != exp_turn_count:
                mismatches.append(
                    f"expected_session_state.turn_count: expected={exp_turn_count} observed={obs_turn_count}"
                )

        # compacted
        exp_compacted = expected_ss.get("compacted")
        if exp_compacted is False:
            obs_compacted = session_value.get("compacted")
            if obs_compacted is True:
                mismatches.append(
                    "expected_session_state.compacted: expected=false but observed=true"
                )

    if mismatches:
        return "FINAL_STATE_PRECONDITION_MISMATCH: " + "; ".join(mismatches)
    return None


def evaluate_case(
    csv_row: Dict[str, str],
    packet: Dict[str, Any],
    obs: Dict[str, Any],
    served_source_sha: Optional[str],
    served_deployment_sha: Optional[str],
    expected_source_sha: str,
    expected_deployment_sha: str,
) -> Dict[str, Any]:
    """
    Apply evaluator contract. Returns verdict dict.
    Rules:
    - Never repair product code
    - Never rewrite expected contracts
    - Never infer missing prior state
    - Never hide BLOCKED
    - Volatile Binance numbers are structural evidence only
    - Trading-intent Binance fetch is a boundary failure
    - Missing mandatory observable data cannot silently PASS
    - An unevaluated required canonical contract dimension yields BLOCKED, not PASS
    - SHA mismatch must be reported; caller is responsible for batch-level block
    """
    failure_reasons: List[str] = []
    verdict = "PASS"

    # SHA gate: must match before any PASS
    source_ok = bool(served_source_sha and served_source_sha == expected_source_sha)
    deploy_ok = bool(served_deployment_sha and served_deployment_sha == expected_deployment_sha)

    if not source_ok:
        failure_reasons.append(
            f"SOURCE_SHA_MISMATCH: expected={expected_source_sha} served={served_source_sha}"
        )
        verdict = "FAIL"

    if not deploy_ok:
        failure_reasons.append(
            f"DEPLOYMENT_SHA_MISMATCH: expected={expected_deployment_sha} served={served_deployment_sha}"
        )
        verdict = "FAIL"

    # DOM unavailable → FAIL
    if not obs.get("_dom_available", True):
        failure_reasons.append("DOM_UNAVAILABLE: cosmographerTurn not found")
        verdict = "FAIL"
        return {
            "verdict": verdict,
            "failure_reasons": failure_reasons,
            "failure_class": ["ROUTING"],
        }

    # Trading-intent Binance boundary failure
    if _is_binance_trading_intent(obs):
        failure_reasons.append("TRADING_BOUNDARY: trading-intent Binance fetch detected")
        if verdict == "PASS":
            verdict = "FAIL"

    # Missing mandatory observable data cannot silently PASS
    for field in MANDATORY_CAPTURE_FIELDS:
        if obs.get(field) is None:
            failure_reasons.append(f"MISSING_MANDATORY_FIELD: {field} is null/absent")
            if verdict == "PASS":
                verdict = "FAIL"

    # --- Canonical CSV contract dimensions ---
    # These use actual CSV column names from btc-cosmographer-canonical-140-v0_1.csv.
    # Non-existent columns (EXPECTED_ANSWER_STATE, EXPECTED_ANSWER_MODE, EXPECTED_TIME_SCOPE)
    # are never referenced.

    # EXPECTED_DOMAIN → ROUTE_DOMAIN
    expected_domain = csv_row.get("EXPECTED_DOMAIN", "")
    actual_domain = obs.get("ROUTE_DOMAIN") or ""
    if expected_domain and actual_domain.lower() != expected_domain.lower():
        failure_reasons.append(
            f"ROUTING: domain expected={expected_domain} actual={actual_domain}"
        )
        verdict = "FAIL"

    # EXPECTED_SUBJECT → ROUTE_SUBJECT
    expected_subject = csv_row.get("EXPECTED_SUBJECT", "")
    actual_subject = obs.get("ROUTE_SUBJECT") or ""
    if expected_subject and actual_subject.lower() != expected_subject.lower():
        failure_reasons.append(
            f"SUBJECT_RESOLUTION: subject expected={expected_subject} actual={actual_subject}"
        )
        if verdict == "PASS":
            verdict = "FAIL"

    # EXPECTED_CONTEXT_RELATION → CONTEXT_RELATION
    expected_cr = csv_row.get("EXPECTED_CONTEXT_RELATION", "")
    actual_cr = obs.get("CONTEXT_RELATION") or ""
    if expected_cr and actual_cr.upper() != expected_cr.upper():
        failure_reasons.append(
            f"CONTEXT_MEMORY: context_relation expected={expected_cr} actual={actual_cr}"
        )
        if verdict == "PASS":
            verdict = "FAIL"

    # EXPECTED_MODE: CSV mode taxonomy and runtime ANSWER_MODE taxonomy have no proven
    # deterministic binding. Keyword/token-overlap scoring is explicitly forbidden by the
    # evaluator contract ("never score by keyword overlap alone").
    # → BLOCKED with EVALUATOR_BINDING_UNAVAILABLE; never fabricate PASS or FAIL.
    expected_mode = csv_row.get("EXPECTED_MODE", "")
    if expected_mode:
        failure_reasons.append(
            f"EVALUATOR_BINDING_UNAVAILABLE: EXPECTED_MODE={expected_mode!r} has no proven "
            "deterministic binding to runtime ANSWER_MODE taxonomy; keyword overlap forbidden"
        )
        if verdict == "PASS":
            verdict = "BLOCKED"

    # EXPECTED_ANSWER_TYPE: CSV answer-type taxonomy and runtime ANSWER_STATE taxonomy are
    # different vocabularies. Cross-taxonomy comparison is forbidden. No proven binding exists.
    # → BLOCKED with EVALUATOR_BINDING_UNAVAILABLE; never fabricate PASS or FAIL.
    expected_answer_type = csv_row.get("EXPECTED_ANSWER_TYPE", "")
    if expected_answer_type:
        failure_reasons.append(
            f"EVALUATOR_BINDING_UNAVAILABLE: EXPECTED_ANSWER_TYPE={expected_answer_type!r} has no proven "
            "deterministic binding to runtime ANSWER_STATE taxonomy; cross-taxonomy comparison forbidden"
        )
        if verdict == "PASS":
            verdict = "BLOCKED"

    # EXPECTED_INTENT → INTENTS: deterministic case-insensitive containment check.
    # Both use the same question-facet/intent vocabulary. Non-empty-but-wrong → FAIL.
    expected_intent = csv_row.get("EXPECTED_INTENT", "")
    actual_intents = obs.get("INTENTS") or ""
    if expected_intent:
        if not actual_intents:
            failure_reasons.append(
                f"ROUTING: intents expected={expected_intent!r} but INTENTS is absent"
            )
            if verdict == "PASS":
                verdict = "FAIL"
        elif expected_intent.lower() not in actual_intents.lower():
            failure_reasons.append(
                f"ROUTING: intent expected={expected_intent!r} not found in observed INTENTS={actual_intents!r}"
            )
            if verdict == "PASS":
                verdict = "FAIL"

    # EXPECTED_PERIOD → TIME_SCOPE: deterministic case-insensitive containment check.
    # Non-empty-but-wrong → FAIL.
    expected_period = csv_row.get("EXPECTED_PERIOD", "")
    actual_time_scope = obs.get("TIME_SCOPE") or ""
    if expected_period:
        if not actual_time_scope:
            failure_reasons.append(
                f"TIME_SCOPE: period expected={expected_period!r} but TIME_SCOPE is absent"
            )
            if verdict == "PASS":
                verdict = "FAIL"
        elif expected_period.lower() not in actual_time_scope.lower():
            failure_reasons.append(
                f"TIME_SCOPE: period expected={expected_period!r} not found in observed TIME_SCOPE={actual_time_scope!r}"
            )
            if verdict == "PASS":
                verdict = "FAIL"

    # EXPECTED_EVIDENCE_FAMILY → EVIDENCE_LEVELS: deterministic case-insensitive containment check.
    # Non-empty-but-wrong → FAIL.
    expected_ev_family = csv_row.get("EXPECTED_EVIDENCE_FAMILY", "")
    actual_ev_levels = obs.get("EVIDENCE_LEVELS") or ""
    if expected_ev_family:
        if not actual_ev_levels:
            failure_reasons.append(
                f"EVIDENCE: evidence_family expected={expected_ev_family!r} but EVIDENCE_LEVELS is absent"
            )
            if verdict == "PASS":
                verdict = "FAIL"
        elif expected_ev_family.lower() not in str(actual_ev_levels).lower():
            failure_reasons.append(
                f"EVIDENCE: evidence_family expected={expected_ev_family!r} not found in "
                f"observed EVIDENCE_LEVELS={actual_ev_levels!r}"
            )
            if verdict == "PASS":
                verdict = "FAIL"

    # EXPECTED_BOUNDARY → BOUNDARY_STATE: deterministic case-insensitive containment check.
    # Non-empty-but-wrong → FAIL. NON_TRADING with trading intent → FAIL.
    expected_boundary = csv_row.get("EXPECTED_BOUNDARY", "")
    actual_boundary = obs.get("BOUNDARY_STATE") or ""
    if expected_boundary:
        if not actual_boundary:
            failure_reasons.append(
                f"CAUSAL_BOUNDARY: boundary expected={expected_boundary!r} but BOUNDARY_STATE is absent"
            )
            if verdict == "PASS":
                verdict = "FAIL"
        elif expected_boundary.lower() not in actual_boundary.lower():
            failure_reasons.append(
                f"CAUSAL_BOUNDARY: boundary expected={expected_boundary!r} not found in "
                f"observed BOUNDARY_STATE={actual_boundary!r}"
            )
            if verdict == "PASS":
                verdict = "FAIL"
        # NON_TRADING must not coexist with a detected trading boundary violation
        if "NON_TRADING" in expected_boundary.upper() and _is_binance_trading_intent(obs):
            failure_reasons.append(
                "TRADING_BOUNDARY: expected NON_TRADING but trading boundary detected"
            )
            if verdict == "PASS":
                verdict = "FAIL"

    # FORBIDDEN_BEHAVIOR checks
    forbidden = csv_row.get("FORBIDDEN_BEHAVIOR", "")
    if "BUY_SELL_SIGNAL" in forbidden and _is_binance_trading_intent(obs):
        failure_reasons.append("TRADING_BOUNDARY: BUY_SELL_SIGNAL detected in forbidden")
        if verdict == "PASS":
            verdict = "FAIL"

    # EXPECTED_DIRECTNESS → DIRECT_ANSWER: deterministic directness check.
    # "YES"/"DIRECT"/truthy  → DIRECT_ANSWER must be non-empty (FAIL if absent).
    # "NO"/"INDIRECT"/falsy  → DIRECT_ANSWER must be absent/empty (FAIL if present).
    # Unrecognized token     → no proven binding → BLOCKED.
    expected_directness = csv_row.get("EXPECTED_DIRECTNESS", "")
    direct_answer = obs.get("DIRECT_ANSWER") or ""
    if expected_directness:
        ed_upper = expected_directness.upper()
        if ed_upper in ("YES", "DIRECT", "TRUE", "Y", "1"):
            if not direct_answer:
                failure_reasons.append(
                    f"ANSWER_DIRECTNESS: expected direct answer "
                    f"(EXPECTED_DIRECTNESS={expected_directness!r}) but DIRECT_ANSWER is absent"
                )
                if verdict == "PASS":
                    verdict = "FAIL"
        elif ed_upper in ("NO", "INDIRECT", "NONE", "FALSE", "N", "0", "NOT_DIRECT"):
            if direct_answer:
                failure_reasons.append(
                    f"ANSWER_DIRECTNESS: expected no direct answer "
                    f"(EXPECTED_DIRECTNESS={expected_directness!r}) but DIRECT_ANSWER is present: "
                    f"{direct_answer[:80]!r}"
                )
                if verdict == "PASS":
                    verdict = "FAIL"
        else:
            failure_reasons.append(
                f"EVALUATOR_BINDING_UNAVAILABLE: EXPECTED_DIRECTNESS={expected_directness!r} "
                "is not a recognized directness token; no deterministic binding"
            )
            if verdict == "PASS":
                verdict = "BLOCKED"

    return {
        "verdict": verdict,
        "failure_reasons": failure_reasons,
        "failure_class": _classify_failures(failure_reasons),
    }


def _classify_failures(reasons: List[str]) -> List[str]:
    classes = set()
    for r in reasons:
        for fc in FAILURE_CLASSES:
            if fc in r.upper():
                classes.add(fc)
    if reasons and not classes:
        classes.add("OTHER_EXACTLY_DESCRIBED")
    return sorted(classes)


# ---------------------------------------------------------------------------
# Case execution
# ---------------------------------------------------------------------------

def execute_case(
    csv_row: Dict[str, str],
    packet: Dict[str, Any],
    target_url: str,
    expected_source_sha: str,
    expected_deployment_sha: str,
) -> Dict[str, Any]:
    """
    Execute one case in an isolated browser context.
    Returns a raw observation dict.

    setup_turns_exact entries are plain strings (the exact question text to submit),
    not dicts. Execute them byte-for-byte in declared order.
    """
    case_id = packet["case_id"]
    session_mode = packet.get("session_mode", "CLEAN_SESSION")
    locale = packet.get("locale", "RU")
    question_exact = packet.get("target_question_exact", csv_row.get("QUESTION_TEXT", ""))
    setup_turns = packet.get("setup_turns_exact", []) or []

    # Cardinality check: setup_turn_count must equal len(setup_turns_exact).
    # This check runs before any selenium import so it can be tested without a real driver.
    declared_setup_count = packet.get("setup_turn_count", len(setup_turns))
    if declared_setup_count != len(setup_turns):
        return {
            "schema": "btc_cosmographer_replay_observation_v0_1",
            "case_id": case_id,
            "session_mode": session_mode,
            "question_exact": question_exact,
            "locale": locale,
            "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z",
            "served_source_sha": None,
            "served_deployment_sha": None,
            "observation": {},
            "session_state": {},
            "setup_preconditions_materialized": False,
            "blocked_reason": (
                f"SETUP_CARDINALITY_MISMATCH: setup_turn_count={declared_setup_count} "
                f"len(setup_turns_exact)={len(setup_turns)}"
            ),
            "verdict": "BLOCKED",
            "failure_reasons": [f"SETUP_CARDINALITY_MISMATCH: declared={declared_setup_count} actual={len(setup_turns)}"],
            "failure_class": ["OTHER_EXACTLY_DESCRIBED"],
        }

    result: Dict[str, Any] = {
        "schema": "btc_cosmographer_replay_observation_v0_1",
        "case_id": case_id,
        "session_mode": session_mode,
        "question_exact": question_exact,
        "locale": locale,
        "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z",
        "served_source_sha": None,
        "served_deployment_sha": None,
        "observation": {},
        "session_state": {},
        "setup_preconditions_materialized": True,
        "blocked_reason": None,
    }

    # selenium imports deferred until after early-return checks above
    from selenium.webdriver.common.by import By

    driver = None
    try:
        driver = _make_driver()

        if session_mode == "CLEAN_SESSION":
            # New browser session, clear storage, navigate directly with question
            base_url = f"{target_url.rstrip('/')}/crypto-astro/btc/live"
            driver.get(base_url)
            driver.execute_script("sessionStorage.clear(); localStorage.clear();")
            _submit_question(driver, target_url, question_exact, locale)

        elif session_mode == "NEW_CONVERSATION_CLEAN":
            # Navigate to page, ensure no session carried over
            base_url = f"{target_url.rstrip('/')}/crypto-astro/btc/live"
            driver.get(base_url)
            driver.execute_script("sessionStorage.clear(); localStorage.clear();")
            _submit_question(driver, target_url, question_exact, locale)

        elif session_mode == "EXACT_PRIOR_TURN_SEQUENCE":
            # Execute frozen setup questions (plain strings) through the real dialogue path
            # in exact declared order. Never inject guessed hidden state.
            if not setup_turns:
                # No setup turns: effectively a first-turn question
                _submit_question(driver, target_url, question_exact, locale)
            else:
                # Submit first setup turn (a plain string) via URL navigation
                first_setup_q = setup_turns[0]
                # setup_turns_exact entries are strings; execute byte-for-byte
                _submit_question(driver, target_url, first_setup_q, locale)

                # Wait for first setup answer
                got_answer = _wait_for_answer(driver, timeout=60)
                if not got_answer:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = f"SETUP_TURN_1_NO_RESPONSE: {str(first_setup_q)[:80]}"
                    return {**result, "verdict": "BLOCKED"}

                # Capture state after first setup turn and validate precondition
                obs_1 = _capture_observation(driver)
                session_state_1 = _capture_session_state(driver)
                result["session_state_after_setup_1"] = session_state_1
                # Merge session-derived fields into obs before precondition validation
                for k, v in _extract_session_fields(session_state_1).items():
                    if k in MANDATORY_CAPTURE_FIELDS and obs_1.get(k) is None:
                        obs_1[k] = v

                precondition_failure = _check_precondition_against_packet(
                    packet, obs_1, session_state_1, setup_turn_index=1,
                    submitted_question=first_setup_q,
                )
                if precondition_failure:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = precondition_failure
                    return {**result, "verdict": "BLOCKED"}

                # Submit remaining setup turns (strings) in order before target
                for i, setup_q in enumerate(setup_turns[1:], start=2):
                    # setup_q is a plain string
                    turns_before = len(
                        driver.find_elements(
                            By.CSS_SELECTOR,
                            ".dialogueExchange .cosmographerTurn",
                        )
                    )
                    submitted = _submit_question_in_existing_session(driver, setup_q, locale)
                    if not submitted:
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = f"SETUP_TURN_{i}_SUBMIT_FAILED: {str(setup_q)[:80]}"
                        return {**result, "verdict": "BLOCKED"}

                    # Wait for new turn to appear
                    deadline = time.time() + 60
                    got_new = False
                    while time.time() < deadline:
                        turns_now = len(
                            driver.find_elements(
                                By.CSS_SELECTOR,
                                ".dialogueExchange .cosmographerTurn",
                            )
                        )
                        if turns_now > turns_before:
                            got_new = True
                            break
                        time.sleep(0.5)

                    if not got_new:
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = f"SETUP_TURN_{i}_NO_RESPONSE: {str(setup_q)[:80]}"
                        return {**result, "verdict": "BLOCKED"}

                    # Validate precondition after each setup turn
                    obs_i = _capture_observation(driver)
                    session_state_i = _capture_session_state(driver)
                    # Merge session-derived fields into obs before precondition validation
                    for k, v in _extract_session_fields(session_state_i).items():
                        if k in MANDATORY_CAPTURE_FIELDS and obs_i.get(k) is None:
                            obs_i[k] = v
                    precondition_failure_i = _check_precondition_against_packet(
                        packet, obs_i, session_state_i, setup_turn_index=i,
                        submitted_question=setup_q,
                    )
                    if precondition_failure_i:
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = precondition_failure_i
                        return {**result, "verdict": "BLOCKED"}

                # After all setup turns: validate final expected_context_packet and
                # expected_session_state predicates before target submission.
                # Use last captured obs/session_state (obs_i for multi-turn or obs_1 for single).
                final_obs = obs_i if len(setup_turns) > 1 else obs_1
                final_ss = session_state_i if len(setup_turns) > 1 else session_state_1
                final_state_failure = _validate_final_state_before_target(
                    packet, final_obs, final_ss
                )
                if final_state_failure:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = final_state_failure
                    return {**result, "verdict": "BLOCKED"}

                # Submit target question in-session (exact bytes)
                turns_before_target = len(
                    driver.find_elements(
                        By.CSS_SELECTOR,
                        ".dialogueExchange .cosmographerTurn",
                    )
                )
                submitted = _submit_question_in_existing_session(driver, question_exact, locale)
                if not submitted:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = "TARGET_QUESTION_SUBMIT_FAILED"
                    return {**result, "verdict": "BLOCKED"}

                # Wait for target answer
                deadline = time.time() + 60
                got_target = False
                while time.time() < deadline:
                    turns_now = len(
                        driver.find_elements(
                            By.CSS_SELECTOR,
                            ".dialogueExchange .cosmographerTurn",
                        )
                    )
                    if turns_now > turns_before_target:
                        got_target = True
                        break
                    time.sleep(0.5)

                if not got_target:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = "TARGET_ANSWER_NOT_RECEIVED"
                    return {**result, "verdict": "BLOCKED"}

        # Wait for answer (for CLEAN/NEW_CONVERSATION modes)
        if session_mode in ("CLEAN_SESSION", "NEW_CONVERSATION_CLEAN"):
            got = _wait_for_answer(driver, timeout=60)
            if not got:
                result["blocked_reason"] = "ANSWER_NOT_RECEIVED"
                return {**result, "verdict": "BLOCKED"}

        # Capture identity and response headers from a SINGLE performance log read
        identity = _capture_identity_and_headers(driver)
        result["served_source_sha"] = identity["source_sha"]
        result["served_deployment_sha"] = identity["deployment_sha"]
        result["response_headers"] = identity["response_headers"]

        # Capture observations
        obs = _capture_observation(driver)

        # Capture __NEXT_DATA__ for FRESHNESS and sourceContext
        next_data = _capture_next_data(driver)

        # Capture session state and merge session-derived fields into observation
        session_state = _capture_session_state(driver)
        result["session_state"] = session_state
        session_fields = _extract_session_fields(session_state, next_data)
        for key, val in session_fields.items():
            if key in MANDATORY_CAPTURE_FIELDS and obs.get(key) is None:
                obs[key] = val
            elif key not in MANDATORY_CAPTURE_FIELDS:
                obs[key] = val

        result["observation"] = obs

        # Evaluate verdict
        eval_result = evaluate_case(
            csv_row=csv_row,
            packet=packet,
            obs=obs,
            served_source_sha=result["served_source_sha"],
            served_deployment_sha=result["served_deployment_sha"],
            expected_source_sha=expected_source_sha,
            expected_deployment_sha=expected_deployment_sha,
        )
        result.update(eval_result)

    except Exception as exc:
        result["execution_error"] = str(exc)
        result["verdict"] = "BLOCKED"
        result["blocked_reason"] = f"EXECUTION_ERROR: {exc}"
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass

    return result


# ---------------------------------------------------------------------------
# Run manifest and output helpers
# ---------------------------------------------------------------------------

def build_manifest(
    args: argparse.Namespace,
    corpus_sha: str,
    packets_sha: str,
    results: List[Dict[str, Any]],
    start_ts: str,
    end_ts: str,
    served_source_sha: Optional[str] = None,
    served_deployment_sha: Optional[str] = None,
) -> Dict[str, Any]:
    pass_count = sum(1 for r in results if r.get("verdict") == "PASS")
    fail_count = sum(1 for r in results if r.get("verdict") == "FAIL")
    blocked_count = sum(1 for r in results if r.get("verdict") == "BLOCKED")
    total = pass_count + fail_count + blocked_count

    return {
        "schema": "btc_cosmographer_replay_manifest_v0_1",
        "target_url": args.target_url,
        "expected_source_sha": args.expected_source_sha,
        "expected_deployment_sha": args.expected_deployment_sha,
        "served_source_sha": served_source_sha,
        "served_deployment_sha": served_deployment_sha,
        "corpus_sha256": corpus_sha,
        "state_packets_sha256": packets_sha,
        "start_utc": start_ts,
        "end_utc": end_ts,
        "total": total,
        "pass": pass_count,
        "fail": fail_count,
        "blocked": blocked_count,
        "pass_plus_fail_plus_blocked_eq_140": total == TOTAL_CASES,
        "case_id_set": sorted(r["case_id"] for r in results),
    }


def write_outputs(
    output_dir: Path,
    raw_observations: List[Dict[str, Any]],
    evaluator_inputs: List[Dict[str, Any]],
    non_pass_ledger: List[Dict[str, Any]],
    summary: Dict[str, Any],
    manifest: Dict[str, Any],
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    def write_jsonl(path: Path, records: List[Dict]) -> None:
        with open(path, "w", encoding="utf-8") as f:
            for rec in records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    write_jsonl(output_dir / "raw-observations.jsonl", raw_observations)
    write_jsonl(output_dir / "evaluator-input.jsonl", evaluator_inputs)
    write_jsonl(output_dir / "non-pass-ledger.jsonl", non_pass_ledger)

    with open(output_dir / "aggregate-summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    with open(output_dir / "run-manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="BTC Cosmographer Canonical 140 Replay Harness (test-infrastructure only)"
    )
    parser.add_argument("--target-url", required=True, help="Target deployment URL (runtime, never frozen)")
    parser.add_argument(
        "--expected-source-sha", required=True, help="Expected served source SHA (runtime, never frozen)"
    )
    parser.add_argument(
        "--expected-deployment-sha", required=True, help="Expected served deployment SHA (runtime, never frozen)"
    )
    parser.add_argument("--output-dir", default="./replay-out", help="Directory for output files")
    parser.add_argument("--concurrency", type=int, default=1, help="Concurrency (default=1)")
    parser.add_argument(
        "--case-ids",
        default="",
        help="Comma-separated subset of case IDs to run (empty = all 140)",
    )
    parser.add_argument(
        "--corpus-path",
        default=str(CORPUS_PATH),
        help="Path to canonical CSV fixture",
    )
    parser.add_argument(
        "--packets-path",
        default=str(PACKETS_PATH),
        help="Path to state packets JSON fixture",
    )
    args = parser.parse_args()

    print("BTC_COSMOGRAPHER_CANONICAL_REPLAY_HARNESS: initializing")
    print(f"  target_url={args.target_url}")
    print(f"  expected_source_sha={args.expected_source_sha}")
    print(f"  expected_deployment_sha={args.expected_deployment_sha}")

    corpus_path = Path(args.corpus_path)
    packets_path = Path(args.packets_path)

    # Validate fixtures (hard exit on any violation)
    csv_rows, packets, packets_index = validate_fixtures(corpus_path, packets_path)
    print(f"FIXTURE_VALIDATION: PASS (corpus={CORPUS_AUTHORITY_SHA256[:12]}... packets={STATE_PACKETS_AUTHORITY_SHA256[:12]}...)")

    # Build CSV row index
    csv_index: Dict[str, Dict] = {r["CASE_ID"]: r for r in csv_rows}

    # Filter to requested case IDs
    if args.case_ids.strip():
        requested = [c.strip() for c in args.case_ids.split(",") if c.strip()]
        unknown = set(requested) - set(csv_index.keys())
        if unknown:
            print(f"ERROR: unknown case_ids={sorted(unknown)}", file=sys.stderr)
            sys.exit(1)
        run_ids = requested
    else:
        run_ids = [r["CASE_ID"] for r in csv_rows]

    print(f"CASES_TO_RUN: {len(run_ids)}")

    if args.concurrency != 1:
        print(f"WARNING: concurrency={args.concurrency} requested; using concurrency=1 (default safe mode)")

    # Batch identity preflight: verify served SHAs before evaluating any case
    # Use _make_driver() to ensure performance logging is enabled (required for source SHA header)
    print("BATCH_IDENTITY_PREFLIGHT: verifying served source/deployment SHAs...")
    preflight_driver = None
    preflight_served_source = None
    preflight_served_deploy = None
    try:
        preflight_driver = _make_driver()
        batch_block, preflight_served_source, preflight_served_deploy = _batch_identity_preflight(
            preflight_driver,
            args.target_url,
            args.expected_source_sha,
            args.expected_deployment_sha,
        )
    except Exception as preflight_exc:
        batch_block = f"BATCH_IDENTITY_BLOCKED: preflight_driver_error={preflight_exc}"
    finally:
        if preflight_driver is not None:
            try:
                preflight_driver.quit()
            except Exception:
                pass

    if batch_block:
        print(f"BATCH_BLOCKED: {batch_block}", file=sys.stderr)
        # Emit BLOCKED results for all planned cases; no target question submitted
        blocked_results: List[Dict[str, Any]] = [
            {
                "schema": "btc_cosmographer_replay_observation_v0_1",
                "case_id": cid,
                "session_mode": packets_index[cid].get("session_mode", "CLEAN_SESSION"),
                "question_exact": packets_index[cid].get("target_question_exact", ""),
                "locale": packets_index[cid].get("locale", ""),
                "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z",
                "verdict": "BLOCKED",
                "blocked_reason": batch_block,
                "failure_reasons": [batch_block],
                "failure_class": ["OTHER_EXACTLY_DESCRIBED"],
                "setup_preconditions_materialized": False,
            }
            for cid in run_ids
        ]
        start_ts = end_ts = datetime.datetime.utcnow().isoformat() + "Z"
        corpus_sha = sha256_file(corpus_path)
        packets_sha = sha256_file(packets_path)
        summary = {
            "schema": "btc_cosmographer_replay_summary_v0_1",
            "total": len(blocked_results),
            "pass": 0,
            "fail": 0,
            "blocked": len(blocked_results),
            "pass_plus_fail_plus_blocked_eq_total": True,
            "batch_block_reason": batch_block,
            "start_utc": start_ts,
            "end_utc": end_ts,
        }
        manifest = build_manifest(
            args=args,
            corpus_sha=corpus_sha,
            packets_sha=packets_sha,
            results=blocked_results,
            start_ts=start_ts,
            end_ts=end_ts,
            served_source_sha=preflight_served_source,
            served_deployment_sha=preflight_served_deploy,
        )
        output_dir = Path(args.output_dir)
        write_outputs(
            output_dir=output_dir,
            raw_observations=blocked_results,
            evaluator_inputs=blocked_results,
            non_pass_ledger=blocked_results,
            summary=summary,
            manifest=manifest,
        )
        print(f"OUTPUT_DIR: {output_dir}")
        print(f"BATCH_BLOCKED: PASS=0 FAIL=0 BLOCKED={len(blocked_results)}")
        sys.exit(1)

    print("BATCH_IDENTITY_PREFLIGHT: PASS")

    start_ts = datetime.datetime.utcnow().isoformat() + "Z"
    results: List[Dict[str, Any]] = []

    for case_id in run_ids:
        csv_row = csv_index[case_id]
        packet = packets_index[case_id]
        print(f"  RUNNING: {case_id} mode={packet.get('session_mode')}")

        result = execute_case(
            csv_row=csv_row,
            packet=packet,
            target_url=args.target_url,
            expected_source_sha=args.expected_source_sha,
            expected_deployment_sha=args.expected_deployment_sha,
        )
        # First observed result is authoritative; no erase/replace allowed
        results.append(result)
        print(f"  VERDICT: {case_id} => {result.get('verdict')}")

    end_ts = datetime.datetime.utcnow().isoformat() + "Z"

    # Compute totals
    pass_count = sum(1 for r in results if r.get("verdict") == "PASS")
    fail_count = sum(1 for r in results if r.get("verdict") == "FAIL")
    blocked_count = sum(1 for r in results if r.get("verdict") == "BLOCKED")
    total = pass_count + fail_count + blocked_count

    print(f"\nAGGREGATE: PASS={pass_count} FAIL={fail_count} BLOCKED={blocked_count} TOTAL={total}")

    if len(run_ids) == TOTAL_CASES and total != TOTAL_CASES:
        print(f"INVARIANT_VIOLATION: PASS+FAIL+BLOCKED={total} != {TOTAL_CASES}", file=sys.stderr)
        sys.exit(1)

    # Build outputs
    evaluator_inputs = [
        {
            "schema": "btc_cosmographer_evaluator_input_v0_1",
            "case_id": r["case_id"],
            "question_exact": r.get("question_exact"),
            "locale": r.get("locale"),
            # Full executable state packet: immutable authority from fixture
            "executable_state_packet": packets_index.get(r["case_id"]),
            # Immutable expected contract: from packet source_authority.expected_contract
            "expected_contract": (
                (packets_index.get(r["case_id"]) or {})
                .get("source_authority", {})
                .get("expected_contract")
                or csv_index.get(r["case_id"])
            ),
            # Current runtime authority: served identity + schema
            "current_runtime_authority": {
                "served_source_sha": r.get("served_source_sha"),
                "served_deployment_sha": r.get("served_deployment_sha"),
                "expected_source_sha": args.expected_source_sha,
                "expected_deployment_sha": args.expected_deployment_sha,
                "runtime_schema": (r.get("observation") or {}).get("_runtime_schema"),
                "session_schema": (r.get("observation") or {}).get("_session_schema"),
            },
            # Full captured observation
            "observation": r.get("observation", {}),
            "verdict": r.get("verdict"),
            "failure_reasons": r.get("failure_reasons", []),
            "failure_class": r.get("failure_class", []),
        }
        for r in results
    ]

    non_pass_ledger = [r for r in results if r.get("verdict") != "PASS"]

    corpus_sha = sha256_file(corpus_path)
    packets_sha = sha256_file(packets_path)

    summary = {
        "schema": "btc_cosmographer_replay_summary_v0_1",
        "total": total,
        "pass": pass_count,
        "fail": fail_count,
        "blocked": blocked_count,
        "pass_plus_fail_plus_blocked_eq_total": total == len(run_ids),
        "start_utc": start_ts,
        "end_utc": end_ts,
    }

    manifest = build_manifest(
        args=args,
        corpus_sha=corpus_sha,
        packets_sha=packets_sha,
        results=results,
        start_ts=start_ts,
        end_ts=end_ts,
        served_source_sha=preflight_served_source,
        served_deployment_sha=preflight_served_deploy,
    )

    output_dir = Path(args.output_dir)
    write_outputs(
        output_dir=output_dir,
        raw_observations=results,
        evaluator_inputs=evaluator_inputs,
        non_pass_ledger=non_pass_ledger,
        summary=summary,
        manifest=manifest,
    )

    print(f"OUTPUT_DIR: {output_dir}")
    print("BTC_COSMOGRAPHER_CANONICAL_REPLAY_HARNESS: complete")


if __name__ == "__main__":
    main()
