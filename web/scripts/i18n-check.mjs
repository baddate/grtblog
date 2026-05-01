// CI-only check — delegates to merge script's built-in validation
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPO_ROOT = join(ROOT, '..');

const langs = ['zh', 'en'];
let errors = 0;

// Check common locale files exist
for (const lang of langs) {
  const commonPath = join(REPO_ROOT, 'locales', lang, 'common.json');
  if (!existsSync(commonPath)) {
    console.error(`[i18n-check] Missing: ${commonPath}`);
    errors++;
  }
}

// Check web locale files exist
for (const lang of langs) {
  const webPath = join(ROOT, 'src', 'locales', lang, 'web.json');
  if (!existsSync(webPath)) {
    console.error(`[i18n-check] Missing: ${webPath}`);
    errors++;
  }
}

// Run merge (which also validates keys, symmetry, placeholders)
try {
  execSync('node scripts/merge-locales.mjs', {
    cwd: ROOT,
    stdio: 'pipe',
  });
} catch (e) {
  console.error('[i18n-check] Merge/validation failed');
  console.error(e.stderr?.toString() || e.message);
  errors++;
}

if (errors > 0) {
  console.error(`[i18n-check] ${errors} error(s) found`);
  process.exit(1);
}

console.log('[i18n-check] All checks passed');
