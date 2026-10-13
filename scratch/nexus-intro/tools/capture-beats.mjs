#!/usr/bin/env node
/**
 * Nexus intro render harness: drives the playable through Ink choices (rail buttons)
 * in headless Chromium with SwiftShader WebGL and captures a still per beat / lens.
 *
 * Usage: node tools/capture-beats.mjs <baseUrl> <outDir> [desktop|phone|both] [--tap]
 * Needs Playwright (not a project dependency): npm i --no-save playwright && npx playwright install chromium
 * Use ?dtcap=1 on the URL so SwiftShader (~1 fps) advances animations in real time.
 *   --tap  drive beats 1–5 by tapping chamber props (window.__nexusDebug.propScreenPoint)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , baseUrl = 'http://localhost:4173/', outDir = './shots', which = 'both', ...flags] = process.argv;
const useTap = flags.includes('--tap');
const SETTLE_MS = Number(process.env.SETTLE_MS || 2600);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const STEPS = [
  { shot: '00-beat0-arrive' },
  { click: /Step into the Nexus chamber/ },
  { click: /Switch active character before moving on/ },
  { click: /^Anne — Foresight/ },
  { shot: '01-beat1-anne', },
  { click: /Use Foresight/, tapProp: 'corridor' },
  { click: /^Maya — Pattern Sense/ },
  { shot: '02-beat2-maya' },
  { click: /Use Pattern Sense/, tapProp: 'levers' },
  { click: /^Eli — Kinetic Rush/ },
  { shot: '03-beat3-eli' },
  { click: /Use Kinetic Rush/, tapProp: 'levers' },
  { click: /^Vibrion — Vibrational Manipulation/ },
  { shot: '04-beat4-vibrion' },
  { click: /Use Vibrational Manipulation/, tapProp: 'panel' },
  { click: /^Anne — Foresight/ },
  { shot: '05-beat5-step0-anne', settle: 1.6 },
  { click: /Force the seal closed from one lens alone/ },
  { shot: '05b-beat5-solo-fail', settle: 0.25 },
  { click: /Foresight — mark the timing tick/, tapProp: 'clocks' },
  { click: /^Maya — Pattern Sense/ },
  { shot: '06-beat5-step1-maya' },
  { click: /Pattern Sense — lock the sequence/, tapProp: 'clocks' },
  { click: /^Eli — Kinetic Rush/ },
  { shot: '07-beat5-step2-eli' },
  { click: /Kinetic Rush — hit the sync window/, tapProp: 'clocks' },
  { click: /^Vibrion — Vibrational Manipulation/ },
  { shot: '08-beat5-step3-vibrion' },
  { click: /Vibrational Manipulation — power the seal/, tapProp: 'clocks' },
  { shot: '09-beat6-resonance', settle: 1.6 },
];

async function clickChoice(page, re) {
  const buttons = page.locator('#choices button');
  const n = await buttons.count();
  const texts = [];
  for (let i = 0; i < n; i++) {
    const t = (await buttons.nth(i).innerText()).trim();
    texts.push(t);
    if (re.test(t)) {
      await buttons.nth(i).click();
      return t;
    }
  }
  throw new Error(`No choice matching ${re} — have: ${JSON.stringify(texts)}`);
}

async function tapProp(page, prop) {
  const pt = await page.evaluate((p) => window.__nexusDebug?.propScreenPoint?.(p) ?? null, prop);
  if (!pt) throw new Error(`No screen point for prop ${prop}`);
  await page.mouse.click(pt.x, pt.y);
  return pt;
}

async function run(kind) {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    await capture(browser, kind);
  } finally {
    // Always release Chromium, including when a step or screenshot throws.
    await browser.close();
  }
}

async function capture(browser, kind) {
  const dir = join(outDir, kind);
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: VIEWPORTS[kind].width, height: VIEWPORTS[kind].height }, ...VIEWPORTS[kind] });
  const page = await context.newPage();
  const consoleLog = [];
  page.on('console', (m) => consoleLog.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => consoleLog.push(`[pageerror] ${e.message}`));

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#choices button', { timeout: 30000 });
  const gl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('webgl2') || c.getContext('webgl');
    if (!ctx) return null;
    const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
    return dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'webgl (no debug info)';
  });
  await page.waitForTimeout(SETTLE_MS);

  const log = { kind, gl, steps: [], fps: null };
  for (const step of STEPS) {
    if (step.shot) {
      await page.waitForTimeout(SETTLE_MS * (step.settle ?? 1));
      const file = join(dir, `${step.shot}.png`);
      await page.screenshot({ path: file });
      const hud = await page.evaluate(() => ({
        beat: document.getElementById('hud-beat')?.textContent,
        line: document.getElementById('narrative-line')?.textContent,
        mode: document.getElementById('app')?.dataset.mode,
        choices: [...document.querySelectorAll('#choices button')].map((b) => b.textContent.trim()),
      }));
      log.steps.push({ shot: step.shot, ...hud });
      console.log(`[${kind}] shot ${step.shot} beat=${hud.beat} mode=${hud.mode}`);
    } else if (step.click) {
      if (useTap && step.tapProp) {
        const before = await page.evaluate(() => JSON.stringify(window.__nexusDebug.state().choices.map((c) => c.text)));
        const pt = await tapProp(page, step.tapProp);
        await page.waitForTimeout(150);
        const after = await page.evaluate(() => JSON.stringify(window.__nexusDebug.state().choices.map((c) => c.text)));
        if (before === after) throw new Error(`Tap on ${step.tapProp} did not advance Ink (expected ${step.click})`);
        log.steps.push({ tap: step.tapProp, pt });
        console.log(`[${kind}] tapped ${step.tapProp} at ${Math.round(pt.x)},${Math.round(pt.y)}`);
      } else {
        const t = await clickChoice(page, step.click);
        log.steps.push({ clicked: t });
      }
      await page.waitForTimeout(350);
    }
  }

  log.fps = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    function tick() {
      frames++;
      if (performance.now() - start < 2000) requestAnimationFrame(tick);
      else resolve(+(frames / ((performance.now() - start) / 1000)).toFixed(1));
    }
    requestAnimationFrame(tick);
  }));
  log.console = consoleLog;
  writeFileSync(join(dir, 'log.json'), JSON.stringify(log, null, 2));
  console.log(`[${kind}] renderer=${gl} fps(swiftshader)=${log.fps} console_errors=${consoleLog.filter((l) => /error/i.test(l)).length}`);
}

if (which !== 'both' && !Object.prototype.hasOwnProperty.call(VIEWPORTS, which)) {
  console.error(`Unknown viewport "${which}". Use one of: both, ${Object.keys(VIEWPORTS).join(', ')}.`);
  console.error('Usage: node tools/capture-beats.mjs <baseUrl> <outDir> [desktop|phone|both] [--tap]');
  process.exit(2);
}
const kinds = which === 'both' ? Object.keys(VIEWPORTS) : [which];
for (const k of kinds) {
  await run(k);
}
