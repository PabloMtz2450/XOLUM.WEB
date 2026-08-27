import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const OUT=path.join(ROOT,'.xolum-prod');

function fail(message,code=80){
  console.error(`ERROR: ${message}`);
  process.exit(code);
}

function copy(relativeSource,relativeDestination){
  const source=path.join(ROOT,relativeSource);
  const destination=path.join(OUT,relativeDestination);
  if(!fs.existsSync(source))fail(`falta archivo gobernado por Git: ${relativeSource}`,80);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}

if(!fs.existsSync(OUT))fail('no existe .xolum-prod; ejecute primero build-production.mjs',81);

copy('netlify/functions/_origin.mjs','netlify/functions/_origin.mjs');
copy('netlify/functions/auth-logout.mjs','netlify/functions/auth-logout.mjs');

const originPath=path.join(OUT,'netlify','functions','_origin.mjs');
const logoutPath=path.join(OUT,'netlify','functions','auth-logout.mjs');
const authPath=path.join(OUT,'netlify','functions','_auth.mjs');
const statusPath=path.join(OUT,'netlify','functions','security-status.mjs');

for(const p of [originPath,logoutPath,authPath,statusPath]){
  if(!fs.existsSync(p))fail(`falta archivo ensamblado: ${path.relative(OUT,p)}`,82);
}

const origin=fs.readFileSync(originPath,'utf8');
if(!origin.includes('const PROD_HOST="xolum.com.mx"'))fail('_origin.mjs no restringe producción a xolum.com.mx',83);
if(!origin.includes('--euphonious-crisp-9e0050.netlify.app'))fail('_origin.mjs no restringe previews al proyecto Netlify esperado',84);
if(!origin.includes('throw new Error("Origen XOLUM no autorizado")'))fail('_origin.mjs no falla cerrado para hosts no autorizados',85);

const logout=fs.readFileSync(logoutPath,'utf8');
if(!logout.includes('allowedAppOrigin(req)'))fail('auth-logout.mjs no usa el origen validado de la petición',86);
if(logout.includes('process.env.XOLUM_SITE_URL'))fail('auth-logout.mjs volvió a depender de XOLUM_SITE_URL',87);

const auth=fs.readFileSync(authPath,'utf8');
const sessionLax='`${COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`';
const csrfStrict='`${CSRF}=${csrf}; Path=/; Max-Age=${maxAge}; Secure; SameSite=Strict`';
if(!auth.includes(sessionLax))fail('la cookie real de sesión no está en SameSite=Lax',88);
if(!auth.includes(csrfStrict))fail('la cookie CSRF no permanece en SameSite=Strict',89);

let status=fs.readFileSync(statusPath,'utf8');
const stale='AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Strict';
const current='AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Lax';
if(!status.includes(stale)&&!status.includes(current))fail('security-status no contiene la descripción esperada de session_cookie',90);
status=status.replace(stale,current);
if(!status.includes(current))fail('security-status no pudo alinearse con la cookie real',91);
fs.writeFileSync(statusPath,status);

console.log('Post-build hardening: allowed origins governed by Git');
console.log('Post-build hardening: logout uses validated request origin');
console.log('Post-build hardening: session SameSite=Lax; CSRF SameSite=Strict');
console.log('Post-build hardening: security-status aligned');
