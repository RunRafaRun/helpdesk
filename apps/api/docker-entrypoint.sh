#!/bin/sh
set -e

echo "[api] waiting for postgres on db:5432 ..."
# Busybox/Alpine not used; we rely on /dev/tcp (works in bash/sh on Debian's dash? /dev/tcp is bash feature, not dash).
# Use node to test TCP instead (portable on Debian slim).
node - <<'NODE'
const net = require('net');

const host = process.env.DB_HOST || 'db';
const port = Number(process.env.DB_PORT || 5432);

function wait() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host, () => { socket.end(); resolve(true); });
  });
}

(async () => {
  for (let i = 0; i < 60; i++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await wait();
    if (ok) process.exit(0);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.error("[api] timeout waiting for postgres");
  process.exit(1);
})();
NODE

echo "[api] postgres is reachable"
echo "[api] prisma generate"
npx prisma generate

echo "[api] prisma db push (dev bootstrap)"
npx prisma db push --accept-data-loss

echo "[api] seed (idempotent)"
npx ts-node prisma/seed.ts

echo "[api] starting nest (watch mode)"
npm run start:dev
