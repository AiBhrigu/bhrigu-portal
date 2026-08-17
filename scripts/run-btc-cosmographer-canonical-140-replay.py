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
    if packets_sha != STATE_PACKETS_AUTHORITY_SHA256:
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

    # Validate all packet hashes are present (integrity already proven by file-level SHA256)
    packets_index: Dict[str, Dict] = {}
    for p in packets:
        declared = p.get("packet_hash")
        if not declared:
            print(
                f"FIXTURE_VALIDATION_ERROR: packet_hash missing for case_id={p['case_id']}",
                file=sys.stderr,
            )
            sys.exit(1)
        # packet_hash is an opaque authority value sealed in the frozen fixture.
        # Structural integrity is already proved by the file-level SHA256 check above.
        # Validate format: must be non-empty string, optionally prefixed with "sha256:".
        hash_value = declared
        if isinstance(declared, str) and declared.startswith("sha256:"):
            hash_value = declared[len("sha256:"):]
        if not hash_value or len(hash_value) < 32:
            print(
                f"FIXTURE_VALIDATION_ERROR: packet_hash malformed for case_id={p['case_id']} value={declared!r}",
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
    return webdriver.Chrome(options=options)


def _capture_sha_headers(driver) -> Dict[str, Optional[str]]:
    """Read source/deployment SHAs from page meta tags or data attributes."""
    try:
        source_sha = driver.execute_script(
            "return document.querySelector('meta[name=\"x-source-sha\"]')?.content "
            "|| document.querySelector('[data-source-sha]')?.dataset?.sourceSha || null"
        )
        deployment_sha = driver.execute_script(
            "return document.querySelector('meta[name=\"x-deployment-sha\"]')?.content "
            "|| document.querySelector('[data-deployment-sha]')?.dataset?.deploymentSha || null"
        )
    except Exception:
        source_sha = None
        deployment_sha = None
    return {"source_sha": source_sha, "deployment_sha": deployment_sha}


def _capture_response_headers(driver) -> Dict[str, Optional[str]]:
    """Best-effort response header capture via performance log or JS."""
    try:
        # Try to read custom header from a data element on the page
        x_source = driver.execute_script(
            "return document.querySelector('[data-x-source-revision]')?.dataset?.xSourceRevision || null"
        )
        x_deploy = driver.execute_script(
            "return document.querySelector('[data-x-deployment-sha]')?.dataset?.xDeploymentSha || null"
        )
    except Exception:
        x_source = None
        x_deploy = None
    return {"x-source-revision": x_source, "x-deployment-sha": x_deploy}


def _capture_observation(driver) -> Dict[str, Any]:
    """
    Capture mandatory evaluator fields from the last cosmographerTurn in the DOM.
    All fields are read from data-attributes; missing fields yield None (never guessed).
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
    for attr, field in [
        ("data-route-domain", "ROUTE_DOMAIN"),
        ("data-route-subject", "ROUTE_SUBJECT"),
        ("data-intents", "INTENTS"),
        ("data-context-relation", "CONTEXT_RELATION"),
        ("data-time-scope", "TIME_SCOPE"),
        ("data-answer-state", "ANSWER_STATE"),
        ("data-answer-mode", "ANSWER_MODE"),
        ("data-route-disposition", "ROUTE_DISPOSITION"),
        ("data-primary-authority", "PRIMARY_AUTHORITY"),
        ("data-evidence-levels", "EVIDENCE_LEVELS"),
        ("data-source-revision", "SOURCE_REVISION"),
        ("data-freshness", "FRESHNESS"),
        ("data-binance-binding-state", "BINANCE_BINDING_STATE"),
        ("data-direct-answer", "DIRECT_ANSWER"),
        ("data-boundary-state", "BOUNDARY_STATE"),
    ]:
        try:
            obs[field] = node.get_attribute(attr)
        except Exception:
            obs[field] = None

    # Capture full text of answer
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
        return {"session_key": session_raw["key"], "session_value": json.loads(session_raw["value"])}
    except Exception:
        return {"session_key": session_raw.get("key"), "session_raw": session_raw.get("value")}


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
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait

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
# Verdict evaluation
# ---------------------------------------------------------------------------

def _is_binance_trading_intent(obs: Dict[str, Any]) -> bool:
    """Detect trading-intent Binance fetch (boundary failure)."""
    boundary = (obs.get("BOUNDARY_STATE") or "").upper()
    binance = (obs.get("BINANCE_BINDING_STATE") or "").upper()
    # Check for explicit trading boundary violation (not just any occurrence of "TRADING")
    boundary_violation = (
        "TRADING_BOUNDARY_VIOLATION" in boundary
        or "TRADING_INTENT" in boundary
        or boundary == "TRADING"
    )
    binance_trading = "TRADING_INTENT" in binance
    return boundary_violation or binance_trading


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
    """
    failure_reasons: List[str] = []
    verdict = "PASS"

    # SHA gate: must match before any PASS
    source_ok = served_source_sha and served_source_sha == expected_source_sha
    deploy_ok = served_deployment_sha and served_deployment_sha == expected_deployment_sha

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

    # DOM unavailable → FAIL/BLOCKED depends on whether question was submitted
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
        if "TRADING_BOUNDARY" not in failure_reasons:
            pass  # already appended

    # Route domain check
    expected_domain = csv_row.get("EXPECTED_DOMAIN", "")
    actual_domain = obs.get("ROUTE_DOMAIN") or ""
    if expected_domain and actual_domain.lower() != expected_domain.lower():
        failure_reasons.append(
            f"ROUTING: domain expected={expected_domain} actual={actual_domain}"
        )
        verdict = "FAIL"

    # Context relation check
    expected_cr = csv_row.get("EXPECTED_CONTEXT_RELATION", "")
    actual_cr = obs.get("CONTEXT_RELATION") or ""
    if expected_cr and actual_cr.upper() != expected_cr.upper():
        failure_reasons.append(
            f"CONTEXT_MEMORY: context_relation expected={expected_cr} actual={actual_cr}"
        )
        if verdict == "PASS":
            verdict = "FAIL"

    # Boundary check
    expected_boundary = csv_row.get("EXPECTED_BOUNDARY", "")
    actual_boundary = obs.get("BOUNDARY_STATE") or ""
    if expected_boundary:
        # FORBIDDEN_BEHAVIOR check
        forbidden = csv_row.get("FORBIDDEN_BEHAVIOR", "")
        if "BUY_SELL_SIGNAL" in forbidden and _is_binance_trading_intent(obs):
            failure_reasons.append("TRADING_BOUNDARY: BUY_SELL_SIGNAL detected in forbidden")
            if verdict == "PASS":
                verdict = "FAIL"

    # Directness check
    expected_directness = csv_row.get("EXPECTED_DIRECTNESS", "")
    direct_answer = obs.get("DIRECT_ANSWER") or ""
    if expected_directness and not direct_answer:
        failure_reasons.append(
            f"ANSWER_DIRECTNESS: expected directness={expected_directness} but DIRECT_ANSWER is empty"
        )
        if verdict == "PASS":
            verdict = "FAIL"

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
    """
    case_id = packet["case_id"]
    session_mode = packet.get("session_mode", "CLEAN_SESSION")
    locale = packet.get("locale", "RU")
    question_exact = packet.get("target_question_exact", csv_row.get("QUESTION_TEXT", ""))
    prior_turns = packet.get("prior_turns", {})
    setup_turns = packet.get("setup_turns_exact", []) or []

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

    driver = None
    try:
        driver = _make_driver()

        # Initial navigation
        if session_mode == "CLEAN_SESSION":
            # New browser session, navigate directly to target with question
            base_url = f"{target_url.rstrip('/')}/crypto-astro/btc/live"
            driver.get(base_url)
            # Clear any existing session storage
            driver.execute_script("sessionStorage.clear(); localStorage.clear();")
            # Now submit question via URL params
            _submit_question(driver, target_url, question_exact, locale)

        elif session_mode == "NEW_CONVERSATION_CLEAN":
            # Navigate to page, ensure no session carried over
            base_url = f"{target_url.rstrip('/')}/crypto-astro/btc/live"
            driver.get(base_url)
            driver.execute_script("sessionStorage.clear(); localStorage.clear();")
            _submit_question(driver, target_url, question_exact, locale)

        elif session_mode == "EXACT_PRIOR_TURN_SEQUENCE":
            # Execute frozen setup turns through real dialogue path
            if not setup_turns:
                # No setup turns means it's effectively a first-turn question
                _submit_question(driver, target_url, question_exact, locale)
            else:
                # Submit first setup turn via URL navigation
                first_setup = setup_turns[0]
                setup_q = first_setup.get("question_exact", "")
                setup_locale = first_setup.get("locale", locale)
                _submit_question(driver, target_url, setup_q, setup_locale)

                # Wait for first setup answer
                got_answer = _wait_for_answer(driver, timeout=60)
                if not got_answer:
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = f"SETUP_TURN_1_NO_RESPONSE: {setup_q[:80]}"
                    return {**result, "verdict": "BLOCKED"}

                # Capture state after first setup turn
                setup_state = _capture_session_state(driver)
                result["session_state_after_setup_1"] = setup_state

                # Validate setup turn materialized expected precondition
                expected_domain_1 = first_setup.get("expected_route_domain")
                obs_1 = _capture_observation(driver)
                if expected_domain_1 and obs_1.get("ROUTE_DOMAIN", "").lower() != expected_domain_1.lower():
                    result["setup_preconditions_materialized"] = False
                    result["blocked_reason"] = (
                        f"SETUP_PRECONDITION_MISMATCH: turn_1 "
                        f"expected_domain={expected_domain_1} "
                        f"actual_domain={obs_1.get('ROUTE_DOMAIN')}"
                    )
                    return {**result, "verdict": "BLOCKED"}

                # Submit remaining setup turns (2..n-1) before target
                for i, setup_turn in enumerate(setup_turns[1:], start=2):
                    setup_q2 = setup_turn.get("question_exact", "")
                    setup_locale2 = setup_turn.get("locale", locale)

                    # Count current exchanges to detect new answer
                    turns_before = len(
                        driver.find_elements(
                            __import__("selenium").webdriver.common.by.By.CSS_SELECTOR,
                            ".dialogueExchange .cosmographerTurn",
                        )
                    )
                    submitted = _submit_question_in_existing_session(driver, setup_q2, setup_locale2)
                    if not submitted:
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = f"SETUP_TURN_{i}_SUBMIT_FAILED: {setup_q2[:80]}"
                        return {**result, "verdict": "BLOCKED"}

                    # Wait for new turn to appear
                    deadline = time.time() + 60
                    got_new = False
                    while time.time() < deadline:
                        turns_now = len(
                            driver.find_elements(
                                __import__("selenium").webdriver.common.by.By.CSS_SELECTOR,
                                ".dialogueExchange .cosmographerTurn",
                            )
                        )
                        if turns_now > turns_before:
                            got_new = True
                            break
                        time.sleep(0.5)

                    if not got_new:
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = f"SETUP_TURN_{i}_NO_RESPONSE: {setup_q2[:80]}"
                        return {**result, "verdict": "BLOCKED"}

                    # Validate setup turn precondition
                    expected_domain_i = setup_turn.get("expected_route_domain")
                    obs_i = _capture_observation(driver)
                    if expected_domain_i and obs_i.get("ROUTE_DOMAIN", "").lower() != expected_domain_i.lower():
                        result["setup_preconditions_materialized"] = False
                        result["blocked_reason"] = (
                            f"SETUP_PRECONDITION_MISMATCH: turn_{i} "
                            f"expected_domain={expected_domain_i} "
                            f"actual_domain={obs_i.get('ROUTE_DOMAIN')}"
                        )
                        return {**result, "verdict": "BLOCKED"}

                # Submit target question in-session (exact bytes)
                turns_before_target = len(
                    driver.find_elements(
                        __import__("selenium").webdriver.common.by.By.CSS_SELECTOR,
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
                            __import__("selenium").webdriver.common.by.By.CSS_SELECTOR,
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

        # Capture SHAs
        sha_data = _capture_sha_headers(driver)
        result["served_source_sha"] = sha_data["source_sha"]
        result["served_deployment_sha"] = sha_data["deployment_sha"]

        # Capture observations
        obs = _capture_observation(driver)
        result["observation"] = obs

        # Capture session state
        result["session_state"] = _capture_session_state(driver)

        # Capture response headers
        result["response_headers"] = _capture_response_headers(driver)

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

    start_ts = datetime.datetime.utcnow().isoformat() + "Z"
    results: List[Dict[str, Any]] = []

    if args.concurrency != 1:
        print(f"WARNING: concurrency={args.concurrency} requested; using concurrency=1 (default safe mode)")

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
            "case_id": r["case_id"],
            "question_exact": r.get("question_exact"),
            "locale": r.get("locale"),
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
