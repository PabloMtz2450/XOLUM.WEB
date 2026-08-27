import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import AdmZip from 'adm-zip';

const ROOT = process.cwd();
const BUNDLE = path.join(ROOT, 'production', 'XOLUM_RUNTIME_BASE_GITOPT_2026-08-25.zip');
const OUT = path.join(ROOT, '.xolum-prod');
const EXPECTED_SHA256 = 'dca475cf39aa50e8f6a3ed084649a9a8505beb6c8cad8917ddeb31c2d3ee1a5e';

function fail(message, code = 1) {
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

function copyFile(relativeSource, relativeDestination) {
  const source = path.join(ROOT, relativeSource);
  const destination = path.join(OUT, relativeDestination);
  if (!fs.existsSync(source)) fail(`falta archivo requerido: ${relativeSource}`, 45);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function containsTextRecursive(baseDir, needle, predicate = () => true) {
  const stack = [baseDir];
  while (stack.length) {
    const current = stack.pop();
    if (!fs.existsSync(current)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!predicate(full)) continue;
      let text;
      try {
        text = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      if (text.includes(needle)) return full;
    }
  }
  return null;
}

function runValidator(relativePath) {
  const script = path.join(OUT, relativePath);
  if (!fs.existsSync(script)) fail(`falta validador ${relativePath}`, 46);
  const result = spawnSync(process.execPath, [script], {
    cwd: OUT,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) fail(`no fue posible ejecutar ${relativePath}: ${result.error.message}`, 47);
  if (result.status !== 0) process.exit(result.status ?? 48);
}

if (!fs.existsSync(BUNDLE)) {
  fail('falta production/XOLUM_RUNTIME_BASE_GITOPT_2026-08-25.zip. Se cancela el build para impedir un despliegue incompleto.', 42);
}

const actualSha = crypto.createHash('sha256').update(fs.readFileSync(BUNDLE)).digest('hex');
console.log(`SHA-256 bundle: ${actualSha}`);
if (actualSha !== EXPECTED_SHA256) {
  fail(`checksum inválido. Esperado ${EXPECTED_SHA256}; recibido ${actualSha}.`, 49);
}
console.log('SHA-256 bundle: OK');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

try {
  new AdmZip(BUNDLE).extractAllTo(OUT, true);
} catch (error) {
  fail(`no fue posible extraer el bundle: ${error.message}`, 50);
}

const requiredAfterExtract = [
  'public',
  path.join('netlify', 'functions'),
  path.join('netlify', 'edge-functions'),
  'tools',
];
for (const item of requiredAfterExtract) {
  if (!fs.existsSync(path.join(OUT, item))) fail(`el bundle no contiene ${item}`, 51);
}

// Overlay de configuración, Home, productos web y validadores gobernados por XOLUM.WEB.
// La Home se superpone explícitamente para que la mejora visual validada en preview sea
// exactamente la que llega al candidato productivo, sin alterar lógica de negocio.
// El netlify.toml raíz debe sustituir la copia histórica incluida en el bundle para
// que el candidato validado y la configuración usada por Netlify sean idénticos.
const overlays = [
  ['netlify.toml', 'netlify.toml'],
  ['preview/index.html', 'public/index.html'],
  ['preview/styles.css', 'public/styles.css'],
  ['preview/home-ui.css', 'public/home-ui.css'],
  ['preview/home-ui.js', 'public/home-ui.js'],
  ['preview/tms.html', 'public/tms.html'],
  ['preview/tms-app.html', 'public/tms-app.html'],
  ['preview/tms-core.js', 'public/tms-core.js'],
  ['preview/tms.js', 'public/tms.js'],
  ['preview/tms-driver.html', 'public/tms-driver.html'],
  ['preview/tms-driver.js', 'public/tms-driver.js'],
  ['preview/tms-driver-manifest.json', 'public/tms-driver-manifest.json'],
  ['preview/tms-driver-sw.js', 'public/tms-driver-sw.js'],
  ['preview/tms-driver-sw-register.js', 'public/tms-driver-sw-register.js'],
  ['tools/validate-preview-safe.mjs', 'tools/validate-preview-safe.mjs'],
];
for (const [source, destination] of overlays) copyFile(source, destination);

// OAuth/OIDC vuelve desde un sitio externo (Auth0). Una cookie de sesión SameSite=Strict
// puede quedar guardada pero no enviarse en el primer salto callback -> /admin.
// Usamos Lax únicamente para la cookie de sesión, manteniendo Secure + HttpOnly + __Host-.
// La cookie CSRF permanece Strict y las mutaciones siguen exigiendo mismo origen + token CSRF.
const authHelperPath = path.join(OUT, 'netlify', 'functions', '_auth.mjs');
let authHelper = fs.readFileSync(authHelperPath, 'utf8');
const sessionIssueStrict = '`${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`';
const sessionIssueLax = '`${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`';
const sessionClearStrict = '`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`';
const sessionClearLax = '`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`';
const csrfStrict = '`${CSRF}=${csrf}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Strict`';

if (!authHelper.includes(sessionIssueStrict)) {
  fail('no se encontró la definición esperada de cookie de sesión SameSite=Strict en _auth.mjs', 54);
}
if (!authHelper.includes(sessionClearStrict)) {
  fail('no se encontró la limpieza esperada de cookie de sesión SameSite=Strict en _auth.mjs', 55);
}
if (!authHelper.includes(csrfStrict)) {
  fail('no se encontró la cookie CSRF SameSite=Strict esperada en _auth.mjs', 56);
}

authHelper = authHelper
  .replace(sessionIssueStrict, sessionIssueLax)
  .replace(sessionClearStrict, sessionClearLax);

if (!authHelper.includes(sessionIssueLax) || !authHelper.includes(sessionClearLax)) {
  fail('no se aplicó correctamente la política SameSite=Lax a la cookie de sesión', 57);
}
if (!authHelper.includes(csrfStrict)) {
  fail('la política CSRF SameSite=Strict fue alterada inesperadamente', 58);
}
fs.writeFileSync(authHelperPath, authHelper);
console.log('OAuth session cookie policy: SameSite=Lax; CSRF cookie remains SameSite=Strict');

const tmsAssetsSource = path.join(ROOT, 'preview', 'assets', 'tms');
const tmsAssetsDestination = path.join(OUT, 'public', 'assets', 'tms');
if (!fs.existsSync(tmsAssetsSource)) fail('falta preview/assets/tms', 52);
fs.mkdirSync(tmsAssetsDestination, { recursive: true });
fs.cpSync(tmsAssetsSource, tmsAssetsDestination, { recursive: true, force: true });

// Producción no permite bloques de script inline. El preview histórico del operador aún
// conserva un registro inline del Service Worker; se externaliza al ensamblar producción.
const driverHtmlPath = path.join(OUT, 'public', 'tms-driver.html');
let driverHtml = fs.readFileSync(driverHtmlPath, 'utf8');
const inlineSwPattern = /<script>\s*if\s*\(\s*['"]serviceWorker['"]\s*in\s*navigator\s*\)\s*\{\s*navigator\.serviceWorker\.register\(\s*['"]tms-driver-sw\.js['"]\s*\)\.catch\(\(\)\s*=>\s*\{\}\);?\s*\}\s*<\/script>/i;
if (!inlineSwPattern.test(driverHtml)) {
  fail('no se encontró el bloque inline esperado de registro del Service Worker del operador', 53);
}
driverHtml = driverHtml.replace(inlineSwPattern, '<script src="tms-driver-sw-register.js"></script>');
fs.writeFileSync(driverHtmlPath, driverHtml);

// Bloqueos de regresión.
const legacyDemo = containsTextRecursive(path.join(OUT, 'public'), 'XOLUM-DEMO');
if (legacyDemo) fail(`se detectó XOLUM-DEMO en archivo público: ${path.relative(OUT, legacyDemo)}`, 43);

const tmsPlaintext = containsTextRecursive(
  path.join(OUT, 'public'),
  'XOLUM-TMS-DEMO-2026',
  (full) => path.basename(full).startsWith('tms')
);
if (tmsPlaintext) fail(`el código TMS de prueba quedó expuesto en texto plano: ${path.relative(OUT, tmsPlaintext)}`, 44);

runValidator('tools/validate-preview-safe.mjs');
runValidator('tools/validate-role-hardening.mjs');
runValidator('tools/validate-security.mjs');

console.log('XOLUM production candidate assembled and validated.');
