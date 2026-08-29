from pathlib import Path

path = Path('pages/frey.js')
text = path.read_text()
marker = '/* __FREY_PUBLIC_BOUNDARY_VISUAL_LIFT_V0_1__ */'
assert marker in text, 'visual lift marker missing'
pre, post = text.split(marker, 1)

old = 'margin-top: 2px;\npadding: 24px;'
new = 'position: relative;\nmargin-top: 30px;\npadding: 30px 24px 24px;'
assert post.count(old) == 1, f'action block target count={post.count(old)}'
post = post.replace(old, new, 1)

label = '        .freyResultControlsLabel {\nmargin: 8px 0 0;'
anchor = '''        .freyResultControls::before {
content: "Φ";
position: absolute;
top: -21px;
left: 24px;
width: 42px;
height: 42px;
display: grid;
place-items: center;
border-radius: 50%;
border: 1px solid rgba(200,164,90,0.34);
background: #080b12;
color: rgba(200,164,90,0.9);
font: 400 24px/1 Georgia, serif;
box-shadow: 0 10px 28px rgba(0,0,0,0.3), 0 0 24px rgba(154,137,209,0.08);
pointer-events: none;
        }

        .freyResultControls::after {
content: "";
position: absolute;
top: 0;
left: 74px;
right: 24px;
height: 1px;
background: linear-gradient(90deg, rgba(98,168,216,0.42), rgba(154,137,209,0.35), rgba(200,164,90,0.18), transparent);
pointer-events: none;
        }

'''
assert post.count(label) == 1, f'action label target count={post.count(label)}'
post = post.replace(label, anchor + label, 1)

old = '.freyRootResult {\n  padding-top: 70px;\n}'
new = '''.freyRootResult {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-top: 70px;
  padding-left: 14px;
  padding-right: 14px;
  overflow-x: clip;
}'''
assert post.count(old) == 1, f'root mobile target count={post.count(old)}'
post = post.replace(old, new, 1)

old = '.freyMembrane.isResult {\n  width: 100%;\n  padding: 16px;\n  border-radius: 22px;\n}'
new = '''.freyMembrane.isResult {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 16px;
  border-radius: 22px;
  overflow-x: clip;
}'''
assert post.count(old) == 1, f'membrane mobile target count={post.count(old)}'
post = post.replace(old, new, 1)

old = '.freyVoiceMinimal {\n  padding: 24px 18px;\n}'
new = '''.freyVoiceMinimal {
  min-width: 0;
  max-width: 100%;
  padding: 24px 18px;
}'''
assert post.count(old) == 1, f'voice mobile target count={post.count(old)}'
post = post.replace(old, new, 1)

old = '.freyVoiceMinimalState {\n  font-size: clamp(28px, 9vw, 38px);\n}'
new = '''.freyVoiceMinimalState {
  max-width: 100%;
  font-size: clamp(25px, 8vw, 36px);
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: auto;
}'''
assert post.count(old) == 1, f'state mobile target count={post.count(old)}'
post = post.replace(old, new, 1)

nav_target = ''':global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]) {
  left: 0 !important;
  right: 0 !important;
  bottom: 10px !important;
  width: 100% !important;
  opacity: 0.9;
  transform: none;
}'''
safe_mobile = '''.freyResultFlow,
.freyVoiceMinimal,
.freyVoiceMinimalBody,
.freyVoiceMinimalRow,
.freyVoiceMinimalBridge,
.freyVoiceMinimalValue,
.freyInterpretationZone,
.freyResultControls,
.freyGuideRoute,
.freyResultControlsHint {
  min-width: 0;
  max-width: 100%;
}

.freyVoiceMinimalBridge,
.freyVoiceMinimalValue,
.freyResultControlsHint {
  overflow-wrap: anywhere;
  word-break: normal;
}

.freyResultControls {
  padding: 28px 16px 18px;
}

.freyResultControls::before {
  left: 16px;
  width: 38px;
  height: 38px;
  top: -19px;
  font-size: 22px;
}

.freyResultControls::after {
  left: 64px;
  right: 16px;
}

:global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]) {
  position: static !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 28px 0 20px !important;
  padding: 0 14px calc(12px + env(safe-area-inset-bottom)) !important;
  box-sizing: border-box !important;
  opacity: 0.94;
  transform: none;
  z-index: auto !important;
}'''
assert post.count(nav_target) == 1, f'nav mobile target count={post.count(nav_target)}'
post = post.replace(nav_target, safe_mobile, 1)

repaired = pre + marker + post
repair_marker = '__FREY_MOBILE_RESULT_CONTAINMENT_AND_ACTION_ANCHOR_V0_1__'
assert repair_marker not in repaired
repaired = repaired.replace(
    'data-frey-ui-refresh="__FREY_PUBLIC_BOUNDARY_VISUAL_LIFT_V0_1__"',
    'data-frey-ui-refresh="__FREY_PUBLIC_BOUNDARY_VISUAL_LIFT_V0_1__" data-frey-mobile-repair="__FREY_MOBILE_RESULT_CONTAINMENT_AND_ACTION_ANCHOR_V0_1__"',
    1,
)
assert repair_marker in repaired
path.write_text(repaired)
print('FREY_MOBILE_REPAIR_PATCH=PASS')
