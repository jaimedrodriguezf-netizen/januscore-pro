// server.js — Entrypoint for Hostinger Shared / Cloud Hosting (Phusion Passenger / LiteSpeed Node.js)
const fs = require('fs');
const path = require('path');
const http = require('http');

const rootLogFile = path.join(__dirname, 'crash.txt');
const publicLogFile = path.join(__dirname, 'public', 'crash.txt');

function logCrash(type, payload) {
  try {
    const timestamp = new Date().toISOString();
    const detail = payload && payload.stack ? payload.stack : typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const msg = `[${timestamp}] [${type}] ${detail}\n`;
    fs.writeFileSync(rootLogFile, msg, { flag: 'a' });
    if (fs.existsSync(path.join(__dirname, 'public'))) {
      fs.writeFileSync(publicLogFile, msg, { flag: 'a' });
    }
  } catch (_) {}
}

logCrash('BOOT', `server.js booting on Node ${process.version} (CWD: ${process.cwd()}, DIR: ${__dirname}, PORT: ${process.env.PORT || 3000})`);

// Intercept console.error and console.warn to capture Next.js runtime logs
const origConsoleError = console.error;
console.error = function (...args) {
  try {
    const text = args
      .map((a) => (a && a.stack ? a.stack : typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ');
    logCrash('CONSOLE_ERROR', text);
  } catch (_) {}
  origConsoleError.apply(console, args);
};

const origConsoleWarn = console.warn;
console.warn = function (...args) {
  try {
    const text = args
      .map((a) => (a && a.stack ? a.stack : typeof a === 'object' ? JSON.stringify(a) : String(a)))
      .join(' ');
    logCrash('CONSOLE_WARN', text);
  } catch (_) {}
  origConsoleWarn.apply(console, args);
};

process.on('uncaughtException', (err) => {
  logCrash('UNCAUGHT_EXCEPTION', err);
});

process.on('unhandledRejection', (err) => {
  logCrash('UNHANDLED_REJECTION', err);
});

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');

function serveDiagnostic(statusCode, title, messageHtml) {
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    if (req.url === '/crash.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      try {
        res.end(fs.readFileSync(rootLogFile, 'utf8'));
      } catch {
        res.end(`No log file available at ${rootLogFile}`);
      }
      return;
    }

    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>JanusCore Pro — ${title}</title>
        </head>
        <body style="font-family:system-ui,-apple-system,sans-serif;padding:32px 20px;background:#090d16;color:#f1f5f9;max-width:720px;margin:0 auto;line-height:1.6;">
          <div style="background:#1e1b4b;border:1px solid #4338ca;border-radius:12px;padding:24px;margin-bottom:24px;">
            <h2 style="color:#a5b4fc;margin:0 0 12px 0;font-size:20px;">${title}</h2>
            ${messageHtml}
          </div>
          <p style="margin-top:20px;font-size:12px;color:#64748b;">JanusCore Pro &bull; Node ${process.version} &bull; <a href="/crash.txt" style="color:#818cf8;">Ver log de diagnóstico completo</a></p>
        </body>
      </html>
    `);
  });

  server.listen(port, () => {
    logCrash('FALLBACK_SERVER_LISTENING', `Diagnostic HTTP server listening on port ${port}`);
  });
}

if (!fs.existsSync(standalonePath)) {
  const missingMsg = `Standalone build missing: ${standalonePath} no existe.`;
  logCrash('MISSING_BUILD', missingMsg);

  serveDiagnostic(
    503,
    '⚠️ Compilación pendiente en Hostinger',
    `
      <p style="margin:0 0 12px 0;color:#c7d2fe;font-size:14px;">El código fuente se sincronizó correctamente, pero falta compilar los archivos standalone de Next.js en el servidor.</p>
      <p style="margin:0 0 16px 0;font-size:13px;color:#94a3b8;"><b>Ruta buscada:</b> <code>${standalonePath}</code></p>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;">
        <h3 style="margin-top:0;font-size:15px;color:#e2e8f0;">Cómo solucionarlo desde tu hPanel de Hostinger:</h3>
        <ol style="font-size:14px;color:#cbd5e1;padding-left:20px;margin-bottom:0;">
          <li style="margin-bottom:8px;">Entrá a <b>hPanel &gt; Sitios Web &gt; Administrar</b>.</li>
          <li style="margin-bottom:8px;">Buscá la sección <b>Node.js</b>.</li>
          <li style="margin-bottom:8px;">Verificá que la versión sea <b>Node.js 20.x o superior</b>.</li>
          <li style="margin-bottom:8px;">Hacé clic en <b>Ejecutar script de Build</b> (o ejecutá <code>npm run build</code> o <code>pnpm run build</code>).</li>
          <li>Hacé clic en <b>Reiniciar Aplicación</b>.</li>
        </ol>
      </div>
    `
  );
} else {
  try {
    logCrash('REQUIRE_STANDALONE', `Loading Next.js standalone server from ${standalonePath}`);
    require(standalonePath);
    logCrash('BOOT_SUCCESS', 'Next.js standalone server initialized successfully');
  } catch (err) {
    const errStack = err && err.stack ? err.stack : String(err);
    logCrash('REQUIRE_FATAL', errStack);

    serveDiagnostic(
      500,
      '❌ Error al iniciar Next.js Standalone',
      `
        <p style="color:#fca5a5;font-size:14px;">Next.js falló durante el arranque con la siguiente excepción:</p>
        <pre style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;color:#fca5a5;font-size:12px;overflow-x:auto;white-space:pre-wrap;">${errStack}</pre>
      `
    );
  }
}
