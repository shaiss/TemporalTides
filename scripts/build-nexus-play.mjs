#!/usr/bin/env node
/**
 * Production bundle: copy scratch/nexus-intro Vite build into VitePress dist at /play/.
 * Invoked after `vitepress build` on Vercel (see root package.json + vercel.json).
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scratch = join(root, 'scratch', 'nexus-intro');
const dest = join(root, '.vitepress', 'dist', 'play');

console.log('[build-nexus-play] installing scratch dependencies…');
execSync('npm install', { cwd: scratch, stdio: 'inherit' });

console.log('[build-nexus-play] building chamber playable (base /play/)…');
execSync('npm run build', {
  cwd: scratch,
  stdio: 'inherit',
  env: { ...process.env, VITE_BASE: '/play/' },
});

if (!existsSync(join(scratch, 'dist', 'index.html'))) {
  console.error('[build-nexus-play] missing scratch/nexus-intro/dist/index.html');
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
mkdirSync(dest, { recursive: true });
cpSync(join(scratch, 'dist'), dest, { recursive: true });

console.log('[build-nexus-play] copied to .vitepress/dist/play/');
