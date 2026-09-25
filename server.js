// server.js — Entrypoint for Hostinger Shared / Cloud Hosting (Phusion Passenger / LiteSpeed Node.js)
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'public', 'crash.txt');

function logCrash(type, err) {
  try {
    const msg = `[${new Date().toISOString()}] ${type}: ${err && err.stack ? err.stack : err}\n`;
    fs.writeFileSync(logFile, msg, { flag: 'a' });
  } catch (_) {}
}

logCrash('BOOT', `server.js starting Node ${process.version} PORT=${process.env.PORT} CWD=${process.cwd()}`);

process.on('uncaughtException', (err) => {
  logCrash('UNCAUGHT_EXCEPTION', err);
});

process.on('unhandledRejection', (err) => {
  logCrash('UNHANDLED_REJECTION', err);
});

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

try {
  require('./.next/standalone/server.js');
  logCrash('BOOT_SUCCESS', 'require standalone/server.js loaded successfully');
} catch (err) {
  logCrash('REQUIRE_ERROR', err);
  throw err;
}
