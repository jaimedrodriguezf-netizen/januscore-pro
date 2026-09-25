// server.js — Entrypoint for Hostinger Shared / Cloud Hosting (Phusion Passenger / LiteSpeed Node.js)
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standalonePath)) {
  const port = process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>JanusCore - Compilación Pendiente en Hostinger</title>
        </head>
        <body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;background:#020617;color:#f8fafc;max-width:680px;margin:0 auto;line-height:1.6;">
          <h2 style="color:#f43f5e;margin-bottom:8px;">⚠️ Compilación pendiente en Hostinger</h2>
          <p style="color:#94a3b8;font-size:14px;">El código se descargó pero falta compilar los archivos standalone de Next.js.</p>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-top:20px;">
            <p style="font-weight:600;margin-top:0;color:#e2e8f0;">Cómo solucionarlo desde tu hPanel:</p>
            <ol style="font-size:13px;color:#cbd5e1;padding-left:20px;">
              <li style="margin-bottom:8px;">Entrá a <b>hPanel de Hostinger</b> &gt; <b>Sitios Web</b> &gt; <b>Administrar</b>.</li>
              <li style="margin-bottom:8px;">Buscá la sección <b>Node.js</b>.</li>
              <li style="margin-bottom:8px;">Hacé clic en <b>Ejecutar Scripts (Build)</b> o ejecutá <code>npm run build</code>.</li>
              <li>Hacé clic en <b>Reiniciar Aplicación</b>.</li>
            </ol>
          </div>
        </body>
      </html>
    `);
  });
  server.listen(port, () => {
    console.warn(`[Hostinger] Standalone build missing. Diagnostic server running on port ${port}.`);
  });
} else {
  try {
    // Delegate to Next.js compiled standalone server
    require('./.next/standalone/server.js');
  } catch (err) {
    console.error('[Hostinger Fatal] Failed to boot Next.js standalone server:', err);
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>JanusCore - Error de Inicio</title>
          </head>
          <body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;background:#020617;color:#f8fafc;max-width:700px;margin:0 auto;line-height:1.6;">
            <h2 style="color:#f43f5e;">❌ Error al iniciar el servidor Node.js</h2>
            <p style="color:#94a3b8;font-size:14px;">Next.js arrojó una excepción durante el arranque:</p>
            <pre style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px;color:#fca5a5;font-size:12px;overflow-x:auto;">${err.stack || err}</pre>
          </body>
        </html>
      `);
    });
    server.listen(port);
  }
}
