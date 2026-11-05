#!/usr/bin/env node
/**
 * Open-room play-through capture for the Nexus intro playable.
 * Plays the episode the way a player does — tap places in the chamber, tap portraits, tap what is
 * lit, drag portraits into the gate plan, press Sync — in headless Chromium (SwiftShader WebGL),
 * and saves a still at each moment worth reviewing.
 *
 * Usage: node capture-play.mjs <url> <outDir> [desktop|phone|both]
 *   url    dev server or preview, e.g. http://localhost:4173/?quality=high&dtcap=1
 *          (the debug hook is on in dev; add &debug for a production build)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , url = 'http://localhost:4173/?quality=high&dtcap=1', outDir = './captures', which = 'both'] = process.argv;
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function run(kind) {
  const dir = join(outDir, kind);
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  try {
    await play(kind, dir, browser);
  } finally {
    await browser.close();
  }
}

async function play(kind, dir, browser) {
  const context = await browser.newContext(VIEWPORTS[kind]);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const touch = VIEWPORTS[kind].hasTouch;
  const log = [];

  const view = () => page.evaluate(() => window.__nexusDebug.view());
  const until = (fn, arg, timeout = 20000) => page.waitForFunction(fn, arg, { timeout, polling: 100 });
  const settle = async (extra = 700) => {
    await until(() => window.__nexusDebug.settled(), null, 12000).catch(() => {});
    await page.waitForTimeout(extra);
    // Let subtitle / portrait CSS animations land (software GL runs the page at ~1 fps).
    await page
      .evaluate(() => Promise.race([
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, 4000)),
      ]))
      .catch(() => {});
  };
  const shot = async (name, extra) => {
    await settle(extra);
    const v = await view();
    const line = await page.evaluate(() => window.__nexusDebug.line());
    log.push({ name, at: v.at, lens: v.lens, line: line ? `${line.speaker}: ${line.text}` : null });
    await page.screenshot({ path: join(dir, `${name}.png`) });
  };
  const tapAt = async ({ x, y }) => {
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
  };
  const tapProp = async (id) => {
    if ((await view()).at === 'room') {
      // Narrow screens crop the room: let the camera arrive, then look toward the place.
      await until(() => window.__nexusDebug.settled(), null, 15000).catch(() => {});
      await page.evaluate((p) => window.__nexusDebug.panToPlace(p), id);
    }
    // Software GL can take over a second per frame, so a point only counts as still once it has
    // held across several polls.
    const { width } = page.viewportSize();
    let p = null;
    for (let i = 0, last = null, still = 0; i < 40 && still < 2; i++) {
      await page.waitForTimeout(700);
      p = await page.evaluate((p) => window.__nexusDebug.propScreenPoint(p), id);
      const inside = p && p.x > 16 && p.x < width - 16;
      still = inside && last && Math.hypot(p.x - last.x, p.y - last.y) < 2 ? still + 1 : 0;
      last = p;
    }
    if (!p) throw new Error(`no screen point for ${id}`);
    await tapAt(p);
  };
  const portrait = async (id) => {
    await page.locator(`.team .portrait[data-id="${id}"]`).click();
    await page.waitForTimeout(250);
  };
  const enter = async (id) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await tapProp(id);
      const ok = await until((p) => window.__nexusDebug.view().at === p, id, 10000).then(() => true, () => false);
      if (ok) return;
    }
    throw new Error(`could not walk up to ${id}`);
  };
  /** Let the current lines play (tap the subtitle to skip) until the player is back in the room. */
  const finishPlace = async () => {
    for (let i = 0; i < 12; i++) {
      if ((await view()).at === 'room') return;
      await page.locator('#subtitle').click().catch(() => {});
      await page.waitForTimeout(400);
    }
    await until(() => window.__nexusDebug.view().at === 'room');
  };
  const dragToSlot = async (id, slot) => {
    const from = await page.locator(`.team .portrait[data-id="${id}"] img`).boundingBox();
    const to = await page.locator(`.slot[data-slot="${slot}"]`).boundingBox();
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + from.width / 2 + 10, from.y - 10, { steps: 3 });
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);
  };
  const playUntilIdle = async () => {
    await page.locator('#sync-btn').click();
    await until(() => !window.__nexusDebug.playing(), null, 40000);
  };

  await page.goto(url, { waitUntil: 'networkidle' });
  await until(() => window.__nexusDebug?.view?.());
  await shot('00-room-arrive', 2200);
  if (kind === 'desktop') {
    // Each lens in the room: Anne's branches skip the outlier, Maya's sequence skips it,
    // Eli's streaks slow past it, Vibrion's grid bends around it.
    for (const id of ['anne', 'maya', 'eli', 'vibrion']) {
      await portrait(id);
      await shot(`00d-room-${id}`, 900);
    }
  }
  if (kind === 'phone') {
    await page.locator('#pan-left').click();
    await shot('00b-room-look-left', 1400);
    await page.locator('#pan-right').click();
    await page.locator('#pan-right').click();
    await shot('00c-room-look-right', 1400);
  }

  // Hazard corridor: Vibrion looks first (nothing lit), then Anne.
  await enter('corridor');
  await shot('01-corridor-vibrion');
  await portrait('anne');
  await shot('02-corridor-anne-lit');
  await tapProp('corridor');
  await shot('03-corridor-crossed', 300);
  await finishPlace();

  // Echo levers: Maya marks, Eli throws.
  await portrait('maya');
  await enter('levers');
  await shot('04-levers-maya');
  await tapProp('levers');
  await page.waitForTimeout(500);
  await shot('05-levers-marked', 300);
  await portrait('eli');
  await shot('06-levers-eli-lit');
  await tapProp('levers');
  await finishPlace();

  // Dead panel: Eli looks first (nothing to shove yet), Vibrion couples, Eli shoves.
  await enter('panel');
  await shot('07-panel-eli');
  await portrait('vibrion');
  await shot('08-panel-vibrion-lit');
  await tapProp('panel');
  await page.waitForTimeout(600);
  await portrait('eli');
  await shot('09-panel-eli-jam');
  await tapProp('panel');
  await finishPlace();

  // Coordination gate: a wrong plan first, then the right one.
  await enter('gate');
  await shot('10-gate-empty-plan');
  // The gate read in other eyes: Maya hears the corridor in the first clock, Anne calls its tick.
  await portrait('maya');
  await shot('10b-gate-maya');
  await portrait('anne');
  await shot('10c-gate-anne');
  for (const [slot, id] of ['anne', 'eli', 'maya', 'vibrion'].entries()) await dragToSlot(id, slot);
  await shot('11-gate-wrong-plan', 300);
  await page.locator('#sync-btn').click();
  await until(() => document.querySelector('.slot[data-result="break"]'), null, 20000);
  await shot('12-gate-break', 200);
  await until(() => !window.__nexusDebug.playing(), null, 40000);
  await dragToSlot('maya', 1);
  await dragToSlot('eli', 2);
  await page.locator('#sync-btn').click();
  await until(() => document.querySelectorAll('.slot[data-result="ok"]').length >= 2, null, 20000);
  await shot('13-gate-playing', 100);
  await until(() => window.__nexusDebug.view().at === 'end', null, 40000);
  await shot('14-gate-sealed-resonance', 1500);
  // Maya's last line turns the camera to the crystal that did not sing.
  await until(() => window.__nexusDebug.shot() === 'outlier', null, 60000)
    .then(() => shot('14b-end-outlier', 1200))
    .catch(() => console.log(`[${kind}] no outlier shot`));
  await until(() => !document.getElementById('ending').hidden, null, 60000).catch(async () => {
    for (let i = 0; i < 8; i++) await page.locator('#subtitle').click().catch(() => {});
  });
  await shot('15-end', 800);

  const quality = await page.evaluate(() => window.__nexusDebug.quality());
  writeFileSync(join(dir, 'log.json'), JSON.stringify({ quality, errors, shots: log }, null, 2));
  console.log(`[${kind}] ${log.length} shots, quality=${quality}, errors=${errors.length}`);
  errors.slice(0, 5).forEach((e) => console.log(`  ! ${e}`));
}

for (const kind of which === 'both' ? ['desktop', 'phone'] : [which]) await run(kind);
