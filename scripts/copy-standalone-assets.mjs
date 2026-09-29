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

  // Ensure all packages in .pnpm are properly exposed in standalone node_modules
  const standaloneNodeModules = path.join(standaloneDir, "node_modules");
  const pnpmDir = path.join(standaloneNodeModules, ".pnpm");
  if (fs.existsSync(pnpmDir)) {
    try {
      const pnpmEntries = fs.readdirSync(pnpmDir);
      for (const entry of pnpmEntries) {
        const nestedModules = path.join(pnpmDir, entry, "node_modules");
        if (fs.existsSync(nestedModules)) {
          const pkgs = fs.readdirSync(nestedModules);
          for (const pkg of pkgs) {
            if (pkg.startsWith("@")) {
              const scopeDir = path.join(nestedModules, pkg);
              if (fs.existsSync(scopeDir) && fs.statSync(scopeDir).isDirectory()) {
                const scopedPkgs = fs.readdirSync(scopeDir);
                const targetScopeDir = path.join(standaloneNodeModules, pkg);
                if (!fs.existsSync(targetScopeDir)) {
                  fs.mkdirSync(targetScopeDir, { recursive: true });
                }
                for (const scopedPkg of scopedPkgs) {
                  const targetLink = path.join(targetScopeDir, scopedPkg);
                  if (!fs.existsSync(targetLink)) {
                    const relativeSrc = path.relative(path.dirname(targetLink), path.join(scopeDir, scopedPkg));
                    fs.symlinkSync(relativeSrc, targetLink);
                  }
                }
              }
            } else {
              const targetLink = path.join(standaloneNodeModules, pkg);
              if (!fs.existsSync(targetLink)) {
                const relativeSrc = path.relative(path.dirname(targetLink), path.join(nestedModules, pkg));
                fs.symlinkSync(relativeSrc, targetLink);
              }
            }
          }
        }
      }
      console.log("[Standalone] Linked all .pnpm dependencies into standalone node_modules");
    } catch (e) {
      console.warn("[Standalone] Could not link .pnpm dependencies:", e.message);
    }
  }

  // Signal Phusion Passenger to reload application automatically
  const tmpDir = path.join(rootDir, "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  fs.writeFileSync(path.join(tmpDir, "restart.txt"), new Date().toISOString() + "\n");
  console.log("[Standalone] Touched tmp/restart.txt for Passenger reload");
}
