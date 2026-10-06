// Starts the in-memory MongoDB-compatible dev database.
// Usage: npm start -- --port 27017
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bin = path.join(root, 'node_modules', '@rckflr', 'easydb-server', 'bin', 'easydb-server.js');
const args = process.argv.slice(2);
if (!args.includes('--port') && !args.includes('-p')) args.push('--port', process.env.DEVDB_PORT || '27017');
if (!args.includes('--host')) args.push('--host', '127.0.0.1');
const child = spawn(process.execPath, [bin, ...args], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
