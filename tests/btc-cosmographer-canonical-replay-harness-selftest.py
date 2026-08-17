"""
BTC Cosmographer Canonical 140 Replay Harness — Two-stage handoff selftests.
No real browser replay is executed by this suite.
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import inspect
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO_ROOT = Path(__file__).resolve().parent.parent
HARNESS_PATH = REPO_ROOT / "scripts" / "run-btc-cosmographer-canonical-140-replay.py"
_spec = importlib.util.spec_from_file_location("harness", HARNESS_PATH)
h = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(h)


def load_fixtures():
    with open(h.CORPUS_PATH, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    with open(h.PACKETS_PATH, encoding="utf-8") as f:
        packets = json.load(f)["packets"]
    return rows, packets, {p["case_id"]: p for p in packets}


def obs(**overrides):
    base = {
        "_dom_available": True,
        "ROUTE_DOMAIN": "astromodule",
        "ROUTE_SUBJECT": "jupiter",
        "MARKET_QUESTION_CLASS": None,
        "RELATION_RESOLUTION": "SINGLE_DOMAIN",
        "CONTEXT_RELATION": "NEW_TOPIC",
        "ANSWER_STATE": "CONFIRMED",
        "ANSWER_MODE": "ASTRO_INTERVAL",
        "ROUTE_DISPOSITION": "CONTINUE",
        "PRIMARY_AUTHORITY": "EPHEMERIS_SOURCE_AND_VERIFIED_ASTRONOMICAL_DERIVATIONS",
        "EVIDENCE_LEVELS": ["L1", "L2", "L3"],
        "SOURCE_REVISION": "rev",
        "FRESHNESS": "FRESH",
        "BINANCE_BINDING_STATE": "NOT_APPLICABLE",
        "DIRECT_ANSWER": "answer",
        "BOUNDARY_STATE": "bounded",
        "SHOW_CLARIFICATION": False,
        "_answer_section_ids": ["interpretation_boundary"],
        "_dom_order": {"direct_answer_before_sections": True},
        "_evidence_metadata": {
            "evidence-coverage": "2026",
            "evidence-revision-or-generated-time": "rev",
        },
    }
    base.update(overrides)
    return base


def session(turns=None, session_id="sid", locale="ru", **extra):
    value = {"session_id": session_id, "locale": locale, "turns": turns or []}
    value.update(extra)
    return {"session_key": "k", "session_value": value}


def semantic_bindings(mode_domain="astromodule"):
    result = {}
    for dim in h.BINDING_DIMENSIONS:
        if dim in ("mode", "domain"):
            result[dim] = {
                "status": "FROZEN",
                "evaluation_stage": "A_STRUCTURAL_HARD_GATE",
                "binding_class": "DIRECT_ENUM",
                "predicate": {"op": "EQ", "field": "ROUTE_DOMAIN", "value": mode_domain},
                "missing_observation_verdict": "BLOCKED",
                "mismatch_verdict": "FAIL",
            }
        else:
            result[dim] = {
                "status": "FROZEN",
                "evaluation_stage": "B_SEMANTIC_EVALUATOR",
                "binding_class": "LOCKED_EVALUATOR_SKILL",
                "evaluator_id": "btc-cosmographer-evaluator",
            }
    return result


def synthetic_binding_record(row, packet, bindings=None):
    record = {
        "case_id": row["CASE_ID"],
        "corpus_layer": row["CORPUS_LAYER"],
        "locale": row["LOCALE"],
        "question_class": row["QUESTION_CLASS"],
        "expected_contract_hash": (packet.get("source_authority") or {}).get("expected_contract_hash"),
        "state_packet_hash": packet["packet_hash"],
        "runtime_base_sha": "base",
        "bindings": bindings or semantic_bindings(),
        "unresolved_required_dimensions": [],
        "record_status": "FROZEN",
    }
    record["binding_record_hash"] = h.canonical_json_sha256(record)
    return record


def semantic_result(inp, verdict="PASS", dimension_override=None):
    dims = []
    for dim in h.SEMANTIC_DIMENSIONS:
        dv = dimension_override.get(dim, verdict) if dimension_override else verdict
        dims.append({
            "dimension": dim,
            "verdict": dv,
            "reason": f"{dim}:{dv}",
            "observation_evidence_refs": ["captured_runtime_observation"],
        })
    case_verdict = h._semantic_case_verdict(dims)
    return {
        "case_id": inp["case_id"],
        "observation_sha256": inp["observation_sha256"],
        "expected_contract_hash": inp["expected_contract_hash"],
        "state_packet_hash": inp["state_packet_hash"],
        "evaluator_contract_sha256": inp["evaluator_contract_sha256"],
        "binding_authority_hash": inp["binding_authority_hash"],
        "binding_record_hash": inp["binding_record_hash"],
        "evaluator_input_hash": inp["evaluator_input_hash"],
        "dimension_results": dims,
        "case_verdict": case_verdict,
        "failure_classes": [] if case_verdict == "PASS" else ["OTHER_EXACTLY_DESCRIBED"],
    }


class FixtureIntegrityTests(unittest.TestCase):
    def test_exact_corpus_hash(self):
        self.assertEqual(h.sha256_file(h.CORPUS_PATH), h.CORPUS_AUTHORITY_SHA256)

    def test_exact_packets_hash(self):
        self.assertEqual(h.sha256_file(h.PACKETS_PATH), h.STATE_PACKETS_AUTHORITY_SHA256)

    def test_total_and_unique_140(self):
        rows, packets, _ = load_fixtures()
        self.assertEqual(len(rows), 140)
        self.assertEqual(len({r["CASE_ID"] for r in rows}), 140)
        self.assertEqual(len(packets), 140)

    def test_layer_counts(self):
        from collections import Counter
        rows, _, _ = load_fixtures()
        self.assertEqual(Counter(r["CORPUS_LAYER"] for r in rows), h.LAYER_COUNTS)

    def test_packet_id_set_equals_corpus(self):
        rows, packets, _ = load_fixtures()
        self.assertEqual({r["CASE_ID"] for r in rows}, {p["case_id"] for p in packets})

    def test_packet_hash_format_all_140(self):
        _, packets, _ = load_fixtures()
        self.assertTrue(all(h._verify_packet_hash(p, True) for p in packets))

    def test_no_heuristic_state_reconstruction(self):
        _, packets, _ = load_fixtures()
        self.assertEqual([p["case_id"] for p in packets if p.get("heuristic_state_reconstruction") != "NO"], [])

    def test_no_expected_contract_mutation(self):
        _, packets, _ = load_fixtures()
        self.assertEqual([p["case_id"] for p in packets if p.get("expected_contract_mutation") != "NO"], [])

    def test_duplicate_case_id_rejected(self):
        rows, _, _ = load_fixtures()
        duplicate = deepcopy(rows)
        duplicate[1]["CASE_ID"] = duplicate[0]["CASE_ID"]
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "c.csv"
            with open(path, "w", newline="", encoding="utf-8-sig") as f:
                w = csv.DictWriter(f, fieldnames=duplicate[0].keys()); w.writeheader(); w.writerows(duplicate)
            with patch.object(h, "CORPUS_AUTHORITY_SHA256", h.sha256_file(path)):
                with self.assertRaises(SystemExit):
                    h.validate_fixtures(path, h.PACKETS_PATH)

    def test_corpus_hash_mismatch_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "c.csv"; p.write_text("bad", encoding="utf-8")
            with self.assertRaises(SystemExit):
                h.validate_fixtures(p, h.PACKETS_PATH)

    def test_missing_packet_rejected(self):
        _, packets, _ = load_fixtures()
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "p.json"
            p.write_text(json.dumps({"packets": packets[:-1]}, ensure_ascii=False), encoding="utf-8")
            with patch.object(h, "STATE_PACKETS_AUTHORITY_SHA256", h.sha256_file(p)):
                with self.assertRaises(SystemExit):
                    h.validate_fixtures(h.CORPUS_PATH, p)

    def test_packet_hash_mismatch_rejected_by_hash_function(self):
        packet = {"case_id": "X", "x": 1}
        packet["packet_hash"] = "sha256:" + "a" * 64
        self.assertFalse(h._verify_packet_hash(packet, False))


class BindingAuthorityTests(unittest.TestCase):
    def make_doc(self):
        rows, _, index = load_fixtures()
        records = [synthetic_binding_record(row, index[row["CASE_ID"]]) for row in rows]
        return {
            "schema": h.BINDING_AUTHORITY_SCHEMA,
            "authority_status": "FROZEN_PASS",
            "authority_hash": h.BINDING_AUTHORITY_HASH,
            "source_authority": {
                "canonical_corpus_sha256": h.CORPUS_AUTHORITY_SHA256,
                "state_packets_sha256": h.STATE_PACKETS_AUTHORITY_SHA256,
                "evaluator_contract_sha256": h.EVALUATOR_CONTRACT_SHA256,
            },
            "hybrid_binding_coverage_proof": {"freeze_gate": "PASS", "unbound_required_dimensions": 0},
            "records": records,
        }

    def test_synthetic_140_authority_validates(self):
        rows, _, index = load_fixtures(); doc = self.make_doc()
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "a.json"; p.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
            with patch.object(h, "BINDING_AUTHORITY_FILE_SHA256", h.sha256_file(p)):
                loaded, recs = h.validate_binding_authority(p, rows, index)
            self.assertEqual(loaded["authority_status"], "FROZEN_PASS")
            self.assertEqual(len(recs), 140)

    def test_authority_file_hash_mismatch_rejected(self):
        rows, _, index = load_fixtures(); doc = self.make_doc()
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "a.json"; p.write_text(json.dumps(doc), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "FILE_HASH_MISMATCH"):
                h.validate_binding_authority(p, rows, index)

    def test_authority_hash_mismatch_rejected(self):
        rows, _, index = load_fixtures(); doc = self.make_doc(); doc["authority_hash"] = "sha256:" + "0" * 64
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "a.json"; p.write_text(json.dumps(doc), encoding="utf-8")
            with patch.object(h, "BINDING_AUTHORITY_FILE_SHA256", h.sha256_file(p)):
                with self.assertRaisesRegex(ValueError, "AUTHORITY_HASH_MISMATCH"):
                    h.validate_binding_authority(p, rows, index)

    def test_record_hash_mismatch_rejected(self):
        rows, _, index = load_fixtures(); doc = self.make_doc(); doc["records"][0]["binding_record_hash"] = "sha256:" + "0" * 64
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "a.json"; p.write_text(json.dumps(doc), encoding="utf-8")
            with patch.object(h, "BINDING_AUTHORITY_FILE_SHA256", h.sha256_file(p)):
                with self.assertRaisesRegex(ValueError, "RECORD_HASH_MISMATCH"):
                    h.validate_binding_authority(p, rows, index)

    def test_expected_contract_hash_linkage_rejected(self):
        rows, _, index = load_fixtures(); doc = self.make_doc(); doc["records"][0]["expected_contract_hash"] = "sha256:bad"
        body = {k:v for k,v in doc["records"][0].items() if k != "binding_record_hash"}
        doc["records"][0]["binding_record_hash"] = h.canonical_json_sha256(body)
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "a.json"; p.write_text(json.dumps(doc), encoding="utf-8")
            with patch.object(h, "BINDING_AUTHORITY_FILE_SHA256", h.sha256_file(p)):
                with self.assertRaisesRegex(ValueError, "EXPECTED_CONTRACT_HASH_MISMATCH"):
                    h.validate_binding_authority(p, rows, index)

    def test_dimension_set_exact(self):
        self.assertEqual(h.BINDING_DIMENSIONS, ["mode", "domain", *h.SEMANTIC_DIMENSIONS])
        self.assertEqual(len(h.SEMANTIC_DIMENSIONS), 10)


class StructuralPredicateTests(unittest.TestCase):
    def ev(self, pred, o=None, before=None, after=None, statuses=None):
        return h._evaluate_structural_predicate(pred, o or obs(), before or {}, after or {}, statuses or {})

    def test_eq(self): self.assertTrue(self.ev({"op":"EQ","field":"ROUTE_DOMAIN","value":"astromodule"}))
    def test_eq_false(self): self.assertFalse(self.ev({"op":"EQ","field":"ROUTE_DOMAIN","value":"btc_market"}))
    def test_and(self): self.assertTrue(self.ev({"op":"AND","args":[{"op":"EQ","field":"ROUTE_DOMAIN","value":"astromodule"},{"op":"EQ","field":"ROUTE_SUBJECT","value":"jupiter"}]}))
    def test_or(self): self.assertTrue(self.ev({"op":"OR","args":[{"op":"EQ","field":"ROUTE_DOMAIN","value":"bad"},{"op":"EQ","field":"ROUTE_SUBJECT","value":"jupiter"}]}))
    def test_not(self): self.assertTrue(self.ev({"op":"NOT","arg":{"op":"EQ","field":"ROUTE_SUBJECT","value":"mercury"}}))
    def test_in(self): self.assertTrue(self.ev({"op":"IN","field":"ANSWER_MODE","values":["ASTRO_INTERVAL","X"]}))
    def test_set_contains_all(self): self.assertTrue(self.ev({"op":"SET_CONTAINS_ALL","field":"EVIDENCE_LEVELS","values":["L1","L3"]}))
    def test_intersects(self): self.assertTrue(self.ev({"op":"INTERSECTS","field":"ANSWER_SECTION_IDS","values":["x","interpretation_boundary"]}))
    def test_is_non_null(self): self.assertTrue(self.ev({"op":"IS_NON_NULL","field":"DIRECT_ANSWER"}))
    def test_is_null(self):
        after=session([{"time_start":None,"time_end":None}])
        self.assertTrue(self.ev({"op":"IS_NULL","field":"TURN.time_start"}, after=after))
    def test_eq_fields(self):
        before=session([{"route_subject":"jupiter"}]); self.assertTrue(self.ev({"op":"EQ_FIELDS","left":"ROUTE_SUBJECT","right":"SESSION_PRIOR.route_subject"}, before=before))
    def test_session_prior_eq(self):
        before=session([{"route_domain":"astromodule"}]); self.assertTrue(self.ev({"op":"SESSION_PRIOR_EQ","field":"route_domain","value":"astromodule"}, before=before))
    def test_date_range_eq(self):
        after=session([{"time_start":"2026-01-01","time_end":"2026-12-31"}]); self.assertTrue(self.ev({"op":"DATE_RANGE_EQ","start":"2026-01-01","end":"2026-12-31"}, after=after))
    def test_date_eq(self):
        after=session([{"time_start":"2009-01-03","time_end":"2009-01-03"}]); self.assertTrue(self.ev({"op":"DATE_EQ","value":"2009-01-03"}, after=after))
    def test_dependency(self): self.assertTrue(self.ev({"op":"DEPENDENCY","binding":"subject","required_status":"PASS"}, statuses={"subject":"PASS"}))
    def test_unknown_field_returns_none(self): self.assertIsNone(self.ev({"op":"EQ","field":"DOES_NOT_EXIST","value":"x"}))


class StageATests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rows, _, idx = load_fixtures(); cls.row=rows[0]; cls.packet=idx[cls.row["CASE_ID"]]

    def record(self, bindings=None): return synthetic_binding_record(self.row, self.packet, bindings)

    def eval_stage(self, o=None, record=None, src="sha", dep="sha"):
        return h.evaluate_stage_a(self.row, self.packet, o or obs(), record or self.record(), src, dep, "sha", "sha", {}, session([{"route_domain":"astromodule","route_subject":"jupiter","time_start":None,"time_end":None}]))

    def test_stage_a_pass_simple_structural(self): self.assertEqual(self.eval_stage()["stage_a_verdict"], "PASS")
    def test_source_sha_mismatch_fails(self): self.assertEqual(self.eval_stage(src="wrong")["stage_a_verdict"], "FAIL")
    def test_deployment_sha_mismatch_fails(self): self.assertEqual(self.eval_stage(dep="wrong")["stage_a_verdict"], "FAIL")
    def test_question_byte_mismatch_fails(self):
        row=deepcopy(self.row); row["QUESTION_TEXT"] += "x"
        r=h.evaluate_stage_a(row,self.packet,obs(),self.record(),"sha","sha","sha","sha",{},session([]))
        self.assertEqual(r["stage_a_verdict"],"FAIL")
    def test_locale_authority_mismatch_fails(self):
        row=deepcopy(self.row); row["LOCALE"]="XX"
        r=h.evaluate_stage_a(row,self.packet,obs(),self.record(),"sha","sha","sha","sha",{},session([]))
        self.assertEqual(r["stage_a_verdict"],"FAIL")
    def test_trading_intent_fails(self): self.assertEqual(self.eval_stage(obs(BINANCE_BINDING_STATE="TRADING_INTENT_DETECTED"))["stage_a_verdict"],"FAIL")
    def test_volatile_binance_structural_value_does_not_fail(self): self.assertEqual(self.eval_stage(obs(BINANCE_BINDING_STATE="LIVE_PUBLIC_OBSERVATION"))["stage_a_verdict"],"PASS")
    def test_structural_mismatch_fails(self): self.assertEqual(self.eval_stage(obs(ROUTE_DOMAIN="btc_market"))["stage_a_verdict"],"FAIL")
    def test_structural_missing_observation_blocks(self): self.assertEqual(self.eval_stage(obs(ROUTE_DOMAIN=None))["stage_a_verdict"],"BLOCKED")
    def test_semantic_only_dimensions_marked_not_applicable(self):
        r=self.eval_stage(); sem=[x for x in r["structural_dimension_results"] if x["dimension"] in h.SEMANTIC_DIMENSIONS]
        self.assertTrue(all(x["status"]=="NOT_APPLICABLE_STAGE_B_REQUIRED" for x in sem))
    def test_evaluate_case_without_binding_record_blocks(self):
        r=h.evaluate_case(self.row,self.packet,obs(),"sha","sha","sha","sha")
        self.assertEqual(r["stage_a_verdict"],"BLOCKED")
    def test_no_semantic_csv_string_comparison_in_stage_a(self):
        src=inspect.getsource(h.evaluate_stage_a)
        for col in ("EXPECTED_SUBJECT","EXPECTED_INTENT","EXPECTED_PERIOD","EXPECTED_CONTEXT_RELATION","EXPECTED_EVIDENCE_FAMILY","EXPECTED_ANSWER_TYPE","EXPECTED_DIRECTNESS","EXPECTED_BOUNDARY","EXPECTED_MEMORY_ACTION","FORBIDDEN_BEHAVIOR"):
            self.assertNotIn(col, src)


class SetupAndIdentityTests(unittest.TestCase):
    def test_setup_precondition_mismatch_blocks(self):
        packet={"prior_turns":{"value":[]},"expected_context_packet":{"prior_domain":"astromodule"}}
        reason=h._check_precondition_against_packet(packet,obs(ROUTE_DOMAIN="btc_market"),{},1)
        self.assertIn("SETUP_PRECONDITION_MISMATCH",reason)

    def test_question_exact_setup_mismatch_blocks(self):
        packet={"prior_turns":{"value":[{"question_exact":"Q"}]}}
        reason=h._check_precondition_against_packet(packet,obs(),{},1,submitted_question="WRONG")
        self.assertIn("question_exact",reason)

    def test_source_bound_setup_answer_state_accepts_allowed_value(self):
        packet={"prior_turns":{"value":[{"expected_answer_state":{"binding":"setup_turn[1].observed.answer_state","allowed_values":["CONFIRMED","SPLIT","LIMITED"]}}]}}
        self.assertIsNone(h._check_precondition_against_packet(packet,obs(ANSWER_STATE="SPLIT"),{},1))
        reason=h._check_precondition_against_packet(packet,obs(ANSWER_STATE="UNKNOWN"),{},1)
        self.assertIn("answer_state",reason)

    def test_source_bound_final_answer_state_accepts_allowed_value(self):
        packet={"expected_context_packet":{"prior_answer_state":{"binding":"setup_turn[1].observed.answer_state","allowed_values":["CONFIRMED","SPLIT","LIMITED"]}}}
        self.assertIsNone(h._validate_final_state_before_target(packet,obs(ANSWER_STATE="LIMITED"),session([])))
        reason=h._validate_final_state_before_target(packet,obs(ANSWER_STATE="UNKNOWN"),session([]))
        self.assertIn("prior_answer_state",reason)

    def test_clean_session_code_clears_storage(self):
        src=inspect.getsource(h.execute_case)
        self.assertIn("sessionStorage.clear(); localStorage.clear();",src)
        self.assertIn('session_state_before_target',src)

    def test_setup_sequence_order_code_is_exact(self):
        src=inspect.getsource(h.execute_case)
        self.assertIn("setup_turns[0]",src)
        self.assertIn("enumerate(setup_turns[1:], start=2)",src)

    def test_session_turn_materialization_requires_increment_and_exact_question(self):
        before=session([{"user_text":"setup"}])
        exact=session([{"user_text":"setup"},{"user_text":"А как это совпадает с Биткоином?"}])
        wrong=session([{"user_text":"setup"},{"user_text":"другой вопрос"}])
        self.assertFalse(h._session_turn_materialized(before,1,"А как это совпадает с Биткоином?"))
        self.assertTrue(h._session_turn_materialized(exact,1,"А как это совпадает с Биткоином?"))
        self.assertFalse(h._session_turn_materialized(wrong,1,"А как это совпадает с Биткоином?"))

    def test_in_session_submit_uses_native_form_path_not_pointer_click(self):
        src=inspect.getsource(h._submit_question_in_existing_session)
        self.assertIn("requestSubmit",src)
        self.assertIn('get_attribute("value") != question',src)
        self.assertNotIn("btns[-1].click()",src)
        self.assertNotIn("submitter.click()",src)

    def test_followup_wait_uses_serialized_session_not_dom_cardinality(self):
        src=inspect.getsource(h.execute_case)
        self.assertIn("_wait_for_session_turn_materialization",src)
        self.assertNotIn("turns_now > turns_before",src)
        self.assertNotIn("turns_now > turns_before_target",src)

    def test_batch_deployment_mismatch_blocks(self):
        driver=MagicMock(); driver.get_log.return_value=[]; driver.execute_script.return_value="wrong"
        with patch("time.sleep"):
            reason,_,_=h._batch_identity_preflight(driver,"https://example.com","src","dep")
        self.assertIn("BATCH_IDENTITY_BLOCKED",reason)
        self.assertIn("DEPLOYMENT_SHA_MISMATCH",reason)

    def test_batch_source_mismatch_blocks(self):
        driver=MagicMock(); driver.get_log.return_value=[]; driver.execute_script.return_value="dep"
        with patch("time.sleep"):
            reason,_,_=h._batch_identity_preflight(driver,"https://example.com","src","dep")
        self.assertIn("SOURCE_SHA_MISMATCH",reason)


class HandoffHashTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rows,_,idx=load_fixtures(); cls.row=rows[0]; cls.packet=idx[cls.row["CASE_ID"]]; cls.record=synthetic_binding_record(cls.row,cls.packet)

    def make_raw(self, verdict="PASS"):
        return {"case_id":self.row["CASE_ID"],"question_exact":self.packet["target_question_exact"],"locale":self.packet["locale"],"observation":obs(),"session_state_before_target":session([]),"session_state":session([{"route_domain":"astromodule"}]),"response_headers":{},"served_source_sha":"src","served_deployment_sha":"dep","setup_preconditions_materialized":True,"stage_a_verdict":verdict,"stage_a_failure_reasons":[],"structural_dimension_results":[]}

    def test_evaluator_input_contains_hash_authorities(self):
        inp=h.build_evaluator_input(self.make_raw(),self.packet,(self.packet.get("source_authority") or {}).get("expected_contract") or self.row,self.record,"src","dep")
        for key in ("observation_sha256","expected_contract_hash","state_packet_hash","evaluator_contract_sha256","binding_authority_hash","binding_record_hash","evaluator_input_hash"):
            self.assertTrue(inp.get(key),key)

    def test_stage_b_required_only_after_stage_a_pass(self):
        inp=h.build_evaluator_input(self.make_raw("PASS"),self.packet,self.row,self.record,"src","dep"); self.assertTrue(inp["stage_b_required"])
        inp2=h.build_evaluator_input(self.make_raw("BLOCKED"),self.packet,self.row,self.record,"src","dep"); self.assertFalse(inp2["stage_b_required"])

    def test_observation_hash_changes_on_observation_change(self):
        raw1=self.make_raw(); raw2=self.make_raw(); raw2["observation"]["ROUTE_SUBJECT"]="mercury"
        i1=h.build_evaluator_input(raw1,self.packet,self.row,self.record,"src","dep"); i2=h.build_evaluator_input(raw2,self.packet,self.row,self.record,"src","dep")
        self.assertNotEqual(i1["observation_sha256"],i2["observation_sha256"])


class FinalizerTests(unittest.TestCase):
    def make_capture(self, td, stage_a="PASS"):
        rows,_,idx=load_fixtures(); row=rows[0]; packet=idx[row["CASE_ID"]]; record=synthetic_binding_record(row,packet)
        raw={"case_id":row["CASE_ID"],"question_exact":packet["target_question_exact"],"locale":packet["locale"],"observation":obs(),"session_state_before_target":session([]),"session_state":session([{"route_domain":"astromodule"}]),"response_headers":{},"served_source_sha":"src","served_deployment_sha":"dep","setup_preconditions_materialized":True,"stage_a_verdict":stage_a,"stage_a_failure_reasons":[],"structural_dimension_results":[]}
        inp=h.build_evaluator_input(raw,packet,(packet.get("source_authority") or {}).get("expected_contract") or row,record,"src","dep")
        out=Path(td); h._write_jsonl(out/"raw-observations.jsonl",[raw]); h._write_jsonl(out/"evaluator-input.jsonl",[inp])
        return row,raw,inp

    def run_final(self, stage_a="PASS", semantic_verdict="PASS", mutate=None):
        td=tempfile.TemporaryDirectory(); out=Path(td.name); row,raw,inp=self.make_capture(out,stage_a)
        records=[] if stage_a!="PASS" else [semantic_result(inp,semantic_verdict)]
        if mutate and records: mutate(records[0])
        sem=out/"semantic.jsonl"; h._write_jsonl(sem,records)
        return td,out,row,raw,inp,sem

    def test_semantic_pass_yields_final_pass(self):
        td,out,_,_,_,sem=self.run_final(); summary=h.finalize_semantic_results(out,sem); self.assertEqual(summary["pass"],1); td.cleanup()
    def test_semantic_fail_yields_final_fail(self):
        td,out,_,_,_,sem=self.run_final(semantic_verdict="FAIL"); summary=h.finalize_semantic_results(out,sem); self.assertEqual(summary["fail"],1); td.cleanup()
    def test_semantic_blocked_yields_final_blocked(self):
        td,out,_,_,_,sem=self.run_final(semantic_verdict="BLOCKED"); summary=h.finalize_semantic_results(out,sem); self.assertEqual(summary["blocked"],1); td.cleanup()
    def test_stage_a_fail_needs_no_semantic_result_and_is_final(self):
        td,out,_,_,_,sem=self.run_final(stage_a="FAIL"); summary=h.finalize_semantic_results(out,sem); self.assertEqual(summary["fail"],1); td.cleanup()
    def test_stage_a_blocked_needs_no_semantic_result_and_is_final(self):
        td,out,_,_,_,sem=self.run_final(stage_a="BLOCKED"); summary=h.finalize_semantic_results(out,sem); self.assertEqual(summary["blocked"],1); td.cleanup()
    def test_missing_semantic_result_for_stage_a_pass_rejected(self):
        td,out,_,_,_,sem=self.run_final(); h._write_jsonl(sem,[])
        with self.assertRaisesRegex(ValueError,"CASE_SET_MISMATCH"): h.finalize_semantic_results(out,sem)
        td.cleanup()
    def test_semantic_hash_mismatch_rejected(self):
        td,out,_,_,_,sem=self.run_final(mutate=lambda r:r.__setitem__("observation_sha256","sha256:bad"))
        with self.assertRaisesRegex(ValueError,"AUTHORITY_HASH_MISMATCH"): h.finalize_semantic_results(out,sem)
        td.cleanup()
    def test_incomplete_dimension_set_rejected(self):
        td,out,_,_,_,sem=self.run_final(mutate=lambda r:r["dimension_results"].pop())
        with self.assertRaisesRegex(ValueError,"DIMENSION_SET_MISMATCH"): h.finalize_semantic_results(out,sem)
        td.cleanup()
    def test_declared_case_verdict_mismatch_rejected(self):
        td,out,_,_,_,sem=self.run_final(mutate=lambda r:r.__setitem__("case_verdict","FAIL"))
        with self.assertRaisesRegex(ValueError,"CASE_VERDICT_MISMATCH"): h.finalize_semantic_results(out,sem)
        td.cleanup()
    def test_semantic_result_cannot_be_supplied_for_stage_a_fail(self):
        td,out,_,_,inp,sem=self.run_final(stage_a="FAIL"); h._write_jsonl(sem,[semantic_result(inp,"PASS")])
        with self.assertRaisesRegex(ValueError,"CASE_SET_MISMATCH"): h.finalize_semantic_results(out,sem)
        td.cleanup()
    def test_finalizer_writes_non_pass_ledger(self):
        td,out,_,_,_,sem=self.run_final(semantic_verdict="FAIL"); h.finalize_semantic_results(out,sem); self.assertTrue((out/"non-pass-ledger.jsonl").exists()); td.cleanup()
    def test_finalizer_does_not_call_browser(self):
        td,out,_,_,_,sem=self.run_final()
        with patch.object(h,"_make_driver",side_effect=AssertionError("browser forbidden")):
            h.finalize_semantic_results(out,sem)
        td.cleanup()


class ScopeAndOutputTests(unittest.TestCase):
    def test_no_product_module_import(self):
        src=HARNESS_PATH.read_text(encoding="utf-8")
        for token in ("from lib.","import lib.","from pages.","from components."):
            self.assertNotIn(token,src)

    def test_no_fixture_write_paths(self):
        src=HARNESS_PATH.read_text(encoding="utf-8")
        self.assertNotIn('open(corpus_path, "w"',src)
        self.assertNotIn('open(packets_path, "w"',src)

    def test_runtime_identity_args_not_frozen_to_deployment(self):
        src=HARNESS_PATH.read_text(encoding="utf-8")
        self.assertIn("--expected-source-sha",src); self.assertIn("--expected-deployment-sha",src)
        self.assertNotIn("EXPECTED_DEPLOYMENT_SHA =",src)

    def test_capture_outputs_created(self):
        with tempfile.TemporaryDirectory() as td:
            out=Path(td); h.write_capture_outputs(out,[],[],{"phase":"STAGE_A_CAPTURE"},{"phase":"STAGE_A_CAPTURE"})
            for name in ("raw-observations.jsonl","evaluator-input.jsonl","stage-a-non-pass-ledger.jsonl","aggregate-summary.json","run-manifest.json"):
                self.assertTrue((out/name).exists(),name)

    def test_output_case_ids_exact_140_fixture_set(self):
        rows,_,_=load_fixtures(); ids={r["CASE_ID"] for r in rows}; self.assertEqual(len(ids),140)

    def test_package_has_one_controlled_selftest_script(self):
        pkg=json.loads((REPO_ROOT/"package.json").read_text(encoding="utf-8"))
        self.assertIn("verify:btc-cosmographer-canonical-140-replay-selftests",pkg["scripts"])

    def test_harness_finalizer_flag_exists(self):
        self.assertIn("--finalize-semantic-results",HARNESS_PATH.read_text(encoding="utf-8"))

    def test_harness_binding_authority_flag_exists(self):
        self.assertIn("--binding-authority-path",HARNESS_PATH.read_text(encoding="utf-8"))

    def test_workflow_supports_bounded_post_merge_harness_repair(self):
        workflow=(REPO_ROOT/".github/workflows/btc-cosmographer-canonical-140-replay-pr.yml").read_text(encoding="utf-8")
        self.assertIn("POST_MERGE_HARNESS_REPAIR_SCOPE=PASS",workflow)
        self.assertIn("CANONICAL_REPLAY_BOOTSTRAP_EXACT_SIX_FILE_SCOPE=PASS",workflow)
        self.assertIn("git cat-file -e",workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
