import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const origin = read('netlify/functions/_origin.mjs');
const toml = read('netlify.toml');

const hasPath = (src, value) =>
  src.includes(`path:"${value}"`) ||
  src.includes(`path: "${value}"`) ||
  src.includes(`path = "${value}"`);

const nativeRoutes = {
  'auth-login.mjs': '/auth/login',
  'auth-callback.mjs': '/auth/callback',
  'auth-logout.mjs': '/auth/logout',
  'master-data.mjs': '/api/master-data',
  'b2b-access.mjs': '/api/b2b-access',
  'catalog-access.mjs': '/api/catalog-access',
  'customer-config.mjs': '/api/customer-config',
  'orders.mjs': '/api/orders',
  'crm.mjs': '/api/crm',
  'operations.mjs': '/api/operations',
  'analytics.mjs': '/api/analytics',
  'quotes.mjs': '/api/quotes',
  'security-audit.mjs': '/api/security-audit',
  'security-migrate.mjs': '/api/security-migrate',
  'security-status.mjs': '/api/security-status',
  'session.mjs': '/api/session',
};

const checks = {
  preview_bound_to_exact_project: origin.includes('--euphonious-crisp-9e0050.netlify.app'),
  preview_origin_validated: origin.includes('Origen XOLUM no autorizado'),
  no_legacy_function_rewrites: !/^\s*to\s*=\s*["']\/\.netlify\/functions\//m.test(toml),
};

for (const [file, route] of Object.entries(nativeRoutes)) {
  const src = read(`netlify/functions/${file}`);
  const key = `native_path_${file.replace(/\.mjs$/, '').replace(/-/g, '_')}`;
  checks[key] = hasPath(src, route);
}

const login = read('netlify/functions/auth-login.mjs');
const cb = read('netlify/functions/auth-callback.mjs');
checks.login_uses_request_origin = login.includes('allowedAppOrigin(req)');
checks.callback_uses_request_origin = cb.includes('allowedAppOrigin(req)');
checks.login_no_longer_requires_site_env = !login.includes('process.env.XOLUM_SITE_URL');
checks.callback_no_longer_requires_site_env = !cb.includes('process.env.XOLUM_SITE_URL');

console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some((v) => !v)) process.exit(1);
console.log('\nPREVIEW SAFE: APROBADO');
