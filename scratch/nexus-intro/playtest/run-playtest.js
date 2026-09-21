#!/usr/bin/env node
/**
 * Programmatic Ink playtest walker for Nexus intro scratch.
 * Uses inkjs Story API; does not invent lore — only asserts implemented gates.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { Story } = require('inkjs');

const ROOT = path.resolve(__dirname, '..');
const STORY_PATH = path.join(ROOT, 'story.json');
const RESULTS_PATH = path.join(__dirname, 'results.json');

function loadStoryJson() {
  let raw = fs.readFileSync(STORY_PATH);
  // Trim UTF-8 BOM if present
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    raw = raw.slice(3);
  }
  return JSON.parse(raw.toString('utf8'));
}

function newStory() {
  return new Story(loadStoryJson());
}

function drain(story) {
  const lines = [];
  const tags = [];
  while (story.canContinue) {
    lines.push(story.Continue().trimEnd());
    if (story.currentTags && story.currentTags.length) {
      tags.push(...story.currentTags);
    }
  }
  return {
    text: lines.join('\n'),
    tags,
    choices: story.currentChoices.map((c, i) => ({ index: i, text: c.text.trim() })),
    vars: {
      active: String(story.variablesState['active']),
      beat1_clear: !!story.variablesState['beat1_clear'],
      beat2_clear: !!story.variablesState['beat2_clear'],
      beat3_clear: !!story.variablesState['beat3_clear'],
      beat4_clear: !!story.variablesState['beat4_clear'],
      beat5_step: Number(story.variablesState['beat5_step']),
      beat5_clear: !!story.variablesState['beat5_clear'],
      idle_hint_shown: !!story.variablesState['idle_hint_shown'],
    },
  };
}

function findChoice(choices, predicate, label) {
  const hit = choices.find(predicate);
  if (!hit) {
    const available = choices.map((c) => c.text).join(' | ') || '(none)';
    throw new Error(`Choice not found: ${label}\nAvailable: ${available}`);
  }
  return hit.index;
}

function chooseByIncludes(story, substr, label) {
  const state = drain(story);
  const idx = findChoice(
    state.choices,
    (c) => c.text.toLowerCase().includes(String(substr).toLowerCase()),
    label || substr
  );
  story.ChooseChoiceIndex(idx);
  return drain(story);
}

function chooseExactish(story, substr) {
  return chooseByIncludes(story, substr, substr);
}

function switchTo(story, characterId) {
  // Enter mode_switch if needed
  let state = drain(story);
  const alreadySwitch =
    state.tags.some((t) => t.includes('ui:mode_switch')) ||
    state.choices.some((c) => /Anne —|Maya —|Eli —|Vibrion —|Keep current/i.test(c.text));

  if (!alreadySwitch) {
    const switchIdx = findChoice(
      state.choices,
      (c) => /switch active character/i.test(c.text) || /switch to vibrion/i.test(c.text),
      'Switch active character'
    );
    story.ChooseChoiceIndex(switchIdx);
    state = drain(story);
  }

  const labels = {
    anne: 'Anne —',
    maya: 'Maya —',
    eli: 'Eli —',
    vibrion: 'Vibrion —',
  };
  const needle = labels[characterId];
  if (!needle) throw new Error(`Unknown character ${characterId}`);

  // If already active, Keep current
  if (state.vars.active === characterId) {
    const keepIdx = findChoice(
      state.choices,
      (c) => /Keep current/i.test(c.text),
      'Keep current'
    );
    story.ChooseChoiceIndex(keepIdx);
    return drain(story);
  }

  const idx = findChoice(
    state.choices,
    (c) => c.text.includes(needle),
    needle
  );
  story.ChooseChoiceIndex(idx);
  return drain(story);
}

function modeSwitchOffers(story) {
  let state = drain(story);
  if (!state.choices.some((c) => /Anne —|Maya —|Eli —|Vibrion —/i.test(c.text))) {
    const switchIdx = findChoice(
      state.choices,
      (c) => /switch active character/i.test(c.text),
      'Switch active character'
    );
    story.ChooseChoiceIndex(switchIdx);
    state = drain(story);
  }
  const offered = {
    anne: state.choices.some((c) => c.text.includes('Anne —')),
    maya: state.choices.some((c) => c.text.includes('Maya —')),
    eli: state.choices.some((c) => c.text.includes('Eli —')),
    vibrion: state.choices.some((c) => c.text.includes('Vibrion —')),
    keep: state.choices.some((c) => /Keep current/i.test(c.text)),
  };
  // count non-active options: should be 3 character + keep = 4, or if somehow all shown
  const charCount = ['anne', 'maya', 'eli', 'vibrion'].filter((k) => offered[k]).length;
  return { offered, charCount, active: state.vars.active, choices: state.choices.map((c) => c.text) };
}

function advanceToBeat1(story) {
  // Start at beat_0
  let state = drain(story);
  // Step into chamber
  story.ChooseChoiceIndex(
    findChoice(state.choices, (c) => /Step into/i.test(c.text), 'Step into')
  );
  state = drain(story);
  // Continue as Vibrion → beat_1
  story.ChooseChoiceIndex(
    findChoice(state.choices, (c) => /Continue as Vibrion/i.test(c.text), 'Continue as Vibrion')
  );
  return drain(story);
}

function clearBeatWithMode(story, beatNum, requiredMode, clearChoiceSubstr) {
  switchTo(story, requiredMode);
  const after = chooseByIncludes(story, clearChoiceSubstr, `beat ${beatNum} clear`);
  return after;
}

const results = [];

function record(id, pass, detail, evidence) {
  const row = { id, pass: !!pass, detail, evidence: evidence || {} };
  results.push(row);
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${id}: ${detail}`);
  return row;
}

function assert(cond, id, detailPass, detailFail, evidence) {
  return record(id, cond, cond ? detailPass : detailFail, evidence);
}

// ——— TESTS ———

function testHappyPath() {
  const story = newStory();
  let state = advanceToBeat1(story);

  // Beat 1 Anne
  state = clearBeatWithMode(story, 1, 'anne', 'Use Foresight');
  assert(
    state.vars.beat1_clear === true,
    'happy.beat1',
    'Beat 1 cleared in Anne mode',
    'Beat 1 did not clear',
    { vars: state.vars }
  );

  // After beat1_done auto mode_switch to beat_2 — pick keep/continue into beat 2
  // clearBeat leaves us at mode_switch(-> beat_2) after done
  // Actually anne clear -> beat_1_done -> mode_switch(-> beat_2)
  // So we're in mode_switch. Keep or switch to maya.
  state = switchTo(story, 'maya');
  // Now on beat_2 with maya
  state = chooseByIncludes(story, 'Use Pattern Sense', 'beat2 clear');
  assert(
    state.vars.beat2_clear === true,
    'happy.beat2',
    'Beat 2 cleared in Maya mode',
    'Beat 2 did not clear',
    { vars: state.vars }
  );

  state = switchTo(story, 'eli');
  state = chooseByIncludes(story, 'Use Kinetic Rush', 'beat3 clear');
  assert(
    state.vars.beat3_clear === true,
    'happy.beat3',
    'Beat 3 cleared in Eli mode',
    'Beat 3 did not clear',
    { vars: state.vars }
  );

  state = switchTo(story, 'vibrion');
  state = chooseByIncludes(story, 'Use Vibrational Manipulation', 'beat4 clear');
  assert(
    state.vars.beat4_clear === true,
    'happy.beat4',
    'Beat 4 cleared in Vibrion mode',
    'Beat 4 did not clear',
    { vars: state.vars }
  );

  // Beat 5: Anne → Maya → Eli → Vibrion
  state = switchTo(story, 'anne');
  assert(state.vars.beat5_step === 0, 'happy.b5.pre', 'At beat5 step 0', 'Not at step 0', {
    vars: state.vars,
  });
  state = chooseByIncludes(story, 'Foresight — mark the timing', 'b5 anne');
  assert(state.vars.beat5_step === 1, 'happy.b5.anne', 'Step → 1 after Anne', 'step not 1', {
    vars: state.vars,
  });

  state = switchTo(story, 'maya');
  state = chooseByIncludes(story, 'Pattern Sense — lock', 'b5 maya');
  assert(state.vars.beat5_step === 2, 'happy.b5.maya', 'Step → 2 after Maya', 'step not 2', {
    vars: state.vars,
  });

  state = switchTo(story, 'eli');
  state = chooseByIncludes(story, 'Kinetic Rush — hit', 'b5 eli');
  assert(state.vars.beat5_step === 3, 'happy.b5.eli', 'Step → 3 after Eli', 'step not 3', {
    vars: state.vars,
  });

  state = switchTo(story, 'vibrion');
  state = chooseByIncludes(story, 'Vibrational Manipulation — power', 'b5 vibrion');
  assert(
    state.vars.beat5_clear === true && /resonance|Entropy is not solved/i.test(state.text),
    'happy.b5.clear',
    'Beat 5 cleared; reached beat 6 resonance tease',
    'Beat 5 did not clear / no beat 6',
    { vars: state.vars, textSnippet: state.text.slice(0, 200) }
  );

  assert(
    !story.canContinue && state.choices.length === 0,
    'happy.end',
    'Story ended after beat 6',
    'Story did not end',
    { canContinue: story.canContinue, choices: state.choices }
  );
}

function testWrongModeBeats1to4() {
  const wrongAttempts = [
    {
      id: 'wrong.beat1',
      setup: (s) => {
        advanceToBeat1(s);
        // start as vibrion — wrong for beat 1
      },
      wrongChoice: 'Press forward without',
      clearFlag: 'beat1_clear',
      stayHint: /Without Foresight|corridor/i,
    },
    {
      id: 'wrong.beat2',
      setup: (s) => {
        advanceToBeat1(s);
        clearBeatWithMode(s, 1, 'anne', 'Use Foresight');
        // after done → mode_switch beat2; keep as anne (wrong for beat2)
        switchTo(s, 'anne');
      },
      wrongChoice: 'Pull levers by guess',
      clearFlag: 'beat2_clear',
      stayHint: /levers fight|Maya/i,
    },
    {
      id: 'wrong.beat3',
      setup: (s) => {
        advanceToBeat1(s);
        clearBeatWithMode(s, 1, 'anne', 'Use Foresight');
        switchTo(s, 'maya');
        chooseByIncludes(s, 'Use Pattern Sense', 'b2');
        switchTo(s, 'maya'); // wrong for beat3
      },
      wrongChoice: 'ordinary pace',
      clearFlag: 'beat3_clear',
      stayHint: /window slams|Eli/i,
    },
    {
      id: 'wrong.beat4',
      setup: (s) => {
        advanceToBeat1(s);
        clearBeatWithMode(s, 1, 'anne', 'Use Foresight');
        switchTo(s, 'maya');
        chooseByIncludes(s, 'Use Pattern Sense', 'b2');
        switchTo(s, 'eli');
        chooseByIncludes(s, 'Use Kinetic Rush', 'b3');
        switchTo(s, 'anne'); // wrong for beat4 (anne/maya get wrong_mode; eli gets partner stub)
      },
      wrongChoice: 'energize the panel alone',
      clearFlag: 'beat4_clear',
      stayHint: /panel stays dead|Vibrion/i,
    },
  ];

  for (const t of wrongAttempts) {
    const story = newStory();
    t.setup(story);
    const before = drain(story);
    const clearedBefore = before.vars[t.clearFlag];
    const after = chooseByIncludes(story, t.wrongChoice, t.id);
    const stillUncleared = after.vars[t.clearFlag] === false || after.vars[t.clearFlag] === clearedBefore;
    const stayed =
      stillUncleared &&
      (t.stayHint.test(after.text) ||
        after.choices.some((c) => /Switch active|hint|Press forward|Pull levers|ordinary|energize|Foresight|Pattern|Kinetic|Vibrational/i.test(c.text)));
    assert(
      stayed && !after.vars[t.clearFlag],
      t.id,
      `Wrong mode fails and stays in beat (flag ${t.clearFlag}=false)`,
      `Wrong mode unexpectedly progressed`,
      { vars: after.vars, textSnippet: after.text.slice(0, 180), choices: after.choices.map((c) => c.text) }
    );
  }

  // Beat 4 Eli partner stub also must not clear
  {
    const story = newStory();
    advanceToBeat1(story);
    clearBeatWithMode(story, 1, 'anne', 'Use Foresight');
    switchTo(story, 'maya');
    chooseByIncludes(story, 'Use Pattern Sense', 'b2');
    switchTo(story, 'eli');
    chooseByIncludes(story, 'Use Kinetic Rush', 'b3');
    switchTo(story, 'eli');
    const after = chooseByIncludes(story, 'Help shoulder the stuck lever', 'eli partner');
    assert(
      !after.vars.beat4_clear,
      'wrong.beat4.eli_partner',
      'Eli partner stub does not clear beat 4',
      'Eli partner incorrectly cleared beat 4',
      { vars: after.vars, textSnippet: after.text.slice(0, 180) }
    );
  }
}

function reachBeat5(story) {
  advanceToBeat1(story);
  clearBeatWithMode(story, 1, 'anne', 'Use Foresight');
  switchTo(story, 'maya');
  chooseByIncludes(story, 'Use Pattern Sense', 'b2');
  switchTo(story, 'eli');
  chooseByIncludes(story, 'Use Kinetic Rush', 'b3');
  switchTo(story, 'vibrion');
  chooseByIncludes(story, 'Use Vibrational Manipulation', 'b4');
  // now mode_switch -> beat_5
  return switchTo(story, 'anne'); // leave at anne on beat5
}

function testBeat5SoloFail() {
  const story = newStory();
  reachBeat5(story);
  const before = drain(story);
  assert(before.vars.beat5_step === 0, 'solo.pre', 'At step 0', 'Not step 0', { vars: before.vars });
  const after = chooseByIncludes(story, 'Force the seal closed from one lens alone', 'solo fail');
  assert(
    !after.vars.beat5_clear && after.vars.beat5_step === 0 && /One lens cannot|Switch through every mode/i.test(after.text),
    'solo.fail',
    'Solo-force fails; stays at step 0; beat5_clear false',
    'Solo-force unexpectedly progressed',
    { vars: after.vars, textSnippet: after.text.slice(0, 220) }
  );
}

function testBeat5WrongOrder() {
  // Attempt Maya first at step 0 (wrong)
  {
    const story = newStory();
    reachBeat5(story);
    switchTo(story, 'maya');
    const after = chooseByIncludes(story, 'Try to mark timing without Foresight', 'wrong maya first');
    assert(
      after.vars.beat5_step === 0 && !after.vars.beat5_clear && /clocks stutter|Anne \(tick\)/i.test(after.text),
      'order.maya_first',
      'Non-Anne at step 0 fails; step stays 0',
      'Wrong first step progressed',
      { vars: after.vars, textSnippet: after.text.slice(0, 200) }
    );
  }

  // Anne then try Eli (skip Maya)
  {
    const story = newStory();
    reachBeat5(story);
    chooseByIncludes(story, 'Foresight — mark the timing', 'anne ok');
    switchTo(story, 'eli');
    const after = chooseByIncludes(story, 'Try to lock sequence out of order', 'skip maya');
    assert(
      after.vars.beat5_step === 1 && !after.vars.beat5_clear,
      'order.skip_maya',
      'Skipping Maya at step 1 keeps step=1',
      'Skip Maya progressed anyway',
      { vars: after.vars, textSnippet: after.text.slice(0, 200) }
    );
  }

  // Anne→Maya then Vibrion (skip Eli)
  {
    const story = newStory();
    reachBeat5(story);
    chooseByIncludes(story, 'Foresight — mark the timing', 'a');
    switchTo(story, 'maya');
    chooseByIncludes(story, 'Pattern Sense — lock', 'm');
    switchTo(story, 'vibrion');
    const after = chooseByIncludes(story, 'Try to hit the window without Rush', 'skip eli');
    assert(
      after.vars.beat5_step === 2 && !after.vars.beat5_clear,
      'order.skip_eli',
      'Skipping Eli at step 2 keeps step=2',
      'Skip Eli progressed',
      { vars: after.vars }
    );
  }

  // Anne→Maya→Eli then Anne again (not Vibrion at step 3)
  {
    const story = newStory();
    reachBeat5(story);
    chooseByIncludes(story, 'Foresight — mark the timing', 'a');
    switchTo(story, 'maya');
    chooseByIncludes(story, 'Pattern Sense — lock', 'm');
    switchTo(story, 'eli');
    chooseByIncludes(story, 'Kinetic Rush — hit', 'e');
    switchTo(story, 'anne');
    const after = chooseByIncludes(story, 'Try to power the seal without coupling', 'wrong power');
    assert(
      after.vars.beat5_step === 3 && !after.vars.beat5_clear,
      'order.wrong_power',
      'Non-Vibrion at step 3 keeps step=3; no clear',
      'Wrong power cleared',
      { vars: after.vars }
    );
  }
}

function testHintStub() {
  const story = newStory();
  advanceToBeat1(story);
  let state = drain(story);
  assert(
    state.vars.idle_hint_shown === false,
    'hint.pre',
    'idle_hint_shown starts false',
    'idle_hint_shown already true',
    { vars: state.vars }
  );
  const hasHint = state.choices.some((c) => /hint stub|accessibility hint/i.test(c.text));
  assert(hasHint, 'hint.available', 'Hint choice present when idle_hint_shown false', 'Hint choice missing', {
    choices: state.choices.map((c) => c.text),
  });
  state = chooseByIncludes(story, 'hint', 'take hint');
  assert(
    state.vars.idle_hint_shown === true && /Hint stub|Try Anne/i.test(state.text),
    'hint.shown',
    'Hint sets idle_hint_shown and shows stub text',
    'Hint did not set flag / no text',
    { vars: state.vars, textSnippet: state.text.slice(0, 200) }
  );
  // After shown, hint choice should vanish
  const afterChoices = state.choices.map((c) => c.text);
  const stillHas = afterChoices.some((c) => /hint stub|accessibility hint/i.test(c));
  assert(
    !stillHas,
    'hint.once',
    'Hint choice removed after idle_hint_shown true',
    'Hint still offered after shown',
    { choices: afterChoices }
  );
}

function testModeSwitchNonSticky() {
  const story = newStory();
  advanceToBeat1(story);
  // Switch anne → maya → eli and verify each time other three + keep offered
  const sequence = ['anne', 'maya', 'eli', 'vibrion', 'anne'];
  for (let i = 0; i < sequence.length; i++) {
    const target = sequence[i];
    switchTo(story, target);
    // Re-open mode switch to inspect offers
    const info = modeSwitchOffers(story);
    const expectedMissing = target; // active should not be in the three optional switches
    const othersPresent = ['anne', 'maya', 'eli', 'vibrion']
      .filter((id) => id !== expectedMissing)
      .every((id) => info.offered[id]);
    const activeAbsentFromSwitch = !info.offered[expectedMissing]; // ink hides current
    assert(
      othersPresent && activeAbsentFromSwitch && info.offered.keep && info.charCount === 3,
      `mode.nonsticky.${i}_${target}`,
      `After switching to ${target}, mode_switch offers other three + Keep (non-sticky)`,
      `Mode switch sticky or incomplete after ${target}`,
      { offered: info.offered, active: info.active, choices: info.choices }
    );
    // Leave mode switch via Keep to continue loop
    chooseByIncludes(story, 'Keep current', 'keep');
  }
}

function estimatePlaytime() {
  // Rough path-length estimate from happy path choice count
  // Beat0: 2 choices, beats1-4: ~2 each (switch+action) + mode screens, beat5: 4 switches+4 actions, beat6: end
  // Count minimum meaningful player decisions on happy path
  const story = newStory();
  let decisions = 0;
  let textChars = 0;
  const log = [];

  function take(substr) {
    const st = drain(story);
    textChars += st.text.length;
    const idx = findChoice(
      st.choices,
      (c) => c.text.toLowerCase().includes(substr.toLowerCase()),
      substr
    );
    story.ChooseChoiceIndex(idx);
    decisions++;
    log.push(substr);
  }

  take('Step into');
  take('Continue as Vibrion');
  // b1
  take('Switch active');
  take('Anne —');
  take('Use Foresight');
  // auto mode_switch after done
  take('Maya —');
  take('Use Pattern Sense');
  take('Eli —');
  take('Use Kinetic Rush');
  take('Vibrion —');
  take('Use Vibrational Manipulation');
  // b5
  take('Anne —');
  take('Foresight — mark');
  take('Maya —');
  take('Pattern Sense — lock');
  take('Eli —');
  take('Kinetic Rush — hit');
  take('Vibrion —');
  take('Vibrational Manipulation — power');

  const st = drain(story);
  textChars += st.text.length;

  // Heuristic: ~20–40 sec reading+choice per decision for short scratch prose;
  // plus mode-switch overhead. Target FOIL 10–15 min.
  const lowMin = Math.round((decisions * 25) / 60);
  const highMin = Math.round((decisions * 45) / 60);
  const note =
    highMin < 10
      ? 'SHORT vs FOIL 10–15m target (scratch prose; expect longer with polished copy + HUD)'
      : lowMin > 15
        ? 'LONG vs FOIL 10–15m target'
        : 'Within / near FOIL 10–15m band depending on reading pace';

  record(
    'playtime.estimate',
    highMin >= 8 && lowMin <= 18, // soft pass near band
    `${note} (~${decisions} decisions, ~${textChars} chars prose; est ${lowMin}–${highMin} min)`,
    {
      decisions,
      textChars,
      estimateMinutes: [lowMin, highMin],
      path: log,
    }
  );
}

function skimPreviewBugs() {
  const html = fs.readFileSync(path.join(ROOT, 'preview', 'index.html'), 'utf8');
  const cumulativeLog = /storyEl\.textContent\s*\+=/.test(html);
  // tagMode is set from #mode: tags; only cleared at let-init, never per-continue → sticky cue
  const stickyCueBranch = /else if \(tagMode && MODE_CUES\[tagMode\]\)/.test(html);
  const assigns = [...html.matchAll(/\btagMode\s*=\s*([^;\n]+)/g)].map((m) => m[0].trim());
  const runtimeClears = assigns.filter((a) => /=\s*null|=\s*undefined/.test(a) && !html.includes('let ' + a));
  // Simpler: no assignment to null inside continueStory / applyTags after init
  const clearsInContinue =
    /function continueStory[\s\S]*?tagMode\s*=\s*null/.test(html) ||
    /function applyTags[\s\S]*?tagMode\s*=\s*null/.test(html);
  const abilityLagLikely = stickyCueBranch && !clearsInContinue;

  // Documented polish findings (pass = bug confirmed present in preview HTML)
  record(
    'preview.bug.cumulative_log',
    cumulativeLog,
    cumulativeLog
      ? 'Confirmed: storyEl.textContent += accumulates mode_switch "Active character" lines'
      : 'Cumulative log pattern not found (unexpected)',
    { severity: 'post-freeze polish' }
  );
  record(
    'preview.bug.hud_ability_lag',
    abilityLagLikely,
    abilityLagLikely
      ? 'Confirmed: tagMode sticky after beat 0 #mode:vibrion; HUD cue branch overrides chip-synced active'
      : 'Could not confirm HUD ability lag from static skim',
    { severity: 'post-freeze polish', stickyCueBranch, clearsInContinue, assigns }
  );
}

// Run all
console.log('=== Nexus Intro Ink Playtest ===\n');
try {
  testHappyPath();
} catch (e) {
  record('happy.path.error', false, e.message, { stack: e.stack });
}
try {
  testWrongModeBeats1to4();
} catch (e) {
  record('wrong.mode.error', false, e.message, { stack: e.stack });
}
try {
  testBeat5SoloFail();
} catch (e) {
  record('solo.error', false, e.message, { stack: e.stack });
}
try {
  testBeat5WrongOrder();
} catch (e) {
  record('order.error', false, e.message, { stack: e.stack });
}
try {
  testHintStub();
} catch (e) {
  record('hint.error', false, e.message, { stack: e.stack });
}
try {
  testModeSwitchNonSticky();
} catch (e) {
  record('mode.error', false, e.message, { stack: e.stack });
}
try {
  estimatePlaytime();
} catch (e) {
  record('playtime.error', false, e.message, { stack: e.stack });
}
try {
  skimPreviewBugs();
} catch (e) {
  record('preview.error', false, e.message, { stack: e.stack });
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log(`\n=== Summary: ${passed} pass / ${failed} fail / ${results.length} total ===`);

fs.writeFileSync(RESULTS_PATH, JSON.stringify({ date: '2026-09-21', passed, failed, results }, null, 2));
console.log(`Wrote ${RESULTS_PATH}`);
process.exit(failed > 0 ? 1 : 0);
