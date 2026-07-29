import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendPort = 4000;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
  });
}

const frontend = spawn(process.execPath, [path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js')], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
});

let backend = null;

async function startBackend() {
  const isOpen = await isPortOpen(backendPort);
  if (isOpen) {
    console.log('Backend already running on port 4000; skipping duplicate launch.');
    return;
  }

  backend = spawn(process.execPath, [path.join(rootDir, 'server', 'src', 'server.js')], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });

  backend.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`Backend exited with code ${code}.`);
    }
  });
}

const shutdown = () => {
  frontend.kill('SIGTERM');
  if (backend) {
    backend.kill('SIGTERM');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

frontend.on('exit', (code) => {
  if (backend) {
    backend.kill('SIGTERM');
  }
  process.exit(code ?? 0);
});

startBackend().catch((error) => {
  console.error(error);
  frontend.kill('SIGTERM');
  process.exit(1);
});
