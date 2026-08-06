from pathlib import Path

runtime_path = Path("lib/btc-cosmographer-evidence-navigation-runtime.ts")
runtime = runtime_path.read_text(encoding="utf-8")

old_signature = '''export function applyBtcRuntimeAntiLoop(
  decision: BtcEvidenceNavigationRuntimeDecision,
  priorNextFingerprints: string[],
  priorClarificationFingerprints: string[],
): BtcEvidenceNavigationRuntimeDecision {'''
new_signature = '''export function applyBtcRuntimeAntiLoop(
  decision: BtcEvidenceNavigationRuntimeDecision,
  priorNextFingerprints: string[],
  priorClarificationFingerprints: string[],
  allowRepeatedRoute = false,
): BtcEvidenceNavigationRuntimeDecision {'''
if runtime.count(old_signature) != 1:
    raise SystemExit(f"runtime signature anchor count={runtime.count(old_signature)}")
runtime = runtime.replace(old_signature, new_signature, 1)

old_gate = '''  if (!repeatedNext && !repeatedClarification) return decision;

  return {
    ...decision,
    route_disposition: "STOP",'''
new_gate = '''  if (!repeatedNext && !repeatedClarification) return decision;

  if (allowRepeatedRoute && repeatedNext && !repeatedClarification) {
    return {
      ...decision,
      show_next_question: false,
      next_question_type: null,
      next_question_text: null,
      next_question_fingerprint: null,
      anti_loop_blocked: false,
      valid_route_stop: true,
      stop_reason: null,
      context_safe_composer: decision.context_safe_composer,
      render_gate: {
        ...decision.render_gate,
        semantic_repeat: true,
      },
    };
  }

  return {
    ...decision,
    route_disposition: "STOP",'''
if runtime.count(old_gate) != 1:
    raise SystemExit(f"runtime gate anchor count={runtime.count(old_gate)}")
runtime_path.write_text(runtime.replace(old_gate, new_gate, 1), encoding="utf-8")

component_path = Path("components/btc/BtcCosmographerDialogue.tsx")
component = component_path.read_text(encoding="utf-8")
old_call = '''            applyBtcRuntimeAntiLoop(
              props.runtimeDecision,
              priorNextFingerprints,
              priorClarificationFingerprints,
            ),'''
new_call = '''            applyBtcRuntimeAntiLoop(
              props.runtimeDecision,
              priorNextFingerprints,
              priorClarificationFingerprints,
              props.route.context_relation === "RETURN_TO_PREVIOUS_TOPIC",
            ),'''
if component.count(old_call) != 1:
    raise SystemExit(f"component call anchor count={component.count(old_call)}")
component_path.write_text(component.replace(old_call, new_call, 1), encoding="utf-8")

Path(__file__).unlink()
