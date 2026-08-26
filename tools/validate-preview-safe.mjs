import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const origin = read('netlify/functions/_origin.mjs');
const login = read('netlify/functions/auth-login.mjs');
const cb = read('netlify/functions/auth-callback.mjs');
const logout = read('netlify/functions/auth-logout.mjs');
const session = read('netlify/functions/session.mjs');
const crm = read('netlify/functions/crm.mjs');
const toml = read('netlify.toml');

const hasPath = (src, value) =>
  src.includes(`path:"${value}"`) ||
  src.includes(`path: "${value}"`) ||
  src.includes(`path = "${value}"`);

const checks = {
  preview_bound_to_exact_project: origin.includes('--euphonious-crisp-9e0050.netlify.app'),
  preview_origin_validated: origin.includes('Origen XOLUM no autorizado'),
  login_uses_request_origin: login.includes('allowedAppOrigin(req)'),
  callback_uses_request_origin: cb.includes('allowedAppOrigin(req)'),
  login_no_longer_requires_site_env: !login.includes('process.env.XOLUM_SITE_URL'),
  callback_no_longer_requires_site_env: !cb.includes('process.env.XOLUM_SITE_URL'),
  login_native_path: hasPath(login, '/auth/login'),
  callback_native_path: hasPath(cb, '/auth/callback'),
  logout_native_path: hasPath(logout, '/auth/logout'),
  session_native_path: hasPath(session, '/api/session'),
  crm_native_path: hasPath(crm, '/api/crm'),
  no_legacy_session_rewrite: !toml.includes('to = "/.netlify/functions/session"'),
  no_legacy_crm_rewrite: !toml.includes('to = "/.netlify/functions/crm"'),
  no_legacy_auth_rewrites: !toml.includes('/.netlify/functions/auth-login') && !toml.includes('/.netlify/functions/auth-callback') && !toml.includes('/.netlify/functions/auth-logout'),
};

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some((v) => !v)) process.exit(1);
console.log('\nPREVIEW SAFE: APROBADO');
