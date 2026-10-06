// One command to run the whole stack locally:
//   npm run dev
// 1. Installs dependencies for devdb, server and client if they are missing.
// 2. Starts the dev database (unless MONGODB_URI points somewhere else), the API and the Vite app.
// 3. Restarts any of them if it crashes, and stops everything on Ctrl+C.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const useDevDb = !process.env.MONGODB_URI || /127\.0\.0\.1|localhost/.test(process.env.MONGODB_URI);

const COLORS = { db: '\x1b[33m', api: '\x1b[36m', web: '\x1b[32m', dev: '\x1b[35m' };
const log = (tag, line) => process.stdout.write(`${COLORS[tag] || ''}[${tag}]\x1b[0m ${line}\n`);

function ensureDeps(dir) {
  const cwd = path.join(root, dir);
  if (fs.existsSync(path.join(cwd, 'node_modules'))) return;
  log('dev', `Installing dependencies in ${dir}/ ...`);
  const r = spawnSync(npm, ['install', '--no-audit', '--no-fund'], { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    log('dev', `npm install failed in ${dir}/`);
    process.exit(1);
  }
}

function portOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const s = net.connect(port, host);
    s.once('connect', () => (s.end(), resolve(true)));
    s.once('error', () => resolve(false));
  });
}

async function waitForPort(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const children = new Map();
let stopping = false;

function run(tag, dir, args, env = {}) {
  const child = spawn(npm, args, { cwd: path.join(root, dir), env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  children.set(tag, child);
  const pipe = (stream) => {
    let buf = '';
    stream.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      lines.filter((l) => l.trim()).forEach((l) => log(tag, l));
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('exit', (code) => {
    children.delete(tag);
    if (stopping) return;
    log('dev', `${tag} exited (${code}). Restarting in 2s...`);
    setTimeout(() => run(tag, dir, args, env), 2000);
  });
}

function shutdown() {
  stopping = true;
  for (const c of children.values()) c.kill('SIGTERM');
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

const dirs = ['server', 'client', ...(useDevDb ? ['devdb'] : [])];
dirs.forEach(ensureDeps);

if (useDevDb) {
  if (await portOpen(27017)) {
    log('dev', 'A database is already listening on 27017, using it.');
  } else {
    run('db', 'devdb', ['start']);
    if (!(await waitForPort(27017))) log('dev', 'Dev database did not open port 27017 in time.');
  }
}

run('api', 'server', ['run', 'dev'], { JWT_SECRET: process.env.JWT_SECRET || 'novara-local-dev-secret' });
await waitForPort(5000, 30000);
run('web', 'client', ['run', 'dev']);
