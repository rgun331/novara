// Starts the MongoDB wire-compatible dev database.
// Data is saved to devdb/data (SQLite through Node's built-in node:sqlite),
// so accounts, products and orders survive restarts.
//
// Usage:
//   npm start                    # persistent, port 27017
//   npm start -- --memory        # in-memory only (wiped on restart)
//   npm start -- --port 27018
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bin = path.join(root, 'node_modules', '@rckflr', 'easydb-server', 'bin', 'easydb-server.js');

if (!fs.existsSync(bin)) {
  console.error('[devdb] Dependencies are missing. Run "npm install" inside devdb/ first.');
  process.exit(1);
}

let args = process.argv.slice(2);
const memory = args.includes('--memory');
args = args.filter((a) => a !== '--memory');

if (!args.includes('--port') && !args.includes('-p')) args.push('--port', process.env.DEVDB_PORT || '27017');
if (!args.includes('--host')) args.push('--host', '127.0.0.1');
if (!memory && !args.includes('--adapter') && !args.includes('-a')) {
  const dataDir = process.env.DEVDB_DATA || path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  args.push('--adapter', 'sqlite', '--data', dataDir);
}

const child = spawn(process.execPath, ['--no-warnings=ExperimentalWarning', bin, ...args], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
