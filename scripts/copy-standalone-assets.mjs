import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");

if (fs.existsSync(standaloneDir)) {
  const publicSrc = path.join(rootDir, "public");
  const publicDest = path.join(standaloneDir, "public");
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
    console.log("[Standalone] Copied public/ -> .next/standalone/public/");
  }

  const staticSrc = path.join(rootDir, ".next", "static");
  const staticDest = path.join(standaloneDir, ".next", "static");
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
    console.log("[Standalone] Copied .next/static/ -> .next/standalone/.next/static/");
  }

  // Ensure @swc helpers are linked in standalone node_modules for Turbopack runtime
  const standaloneNodeModules = path.join(standaloneDir, "node_modules");
  const pnpmSwc = path.join(standaloneNodeModules, ".pnpm", "node_modules", "@swc");
  const targetSwc = path.join(standaloneNodeModules, "@swc");
  if (fs.existsSync(pnpmSwc) && !fs.existsSync(targetSwc)) {
    try {
      fs.symlinkSync(".pnpm/node_modules/@swc", targetSwc);
      console.log("[Standalone] Linked @swc -> .pnpm/node_modules/@swc");
    } catch (e) {
      console.warn("[Standalone] Could not symlink @swc:", e.message);
    }
  }
}

