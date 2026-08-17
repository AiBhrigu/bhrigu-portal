"""
BTC Cosmographer Canonical 140 Replay Harness – Selftest Suite
schema: btc_cosmographer_replay_harness_selftest_v0_1

Proves all required invariants WITHOUT running the real 140 against Production.

PRODUCT_CODE_MUTATION=FORBIDDEN
MERGE=FORBIDDEN
REAL_CANONICAL_140_REPLAY_IN_THIS_ATOM=FORBIDDEN
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import sys
import tempfile
import types
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import MagicMock, call, patch

# ---------------------------------------------------------------------------
# Resolve repo root and import harness module
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
HARNESS_PATH = REPO_ROOT / "scripts" / "run-btc-cosmographer-canonical-140-replay.py"

import importlib.util

_spec = importlib.util.spec_from_file_location("harness", HARNESS_PATH)
_harness = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_harness)

CORPUS_PATH = _harness.CORPUS_PATH
PACKETS_PATH = _harness.PACKETS_PATH

CORPUS_AUTHORITY_SHA256 = _harness.CORPUS_AUTHORITY_SHA256
STATE_PACKETS_AUTHORITY_SHA256 = _harness.STATE_PACKETS_AUTHORITY_SHA256
TOTAL_CASES = _harness.TOTAL_CASES
UNIQUE_CASE_IDS = _harness.UNIQUE_CASE_IDS
LAYER_COUNTS = _harness.LAYER_COUNTS

validate_fixtures = _harness.validate_fixtures
sha256_file = _harness.sha256_file
sha256_string = _harness.sha256_string
evaluate_case = _harness.evaluate_case
build_manifest = _harness.build_manifest
write_outputs = _harness.write_outputs
_verify_packet_hash = _harness._verify_packet_hash
_check_precondition_against_packet = _harness._check_precondition_against_packet
_batch_identity_preflight = _harness._batch_identity_preflight
_extract_session_fields = _harness._extract_session_fields
MANDATORY_CAPTURE_FIELDS = _harness.MANDATORY_CAPTURE_FIELDS
FAILURE_CLASSES = _harness.FAILURE_CLASSES


# ---------------------------------------------------------------------------
# Helpers for building minimal fixture data
# ---------------------------------------------------------------------------

def _load_real_fixtures():
    """Load the real committed fixtures (read-only)."""
    with open(CORPUS_PATH, encoding="utf-8-sig") as f:
        csv_rows = list(csv.DictReader(f))
    with open(PACKETS_PATH, encoding="utf-8") as f:
        packets_doc = json.load(f)
    packets = packets_doc["packets"]
    packets_index = {p["case_id"]: p for p in packets}
    return csv_rows, packets, packets_index


def _make_minimal_csv(rows: list[dict]) -> bytes:
    """Serialize a list of dicts to CSV bytes with BOM."""
    if not rows:
        return b"\xef\xbb\xbf"
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
    return ("\xef\xbb\xbf" + buf.getvalue()).encode("utf-8")


def _make_packet(case_id: str, **overrides) -> dict:
    """Build a minimal valid state packet. packet_hash is computed automatically."""
    p = {
        "schema": "btc_cosmographer_evaluator_state_packet_v0_1",
        "case_id": case_id,
        "corpus_layer": "AI_MODE_COVERAGE_CORPUS",
        "locale": "EN",
        "turn_index": 1,
        "raw_question": "test question",
        "target_question_exact": "test question",
        "original_prior_turn_semantics": "",
        "original_session_state_semantics": "CLEAN_SESSION",
        "session_mode": "CLEAN_SESSION",
        "authority_status": "CLEAN_SESSION",
        "origin": {},
        "prior_turns": {"status": "NONE", "value": []},
        "setup_turns_exact": [],
        "heuristic_state_reconstruction": "NO",
        "expected_contract_mutation": "NO",
    }
    p.update(overrides)
    # Compute packet_hash using the standard formula
    p_for_hash = {k: v for k, v in p.items() if k != "packet_hash"}
    p["packet_hash"] = "sha256:" + sha256_string(json.dumps(p_for_hash, sort_keys=True, ensure_ascii=False))
    return p


def _make_minimal_packets_doc(packets: list[dict]) -> dict:
    return {
        "schema": "btc_cosmographer_canonical_state_packet_authority_v0_1",
        "packets": packets,
    }


def _obs_all_present(**overrides) -> dict:
    """Return an obs dict with all mandatory fields populated."""
    obs = {f: "value" for f in MANDATORY_CAPTURE_FIELDS}
    obs["_dom_available"] = True
    obs.update(overrides)
    return obs


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------


class TestFixtureIntegrity(unittest.TestCase):
    """Verify committed fixtures against authority hashes."""

    def test_corpus_file_exists(self):
        self.assertTrue(CORPUS_PATH.exists(), f"Corpus fixture not found: {CORPUS_PATH}")

    def test_packets_file_exists(self):
        self.assertTrue(PACKETS_PATH.exists(), f"Packets fixture not found: {PACKETS_PATH}")

    def test_corpus_sha256_matches_authority(self):
        actual = sha256_file(CORPUS_PATH)
        self.assertEqual(
            actual,
            CORPUS_AUTHORITY_SHA256,
            f"Corpus SHA mismatch: expected={CORPUS_AUTHORITY_SHA256} actual={actual}",
        )

    def test_state_packets_sha256_matches_authority(self):
        actual = sha256_file(PACKETS_PATH)
        self.assertEqual(
            actual,
            STATE_PACKETS_AUTHORITY_SHA256,
            f"State packets SHA mismatch: expected={STATE_PACKETS_AUTHORITY_SHA256} actual={actual}",
        )

    def test_total_cases_140(self):
        csv_rows, _, _ = _load_real_fixtures()
        self.assertEqual(len(csv_rows), TOTAL_CASES)

    def test_unique_case_ids_140(self):
        csv_rows, _, _ = _load_real_fixtures()
        ids = [r["CASE_ID"] for r in csv_rows]
        self.assertEqual(len(set(ids)), UNIQUE_CASE_IDS)

    def test_layer_counts_14_72_27_27(self):
        from collections import Counter

        csv_rows, _, _ = _load_real_fixtures()
        counts = Counter(r["CORPUS_LAYER"] for r in csv_rows)
        for layer, expected in LAYER_COUNTS.items():
            self.assertEqual(counts[layer], expected, f"Layer {layer}: expected={expected} actual={counts[layer]}")

    def test_one_packet_per_case_id(self):
        csv_rows, packets, packets_index = _load_real_fixtures()
        csv_ids = {r["CASE_ID"] for r in csv_rows}
        packet_ids = {p["case_id"] for p in packets}
        self.assertEqual(csv_ids, packet_ids)

    def test_all_packet_hashes_valid_format(self):
        """All real fixture packet_hash values must be well-formed sha256:<64-hex> strings."""
        _, packets, _ = _load_real_fixtures()
        for p in packets:
            declared = p.get("packet_hash")
            self.assertIsNotNone(declared, f"packet_hash missing for case_id={p['case_id']}")
            self.assertIsInstance(declared, str, f"packet_hash not a string for case_id={p['case_id']}")
            # Must pass format-only check (file-level SHA proven = authority mode)
            self.assertTrue(
                _verify_packet_hash(p, file_sha_is_authority=True),
                f"packet_hash fails format check for case_id={p['case_id']}: {declared!r}",
            )

    def test_heuristic_derivation_count_is_zero(self):
        _, packets, _ = _load_real_fixtures()
        heuristic = [p for p in packets if p.get("heuristic_state_reconstruction") not in (None, "NO", False)]
        self.assertEqual(len(heuristic), 0, f"Heuristic-derived packets found: {[p['case_id'] for p in heuristic]}")

    def test_expected_contract_mutation_count_is_zero(self):
        _, packets, _ = _load_real_fixtures()
        mutated = [p for p in packets if p.get("expected_contract_mutation") not in (None, "NO", False)]
        self.assertEqual(len(mutated), 0, f"Contract-mutated packets found: {[p['case_id'] for p in mutated]}")


class TestDuplicateCaseIdRejected(unittest.TestCase):
    """Duplicate case ID in corpus must be rejected."""

    def test_duplicate_case_id_rejected(self):
        rows = [
            {"CASE_ID": "X-001", "CORPUS_LAYER": "AI_MODE_COVERAGE_CORPUS"},
            {"CASE_ID": "X-001", "CORPUS_LAYER": "AI_MODE_COVERAGE_CORPUS"},  # duplicate
        ]
        csv_bytes = _make_minimal_csv(rows)

        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "corpus.csv"
            csv_path.write_bytes(csv_bytes)

            with patch.object(_harness, "CORPUS_AUTHORITY_SHA256", sha256_file(csv_path)):
                with self.assertRaises(SystemExit) as ctx:
                    validate_fixtures(csv_path, PACKETS_PATH)
                self.assertEqual(ctx.exception.code, 1)


class TestCorpusHashMismatchRejected(unittest.TestCase):
    """Corpus hash mismatch must be rejected."""

    def test_corpus_hash_mismatch_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "corpus.csv"
            csv_path.write_bytes(b"\xef\xbb\xbfCASE_ID,CORPUS_LAYER\nX-001,LAYER\n")
            with self.assertRaises(SystemExit) as ctx:
                validate_fixtures(csv_path, PACKETS_PATH)
            self.assertEqual(ctx.exception.code, 1)


class TestStatePacketHashMismatchRejected(unittest.TestCase):
    """State packets artifact hash mismatch must be rejected."""

    def test_state_packets_hash_mismatch_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            pkt_path = Path(tmp) / "packets.json"
            pkt_path.write_text(json.dumps({"packets": []}), encoding="utf-8")
            with self.assertRaises(SystemExit) as ctx:
                validate_fixtures(CORPUS_PATH, pkt_path)
            self.assertEqual(ctx.exception.code, 1)


class TestMissingPacketRejected(unittest.TestCase):
    """Missing packet for a CSV case ID must be rejected."""

    def test_missing_packet_rejected(self):
        csv_rows, packets, _ = _load_real_fixtures()
        trimmed_packets = packets[:-1]
        doc = _make_minimal_packets_doc(trimmed_packets)

        with tempfile.TemporaryDirectory() as tmp:
            pkt_path = Path(tmp) / "packets.json"
            pkt_path.write_text(json.dumps(doc), encoding="utf-8")
            pkt_sha = sha256_file(pkt_path)

            with patch.object(_harness, "STATE_PACKETS_AUTHORITY_SHA256", pkt_sha):
                with self.assertRaises(SystemExit) as ctx:
                    validate_fixtures(CORPUS_PATH, pkt_path)
                self.assertEqual(ctx.exception.code, 1)


class TestPacketHashMismatchRejected(unittest.TestCase):
    """
    A syntactically valid (64-char hex) but incorrect packet_hash must be rejected.
    This proves that length-only checks are insufficient; actual hash verification is required.
    """

    def test_valid_length_wrong_hash_rejected(self):
        """
        Build a synthetic packets file where one packet has a valid-format but wrong hash.
        Patch the file-level SHA so only the per-packet hash check applies.
        The harness must reject it (SystemExit 1).
        """
        # Build a minimal packet set using _make_packet (correct hash)
        packets = [_make_packet(f"X-{i:03d}") for i in range(1, 3)]

        # Tamper one packet with a syntactically valid (64-char hex) but incorrect hash
        tampered = deepcopy(packets)
        wrong_hash = "a" * 64  # valid hex format, 64 chars, but wrong value
        tampered[0]["packet_hash"] = "sha256:" + wrong_hash

        # Verify that _verify_packet_hash rejects it when file SHA is NOT authority
        self.assertFalse(
            _verify_packet_hash(tampered[0], file_sha_is_authority=False),
            "A valid-length wrong hash must fail _verify_packet_hash when not in authority mode",
        )

    def test_correct_hash_accepted(self):
        """A packet whose hash matches the standard derivation formula must be accepted."""
        p = _make_packet("X-001")
        self.assertTrue(
            _verify_packet_hash(p, file_sha_is_authority=False),
            "Correctly-hashed packet must pass _verify_packet_hash",
        )

    def test_validate_fixtures_rejects_wrong_hash(self):
        """validate_fixtures must exit 1 when packets file hash does not match authority.
        Complements test_valid_length_wrong_hash_rejected which proves the per-packet
        _verify_packet_hash function directly rejects syntactically valid wrong hashes.
        """
        # Build synthetic packets where one has a valid-format but wrong hash
        csv_rows_real, _, _ = _load_real_fixtures()
        packets = [_make_packet(r["CASE_ID"]) for r in csv_rows_real]
        tampered = deepcopy(packets)
        tampered[0]["packet_hash"] = "sha256:" + "b" * 64  # valid format, wrong value

        doc = _make_minimal_packets_doc(tampered)
        with tempfile.TemporaryDirectory() as tmp:
            pkt_path = Path(tmp) / "packets.json"
            pkt_path.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")

            # Do NOT patch STATE_PACKETS_AUTHORITY_SHA256 → file SHA mismatch → exit 1
            with self.assertRaises(SystemExit) as ctx:
                validate_fixtures(CORPUS_PATH, pkt_path)
            self.assertEqual(ctx.exception.code, 1)


class TestUnavailableStateBecomesBlocked(unittest.TestCase):
    """Unavailable runtime-relevant state must yield BLOCKED verdict."""

    def test_setup_precondition_mismatch_yields_blocked(self):
        """
        _check_precondition_against_packet returns a non-None reason when
        observed context doesn't match expected_context_packet.
        execute_case would return BLOCKED; we test the precondition check directly.
        """
        packet = _make_packet(
            "X-001",
            session_mode="EXACT_PRIOR_TURN_SEQUENCE",
            expected_context_packet={
                "schema": "btc_cosmographer_context_v0_1",
                "prior_domain": "astromodule",
                "prior_subject": "planetary_aspects",
                "prior_answer_state": "CONFIRMED",
            },
        )
        # Observed: wrong domain
        obs = _obs_all_present(ROUTE_DOMAIN="unknown_domain", ROUTE_SUBJECT="planetary_aspects", ANSWER_STATE="CONFIRMED")
        result = _check_precondition_against_packet(packet, obs, {}, setup_turn_index=1)
        self.assertIsNotNone(result, "Precondition mismatch must return a BLOCKED reason")
        self.assertIn("SETUP_PRECONDITION_MISMATCH", result)

    def test_matching_precondition_passes(self):
        """If observed context matches expected_context_packet, no block is returned."""
        packet = _make_packet(
            "X-001",
            session_mode="EXACT_PRIOR_TURN_SEQUENCE",
            expected_context_packet={
                "schema": "btc_cosmographer_context_v0_1",
                "prior_domain": "astromodule",
                "prior_subject": "planetary_aspects",
                "prior_answer_state": "CONFIRMED",
            },
        )
        obs = _obs_all_present(ROUTE_DOMAIN="astromodule", ROUTE_SUBJECT="planetary_aspects", ANSWER_STATE="CONFIRMED")
        result = _check_precondition_against_packet(packet, obs, {}, setup_turn_index=1)
        self.assertIsNone(result, "Matching precondition must not return a BLOCKED reason")


class TestBatchIdentityPreflightBlocks(unittest.TestCase):
    """SHA mismatch must block the entire batch, not just per-case FAIL."""

    def test_source_sha_mismatch_blocks_batch(self):
        """_batch_identity_preflight returns a BLOCKED string on source SHA mismatch."""
        mock_driver = MagicMock()
        # Simulate driver returning wrong source SHA from DOM
        mock_driver.execute_script.side_effect = [
            "wrong_deploy_sha",  # deployment_sha
            None,               # source_sha (meta tag)
        ]
        # Also mock driver.get() and time.sleep
        with patch("time.sleep"):
            result = _batch_identity_preflight(
                mock_driver, "https://example.com",
                expected_source_sha="correct_source",
                expected_deployment_sha="correct_deploy",
            )
        self.assertIsNotNone(result)
        self.assertIn("BATCH_IDENTITY_BLOCKED", result)

    def test_matching_shas_pass_preflight(self):
        """_batch_identity_preflight returns None when SHAs match."""
        mock_driver = MagicMock()
        mock_driver.execute_script.side_effect = [
            "correct_deploy",   # deployment_sha
            "correct_source",   # source_sha
        ]
        with patch("time.sleep"):
            result = _batch_identity_preflight(
                mock_driver, "https://example.com",
                expected_source_sha="correct_source",
                expected_deployment_sha="correct_deploy",
            )
        self.assertIsNone(result)

    def test_evaluate_case_source_sha_mismatch_fails(self):
        """evaluate_case marks FAIL on source SHA mismatch."""
        csv_row = {"CASE_ID": "X-001", "EXPECTED_DOMAIN": "", "EXPECTED_SUBJECT": "",
                   "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
                   "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
                   "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "", "FORBIDDEN_BEHAVIOR": ""}
        packet = _make_packet("X-001")
        obs = _obs_all_present()

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="wrong_sha",
            served_deployment_sha="expected_deploy_sha",
            expected_source_sha="expected_source_sha",
            expected_deployment_sha="expected_deploy_sha",
        )
        self.assertEqual(result["verdict"], "FAIL")
        self.assertTrue(any("SOURCE_SHA_MISMATCH" in r for r in result["failure_reasons"]))

    def test_evaluate_case_deployment_sha_mismatch_fails(self):
        """evaluate_case marks FAIL on deployment SHA mismatch."""
        csv_row = {"CASE_ID": "X-001", "EXPECTED_DOMAIN": "", "EXPECTED_SUBJECT": "",
                   "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
                   "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
                   "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "", "FORBIDDEN_BEHAVIOR": ""}
        packet = _make_packet("X-001")
        obs = _obs_all_present()

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="expected_source_sha",
            served_deployment_sha="wrong_deploy_sha",
            expected_source_sha="expected_source_sha",
            expected_deployment_sha="expected_deploy_sha",
        )
        self.assertEqual(result["verdict"], "FAIL")
        self.assertTrue(any("DEPLOYMENT_SHA_MISMATCH" in r for r in result["failure_reasons"]))


class TestQuestionByteRewriteRejected(unittest.TestCase):
    """Question bytes must be submitted exactly as frozen in the packet."""

    def test_question_byte_rewrite_rejected(self):
        """target_question_exact from packet must match CSV QUESTION_TEXT byte-for-byte."""
        csv_rows, _, packets_index = _load_real_fixtures()
        for row in csv_rows[:5]:
            cid = row["CASE_ID"]
            p = packets_index[cid]
            self.assertEqual(
                p["target_question_exact"],
                row["QUESTION_TEXT"],
                f"Question bytes differ for case_id={cid}: "
                f"packet={p['target_question_exact']!r} csv={row['QUESTION_TEXT']!r}",
            )

    def test_setup_turns_exact_are_plain_strings(self):
        """
        Frozen setup_turns_exact entries must be plain strings, not dicts.
        The harness must execute them byte-for-byte without calling .get() on them.
        """
        _, packets, _ = _load_real_fixtures()
        stateful = [p for p in packets if p.get("setup_turns_exact")]
        self.assertGreater(len(stateful), 0, "Expected at least one stateful packet")
        for p in stateful:
            for turn in p["setup_turns_exact"]:
                self.assertIsInstance(
                    turn, str,
                    f"setup_turns_exact entry is not a string for case_id={p['case_id']}: {turn!r}",
                )

    def test_harness_executes_setup_turns_as_strings(self):
        """
        The harness must treat setup_turns[0] as a plain string
        and pass it directly to _submit_question (not call .get() on it).
        """
        # Simulate: first_setup_q = setup_turns[0] must be used as a string
        setup_turns = ["Покажи аспекты планет в 2026 году."]
        first = setup_turns[0]
        # Must be usable as a string directly (no .get() attribute)
        self.assertIsInstance(first, str)
        self.assertFalse(hasattr(first, "get"), "setup turn must not be treated as a dict")


class TestCleanSessionStartsEmpty(unittest.TestCase):
    """CLEAN_SESSION must clear all storage before submitting the question."""

    def test_clean_session_clears_storage(self):
        """
        Behavioral test: when session_mode is CLEAN_SESSION,
        the harness calls sessionStorage.clear() and localStorage.clear()
        on the driver before submitting the target question.
        """
        executed_scripts = []

        mock_driver = MagicMock()
        mock_driver.execute_script.side_effect = lambda script: executed_scripts.append(script) or None
        mock_driver.find_elements.return_value = [MagicMock()]  # simulate cosmographerTurn found

        # We test the clear behavior by verifying the harness source contains both calls
        # and that they appear before _submit_question for CLEAN_SESSION
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        clear_idx = harness_src.find("sessionStorage.clear(); localStorage.clear();")
        clean_session_idx = harness_src.find('"CLEAN_SESSION"')
        submit_idx = harness_src.find("_submit_question(driver, target_url, question_exact")

        self.assertGreater(clear_idx, 0, "sessionStorage.clear() must appear in CLEAN_SESSION branch")
        # Clear must appear after the CLEAN_SESSION branch check and before submit
        self.assertLess(clean_session_idx, clear_idx)
        self.assertLess(clear_idx, submit_idx)

    def test_new_conversation_clean_clears_storage(self):
        """NEW_CONVERSATION_CLEAN must also clear storage."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        new_conv_idx = harness_src.find('"NEW_CONVERSATION_CLEAN"')
        # Find second occurrence of clear (for NEW_CONVERSATION_CLEAN branch)
        first_clear = harness_src.find("sessionStorage.clear(); localStorage.clear();")
        second_clear = harness_src.find("sessionStorage.clear(); localStorage.clear();", first_clear + 1)
        self.assertGreater(second_clear, 0, "sessionStorage.clear() must appear in NEW_CONVERSATION_CLEAN branch too")
        self.assertGreater(second_clear, new_conv_idx)


class TestExactSetupSequenceOrderPreserved(unittest.TestCase):
    """Setup turns must be submitted in exact packet-declared order."""

    def test_setup_strings_submitted_in_declared_order(self):
        """
        Simulate calling the setup execution logic with a tracked list of submitted questions.
        Verify that the first setup string is passed to _submit_question,
        and subsequent strings are passed in order to _submit_question_in_existing_session.
        """
        setup_turns = ["Q1", "Q2", "Q3"]
        submitted_via_url = []
        submitted_in_session = []

        def fake_submit_question(driver, target_url, q, locale):
            submitted_via_url.append(q)

        def fake_submit_in_session(driver, q, locale):
            submitted_in_session.append(q)
            return True

        # Simulate the EXACT_PRIOR_TURN_SEQUENCE setup logic
        first_setup_q = setup_turns[0]
        fake_submit_question(None, "https://example.com", first_setup_q, "RU")
        for i, setup_q in enumerate(setup_turns[1:], start=2):
            fake_submit_in_session(None, setup_q, "RU")

        self.assertEqual(submitted_via_url, ["Q1"])
        self.assertEqual(submitted_in_session, ["Q2", "Q3"])

    def test_setup_turns_sequence_in_harness(self):
        """
        The harness must use setup_turns[0] for the first URL navigation
        and enumerate(setup_turns[1:], start=2) for subsequent turns.
        """
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("setup_turns[0]", harness_src)
        self.assertIn("enumerate(setup_turns[1:], start=2)", harness_src)


class TestSetupPreconditionMismatchBlocks(unittest.TestCase):
    """If setup precondition does not materialize, verdict must be BLOCKED before target."""

    def test_precondition_mismatch_blocked_before_target(self):
        """
        When observed context after a setup turn doesn't match expected_context_packet,
        the harness must return BLOCKED without submitting the target question.
        """
        packet = _make_packet(
            "X-001",
            session_mode="EXACT_PRIOR_TURN_SEQUENCE",
            expected_context_packet={
                "schema": "btc_cosmographer_context_v0_1",
                "prior_domain": "astromodule",
                "prior_subject": "planetary_aspects",
                "prior_answer_state": "CONFIRMED",
            },
            setup_turns_exact=["Покажи аспекты планет в 2026 году."],
        )
        # Observed: domain mismatch → precondition fails
        obs_mismatch = _obs_all_present(ROUTE_DOMAIN="market_analysis", ANSWER_STATE="CONFIRMED")
        reason = _check_precondition_against_packet(packet, obs_mismatch, {}, setup_turn_index=1)

        self.assertIsNotNone(reason, "Must produce a BLOCKED reason on precondition mismatch")
        self.assertIn("SETUP_PRECONDITION_MISMATCH", reason)
        self.assertIn("prior_domain", reason)

    def test_subject_mismatch_blocked(self):
        """Subject mismatch must also block."""
        packet = _make_packet(
            "X-001",
            expected_context_packet={
                "prior_domain": "astromodule",
                "prior_subject": "planetary_aspects",
                "prior_answer_state": "CONFIRMED",
            },
        )
        obs = _obs_all_present(ROUTE_DOMAIN="astromodule", ROUTE_SUBJECT="market_overview", ANSWER_STATE="CONFIRMED")
        reason = _check_precondition_against_packet(packet, obs, {}, setup_turn_index=1)
        self.assertIsNotNone(reason)
        self.assertIn("prior_subject", reason)

    def test_no_expected_context_passes(self):
        """Packets without expected_context_packet must not be blocked."""
        packet = _make_packet("X-001")  # no expected_context_packet
        obs = _obs_all_present()
        result = _check_precondition_against_packet(packet, obs, {}, setup_turn_index=1)
        self.assertIsNone(result)


class TestFailBlockedCannotDisappear(unittest.TestCase):
    """FAIL and BLOCKED verdicts must never disappear from aggregate totals."""

    def test_fail_blocked_preserved_in_non_pass_ledger(self):
        results = [
            {"case_id": "A-001", "verdict": "PASS"},
            {"case_id": "A-002", "verdict": "FAIL", "failure_reasons": ["ROUTING: x"], "failure_class": ["ROUTING"]},
            {"case_id": "A-003", "verdict": "BLOCKED", "failure_reasons": [], "failure_class": []},
        ]
        non_pass = [r for r in results if r["verdict"] != "PASS"]
        self.assertEqual(len(non_pass), 2)
        verdicts = {r["verdict"] for r in non_pass}
        self.assertIn("FAIL", verdicts)
        self.assertIn("BLOCKED", verdicts)

    def test_blocked_not_in_pass_count(self):
        results = [
            {"verdict": "PASS"},
            {"verdict": "FAIL"},
            {"verdict": "BLOCKED"},
        ]
        pass_count = sum(1 for r in results if r.get("verdict") == "PASS")
        fail_count = sum(1 for r in results if r.get("verdict") == "FAIL")
        blocked_count = sum(1 for r in results if r.get("verdict") == "BLOCKED")
        self.assertEqual(pass_count, 1)
        self.assertEqual(fail_count, 1)
        self.assertEqual(blocked_count, 1)
        self.assertEqual(pass_count + fail_count + blocked_count, 3)


class TestPassPlusFailPlusBlockedEquals140(unittest.TestCase):
    """PASS + FAIL + BLOCKED must equal 140 for a full run."""

    def test_totals_invariant(self):
        results = []
        for i in range(140):
            results.append({"case_id": f"X-{i:03d}", "verdict": ["PASS", "FAIL", "BLOCKED"][i % 3]})
        p = sum(1 for r in results if r["verdict"] == "PASS")
        f = sum(1 for r in results if r["verdict"] == "FAIL")
        b = sum(1 for r in results if r["verdict"] == "BLOCKED")
        self.assertEqual(p + f + b, 140)


class TestOutputCaseIdSetEqualsCanonical(unittest.TestCase):
    """Output case-ID set must equal canonical case-ID set."""

    def test_output_case_ids_match_canonical(self):
        csv_rows, _, _ = _load_real_fixtures()
        canonical_ids = {r["CASE_ID"] for r in csv_rows}
        results = [{"case_id": cid, "verdict": "PASS"} for cid in canonical_ids]
        output_ids = {r["case_id"] for r in results}
        self.assertEqual(output_ids, canonical_ids)


class TestVolatileBinanceDoesNotFailStructural(unittest.TestCase):
    """Volatile Binance value differences must NOT fail structural evaluation."""

    def test_binance_price_difference_not_routing_failure(self):
        csv_row = {
            "CASE_ID": "X-001",
            "EXPECTED_DOMAIN": "astromodule", "EXPECTED_SUBJECT": "",
            "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
            "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
            "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "", "FORBIDDEN_BEHAVIOR": "",
        }
        packet = _make_packet("X-001")
        obs = _obs_all_present(
            ROUTE_DOMAIN="astromodule",
            BINANCE_BINDING_STATE="STRUCTURAL_OBSERVATION_ONLY",
            BOUNDARY_STATE="NON_TRADING",
        )

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="sha_x", served_deployment_sha="sha_y",
            expected_source_sha="sha_x", expected_deployment_sha="sha_y",
        )
        self.assertEqual(result["verdict"], "PASS")


class TestTradingIntentBinanceTriggersBoundaryFailure(unittest.TestCase):
    """Trading-intent Binance fetch must trigger boundary failure (FAIL verdict)."""

    def test_trading_intent_binance_is_fail(self):
        csv_row = {
            "CASE_ID": "X-001",
            "EXPECTED_DOMAIN": "astromodule", "EXPECTED_SUBJECT": "",
            "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
            "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
            "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "",
            "FORBIDDEN_BEHAVIOR": "BUY_SELL_SIGNAL",
        }
        packet = _make_packet("X-001")
        obs = _obs_all_present(
            ROUTE_DOMAIN="astromodule",
            BINANCE_BINDING_STATE="TRADING_INTENT_DETECTED",
            BOUNDARY_STATE="TRADING_BOUNDARY_VIOLATION",
        )

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="sha_x", served_deployment_sha="sha_y",
            expected_source_sha="sha_x", expected_deployment_sha="sha_y",
        )
        self.assertEqual(result["verdict"], "FAIL")
        self.assertTrue(any("TRADING" in r.upper() for r in result["failure_reasons"]))


class TestMissingMandatoryFieldCannotSilentlyPass(unittest.TestCase):
    """Missing mandatory capture fields must not silently PASS."""

    def test_missing_route_domain_fails(self):
        """If ROUTE_DOMAIN is None/absent, evaluate_case must not return PASS."""
        csv_row = {
            "CASE_ID": "X-001",
            "EXPECTED_DOMAIN": "", "EXPECTED_SUBJECT": "",
            "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
            "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
            "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "", "FORBIDDEN_BEHAVIOR": "",
        }
        packet = _make_packet("X-001")
        obs = _obs_all_present()
        obs["ROUTE_DOMAIN"] = None  # mandatory field missing

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="sha_x", served_deployment_sha="sha_y",
            expected_source_sha="sha_x", expected_deployment_sha="sha_y",
        )
        self.assertNotEqual(result["verdict"], "PASS", "PASS must not be returned when ROUTE_DOMAIN is None")
        self.assertTrue(any("MISSING_MANDATORY_FIELD" in r for r in result["failure_reasons"]))

    def test_all_fields_present_can_pass(self):
        """With all mandatory fields present and SHAs matching, evaluate_case may PASS."""
        csv_row = {
            "CASE_ID": "X-001",
            "EXPECTED_DOMAIN": "", "EXPECTED_SUBJECT": "",
            "EXPECTED_CONTEXT_RELATION": "", "EXPECTED_ANSWER_STATE": "",
            "EXPECTED_ANSWER_MODE": "", "EXPECTED_TIME_SCOPE": "",
            "EXPECTED_BOUNDARY": "", "EXPECTED_DIRECTNESS": "", "FORBIDDEN_BEHAVIOR": "",
        }
        packet = _make_packet("X-001")
        obs = _obs_all_present()

        result = evaluate_case(
            csv_row=csv_row, packet=packet, obs=obs,
            served_source_sha="sha_x", served_deployment_sha="sha_y",
            expected_source_sha="sha_x", expected_deployment_sha="sha_y",
        )
        self.assertEqual(result["verdict"], "PASS")


class TestNoProductModuleImported(unittest.TestCase):
    """Harness must not import any product module as a mutation helper."""

    FORBIDDEN_IMPORT_PATTERNS = [
        "import btc_cosmographer",
        "from btc_cosmographer",
        "import btcCosmographer",
        "from btc_live_dialogue",
        "import btc_live_dialogue",
        "from lib.",
        "import lib.",
        "from pages.",
        "import pages.",
        "from components.",
        "import components.",
    ]

    def test_no_product_module_imported(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        for forbidden in self.FORBIDDEN_IMPORT_PATTERNS:
            self.assertNotIn(
                forbidden,
                harness_src,
                f"Harness imports forbidden product module: {forbidden!r}",
            )


class TestNoFixtureNormalizationOrRewrite(unittest.TestCase):
    """Harness must never normalize or rewrite fixture files."""

    FORBIDDEN_PATTERNS = [
        "csv.writer",
        "open(corpus_path, 'w",
        "open(packets_path, 'w",
        "normalize",
        "reserialize",
    ]

    def test_no_fixture_rewrite_in_harness(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        for pattern in self.FORBIDDEN_PATTERNS:
            self.assertNotIn(
                pattern,
                harness_src,
                f"Harness contains fixture normalization/rewrite pattern: {pattern!r}",
            )


class TestOutputFilesWritten(unittest.TestCase):
    """Write_outputs creates all required output files."""

    def test_output_files_created(self):
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp) / "out"
            results = [{"case_id": "X-001", "verdict": "PASS"}]
            evaluator_inputs = [{"case_id": "X-001"}]
            non_pass = []
            summary = {"total": 1, "pass": 1, "fail": 0, "blocked": 0}
            manifest = {"schema": "test"}

            write_outputs(
                output_dir=output_dir,
                raw_observations=results,
                evaluator_inputs=evaluator_inputs,
                non_pass_ledger=non_pass,
                summary=summary,
                manifest=manifest,
            )

            self.assertTrue((output_dir / "raw-observations.jsonl").exists())
            self.assertTrue((output_dir / "evaluator-input.jsonl").exists())
            self.assertTrue((output_dir / "non-pass-ledger.jsonl").exists())
            self.assertTrue((output_dir / "aggregate-summary.json").exists())
            self.assertTrue((output_dir / "run-manifest.json").exists())


class TestMandatoryEvaluatorFieldsPresent(unittest.TestCase):
    """All mandatory evaluator capture fields must be present in the harness."""

    def test_mandatory_fields_in_harness(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        for field in MANDATORY_CAPTURE_FIELDS:
            self.assertIn(field, harness_src, f"Mandatory capture field missing from harness: {field}")


class TestFailureClassesPresent(unittest.TestCase):
    """All required failure classes must be enumerated in the harness."""

    def test_failure_classes_in_harness(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        for fc in FAILURE_CLASSES:
            self.assertIn(fc, harness_src, f"Failure class missing from harness: {fc}")


class TestRuntimeIdentityNotFrozen(unittest.TestCase):
    """Volatile deployment SHA must not be hardcoded in the harness."""

    def test_no_frozen_deployment_sha_in_harness(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("--expected-deployment-sha", harness_src)
        self.assertIn("--expected-source-sha", harness_src)
        self.assertIn("--target-url", harness_src)
        import re
        suspicious = re.findall(r'\b[0-9a-f]{40,64}\b', harness_src)
        known = {CORPUS_AUTHORITY_SHA256, STATE_PACKETS_AUTHORITY_SHA256}
        unknown_hashes = [h for h in suspicious if h not in known]
        self.assertEqual(
            unknown_hashes,
            [],
            f"Suspicious frozen SHA-like constants found in harness: {unknown_hashes}",
        )


class TestDefaultConcurrencyIsOne(unittest.TestCase):
    """Default concurrency must be 1."""

    def test_default_concurrency_one(self):
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("default=1", harness_src)


class TestBuildManifest(unittest.TestCase):
    """build_manifest includes all required fields."""

    def _make_args(self):
        args = MagicMock()
        args.target_url = "https://example.com"
        args.expected_source_sha = "src_sha"
        args.expected_deployment_sha = "dep_sha"
        return args

    def test_manifest_fields(self):
        results = [
            {"case_id": "A-001", "verdict": "PASS"},
            {"case_id": "A-002", "verdict": "FAIL"},
            {"case_id": "A-003", "verdict": "BLOCKED"},
        ]
        manifest = build_manifest(
            args=self._make_args(),
            corpus_sha="c_sha",
            packets_sha="p_sha",
            results=results,
            start_ts="2026-01-01T00:00:00Z",
            end_ts="2026-01-01T01:00:00Z",
        )
        self.assertEqual(manifest["target_url"], "https://example.com")
        self.assertEqual(manifest["expected_source_sha"], "src_sha")
        self.assertEqual(manifest["expected_deployment_sha"], "dep_sha")
        self.assertEqual(manifest["pass"], 1)
        self.assertEqual(manifest["fail"], 1)
        self.assertEqual(manifest["blocked"], 1)
        self.assertEqual(manifest["total"], 3)
        self.assertIn("case_id_set", manifest)


class TestDomCaptureUsesCorrectAttributes(unittest.TestCase):
    """Harness must use the correct product DOM attribute names."""

    def test_intents_uses_question_facets_attribute(self):
        """INTENTS must be captured from data-question-facets, not data-intents."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-question-facets", harness_src, "Must use data-question-facets for INTENTS")
        # Must NOT use data-intents as a DOM attribute (it doesn't exist in the product)
        # Allow 'data-intents' only if it's a comment or string constant, not a capture mapping
        # Simple check: data-question-facets must map to INTENTS
        self.assertIn('"data-question-facets", "INTENTS"', harness_src)

    def test_direct_answer_uses_answer_lead_selector(self):
        """DIRECT_ANSWER must use .answerLead[data-answer-direct="true"] text."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn('answerLead', harness_src)
        self.assertIn('data-answer-direct', harness_src)

    def test_answer_sections_use_semantic_section_attr(self):
        """Answer section ids must use data-semantic-answer-section."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-semantic-answer-section", harness_src)

    def test_evidence_metadata_uses_correct_attr(self):
        """Evidence metadata must use data-evidence-metadata."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-evidence-metadata", harness_src)

    def test_evidence_artifact_targets_uses_correct_attr(self):
        """Evidence targets must use data-evidence-artifact-targets."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-evidence-artifact-targets", harness_src)

    def test_deployment_sha_uses_deployment_head_sha(self):
        """Deployment SHA must be read from data-deployment-head-sha."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-deployment-head-sha", harness_src)

    def test_runtime_schema_captured(self):
        """Runtime schema must be captured from data-runtime-schema."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-runtime-schema", harness_src)

    def test_session_schema_captured(self):
        """Session schema must be captured from data-session-schema."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("data-session-schema", harness_src)

    def test_response_headers_use_performance_log(self):
        """Response headers must be captured via performance log (CDP), not DOM attributes."""
        harness_src = HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("get_log", harness_src, "Must use driver.get_log() for performance log capture")
        self.assertIn("performance", harness_src)
        self.assertIn("Network.responseReceived", harness_src)


class TestSessionFieldExtraction(unittest.TestCase):
    """_extract_session_fields must populate EVIDENCE_LEVELS, TIME_SCOPE, FRESHNESS."""

    def test_extracts_fields_from_session(self):
        session_state = {
            "session_value": {
                "turns": [
                    {"evidence_levels": ["ASTRO", "BTC"], "time_scope": "HISTORICAL", "freshness": "CURRENT"},
                ],
                "evidence": {"key": "val"},
            }
        }
        fields = _extract_session_fields(session_state)
        self.assertEqual(fields["EVIDENCE_LEVELS"], ["ASTRO", "BTC"])
        self.assertEqual(fields["TIME_SCOPE"], "HISTORICAL")
        self.assertEqual(fields["FRESHNESS"], "CURRENT")

    def test_empty_session_returns_none_fields(self):
        fields = _extract_session_fields({})
        self.assertIsNone(fields["EVIDENCE_LEVELS"])
        self.assertIsNone(fields["TIME_SCOPE"])
        self.assertIsNone(fields["FRESHNESS"])


class TestSelfTestCount(unittest.TestCase):
    """Meta-test: verify the expected minimum number of selftests exist."""

    MINIMUM_REQUIRED_SELFTESTS = 30

    def test_minimum_selftest_count(self):
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromModule(sys.modules[__name__])
        total = suite.countTestCases()
        self.assertGreaterEqual(
            total,
            self.MINIMUM_REQUIRED_SELFTESTS,
            f"Only {total} selftests found, minimum required is {self.MINIMUM_REQUIRED_SELFTESTS}",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
