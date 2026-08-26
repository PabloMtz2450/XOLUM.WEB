import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const authPath = path.join(ROOT, '.xolum-prod', 'netlify', 'functions', '_auth.mjs');
const statusPath = path.join(ROOT, '.xolum-prod', 'netlify', 'functions', 'security-status.mjs');

function fail(message, code = 70) {
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

if (!fs.existsSync(authPath)) fail('no existe _auth.mjs ensamblado', 70);
if (!fs.existsSync(statusPath)) fail('no existe security-status.mjs ensamblado', 71);

const auth = fs.readFileSync(authPath, 'utf8');
const sessionLax = '`${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`';
const csrfStrict = '`${CSRF}=${csrf}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Strict`';

if (!auth.includes(sessionLax)) {
  fail('security-status no se actualizará: la cookie real de sesión no está en SameSite=Lax', 72);
}
if (!auth.includes(csrfStrict)) {
  fail('security-status no se actualizará: la cookie CSRF ya no está en SameSite=Strict', 73);
}

let status = fs.readFileSync(statusPath, 'utf8');
const stale = 'AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Strict';
const current = 'AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Lax';

if (!status.includes(stale) && !status.includes(current)) {
  fail('security-status.mjs no contiene la descripción esperada de session_cookie', 74);
}

status = status.replace(stale, current);

if (!status.includes(current)) {
  fail('no se pudo alinear security-status con la política real de la cookie de sesión', 75);
}

fs.writeFileSync(statusPath, status);
console.log('Security status aligned: session SameSite=Lax; CSRF SameSite=Strict');
