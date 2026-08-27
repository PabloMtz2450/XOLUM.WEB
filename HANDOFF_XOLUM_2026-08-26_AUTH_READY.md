# XOLUM.WEB — HANDOFF TÉCNICO

Fecha de corte: 2026-08-26 (CDMX)
Repositorio canónico: `PabloMtz2450/XOLUM.WEB`
Rama productiva: `main`
SHA validado: `ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`
Candidato Netlify validado: `https://6a8fa8ed043dcf0008095691--euphonious-crisp-9e0050.netlify.app/`
Proyecto Netlify: `euphonious-crisp-9e0050`
Project ID: `28bfbe4c-24ef-46d2-8bdd-56166034162d`
Dominio productivo objetivo: `https://xolum.com.mx`

## 1. REGLAS DE GOBIERNO

- GitHub `XOLUM.WEB/main` es la fuente de verdad.
- No tocar `PabloMtz2450/xolum-web`.
- No modificar `PabloMtz2450/tms.dev`; es referencia de solo lectura salvo autorización explícita.
- Antes de este corte, auto publishing de Netlify estaba bloqueado para impedir reemplazar producción accidentalmente.
- No almacenar ni documentar secretos en GitHub. Las variables sensibles viven en Netlify/Auth0.

## 2. RESPALDOS

### Respaldo exacto del código antes del go-live

Rama: `backup/pre-production-2026-08-26-auth-complete`
SHA: `ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`

Este branch congela exactamente el runtime validado antes de publicar.

### Respaldo anterior

Existe además `backup/pre-production-2026-08-25` como rollback previo.

### Bundle base

`production/XOLUM_RUNTIME_BASE_GITOPT_2026-08-25.zip`
SHA-256 esperado:
`dca475cf39aa50e8f6a3ed084649a9a8505beb6c8cad8917ddeb31c2d3ee1a5e`

El build aborta si el checksum no coincide.

### Datos Netlify Blobs

Los stores identificados durante la auditoría son:

- `xolum-crm-v70`
- `xolum-customers-v68`
- `xolum-commerce-v68`
- `xolum-operations-v80`
- `xolum-b2b`
- `xolum-orders-v68`
- `xolum-quotes-v80`
- `xolum-security-audit-v81`

ZONA CIEGA: al momento de este handoff no se ha certificado una exportación externa completa de todos los objetos de esos stores. Netlify Blobs es site-wide y persiste entre deploys, por lo que publicar un deploy nuevo no los elimina por sí mismo, pero una copia externa independiente debe realizarse como tarea de continuidad antes de considerar cerrado el plan de recuperación de datos.

## 3. BUILD Y SEGURIDAD

Comando Netlify actual:

`node tools/build-production.mjs && node tools/post-build-hardening.mjs`

El build local validado terminó con:

- `PREVIEW SAFE: APROBADO`
- `ROLE HARDENING: APROBADO`
- Security validator `passed: true`
- `Post-build hardening: allowed origins governed by Git`
- `Post-build hardening: logout uses validated request origin`
- `Post-build hardening: session SameSite=Lax; CSRF SameSite=Strict`
- `Post-build hardening: security-status aligned`
- Functions bundling OK
- Edge Functions bundling OK
- `Netlify Build Complete`

Se empaquetan 21 Functions y 1 Edge Function (`access-gate`).

Una sola regla Edge global `/*` se utiliza para evitar exceder el límite del plan. La Edge Function solo aplica control a rutas protegidas.

## 4. AUTH0 — ESTADO VALIDADO

Aplicación: `XOLUM Production`
Tipo: Regular Web Application
Tenant: `dev-hlsu2ccjxs5fiylh.us.auth0.com`
Client ID: `uVcj2AKjOrC8RYQf7HLlzCYhV2eDoGur`
Rol administrativo probado: `SUPER_ADMIN`
Namespaced roles claim: `https://xolum.com.mx/roles`

La Action `XOLUM - Role Claims` está desplegada y agrega roles al token.

Protecciones observadas/configuradas:

- PKCE S256
- state
- nonce
- email verificado
- rol `SUPER_ADMIN` firmado por Auth0
- segunda comprobación por correo administrativo configurado
- sesión BFF cifrada AES-256-GCM
- cookie `__Host-xolum_session`
- `HttpOnly`
- `Secure`
- `SameSite=Lax`
- cookie CSRF separada en `SameSite=Strict`
- double-submit CSRF + validación same-origin en mutaciones

### Causa raíz del bucle Auth0 resuelto

La cookie de sesión estaba en `SameSite=Strict`. En el flujo cross-site:

`XOLUM -> Auth0 -> /auth/callback -> /admin/`

Chromium podía almacenar la cookie pero no enviarla en el primer redirect hacia `/admin/`, por lo que Edge interpretaba al usuario como no autenticado y lo enviaba otra vez a Auth0. Una navegación posterior same-site sí enviaba la cookie, por eso `/api/session` mostraba autenticado y `/admin/` abría manualmente.

Corrección validada: solo la cookie de sesión cambió a `SameSite=Lax`. CSRF permanece `Strict`.

## 5. ORÍGENES Y PREVIEWS

`_origin.mjs` permite únicamente:

- `https://xolum.com.mx`
- `https://www.xolum.com.mx`, normalizado a `https://xolum.com.mx`
- URLs immutable deploy del proyecto exacto: `<id>--euphonious-crisp-9e0050.netlify.app`
- localhost / 127.0.0.1 para Netlify Dev

Cualquier otro host es rechazado.

`auth-login.mjs`, `auth-callback.mjs` y `auth-logout.mjs` usan el origen validado de la petición. El logout dejó de usar un `XOLUM_SITE_URL` fijo para previews.

Candidato actual probado:

`https://6a8fa8ed043dcf0008095691--euphonious-crisp-9e0050.netlify.app/`

`curl -I /auth/login?returnTo=%2Fadmin%2F` devolvió `302` a Auth0 con callback exactamente hacia ese mismo candidato.

Auth0 fue actualizado temporalmente para permitir este candidato en:

- Allowed Callback URLs
- Allowed Logout URLs
- Allowed Web Origins

Producción y localhost se conservaron. `Application Login URI` debe permanecer en producción.

## 6. PRUEBAS E2E YA APROBADAS EN RUNTIME

En el candidato `6a8fa8ed...`:

1. Navegación anónima a `/admin/` -> Auth0.
2. Login con contraseña -> válido.
3. Callback OAuth -> válido.
4. Regreso directo a `/admin/` -> Centro de control, sin bucle.
5. `/api/session` autenticado -> `ok:true`, `authenticated:true`, rol `SUPER_ADMIN`.
6. `/api/crm` sin sesión -> `401 Sesión requerida`.
7. `/api/crm` con SUPER_ADMIN -> `200`, `ok:true`.
8. `/api/security-status` con admin -> `200`.
9. `session_cookie` reporta `AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Lax`.
10. Variables críticas reportadas configuradas: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, XOLUM_SESSION_COOKIE_KEY, XOLUM_DATA_ENCRYPTION_KEY, XOLUM_SUPERADMIN_EMAIL, XOLUM_SITE_URL.
11. Logout -> elimina sesión.
12. `/api/session` después de logout -> `authenticated:false`.
13. `/admin/` después de logout -> vuelve a Auth0.
14. Logout del preview regresa al mismo origen validado.

Bloque Auth0/sesión/admin/APIs protegidas: CERRADO.

## 7. RESIDUALES CONOCIDOS

No bloquearon el candidato, pero siguen pendientes:

- UI legacy mantiene algunos `onclick`; CSP de Admin/B2B conserva `script-src-attr 'unsafe-inline'` por compatibilidad. Refactor posterior debe eliminar handlers inline y llevar `script-src-attr` a `'none'`.
- TMS App usa SheetJS desde jsDelivr; recomendable self-host/SRI posteriormente.
- Auth0 mostró advertencia de `Dev Keys` en una conexión social (probablemente Google). Antes de ofrecer Google login en producción se deben configurar credenciales productivas propias o deshabilitar esa conexión. El login database probado no depende de esa conexión.
- MFA tradicional depende de capacidades/configuración de Auth0. Passkey está habilitada, pero no debe presentarse comercialmente como 2FA obligatorio si no se exige un segundo factor.
- Ningún sistema debe describirse como invulnerable. Pentest externo / OWASP ASVS L2 recomendado antes de escalar información de alto impacto.
- `main` estaba sin protección de rama en este corte. Proteger después del go-live y limpieza de previews.
- Exportación externa independiente de Netlify Blobs: pendiente, ver ZONA CIEGA en respaldos.

## 8. PRODUCCIÓN — SIGUIENTE MOVIMIENTO

Antes del smoke funcional solicitado, el usuario pidió publicar lo ya validado.

El candidato a publicar es el deploy construido desde `main@ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`:

`https://6a8fa8ed043dcf0008095691--euphonious-crisp-9e0050.netlify.app/`

Producción histórica debe conservarse en el historial de deploys de Netlify para rollback atómico.

Procedimiento:

1. En Netlify, abrir el deploy `6a8fa8ed...` y confirmar SHA `ee89b188...` y estado Ready.
2. Usar `Publish deploy` para promover exactamente ese deploy a producción. No reconstruir otro SHA para el corte.
3. Mantener auto publishing bloqueado durante la verificación inmediata post-publicación.
4. Verificar `https://xolum.com.mx/`.
5. Probar producción: `/admin/`, login, `/api/session`, `/api/security-status`, logout y re-protección.
6. Si falla algo, publicar el deploy productivo anterior desde el historial de Netlify. Netlify permite rollback instantáneo a un deploy exitoso anterior.
7. Solo después del smoke y verificación de producción: limpiar URLs temporales de Auth0, eliminar previews/config temporal y proteger `main`.

## 9. ORDEN DE TRABAJO DESPUÉS DEL GO-LIVE

Fases pendientes, en este orden:

- Smoke funcional Home desktop/mobile.
- Smoke funcional TMS desktop/mobile.
- Smoke App Operador / PWA desktop y móvil.
- Verificar Service Worker/manifest/offline de App Operador.
- Revisar consola, CSP, 404, assets, rutas y responsive.
- Validar escritura/lectura real de APIs operativas con datos de prueba controlados.
- Exportación externa completa de Netlify Blobs y prueba de restauración.
- Configurar o deshabilitar Auth0 Google Dev Keys.
- Limpiar Allowed Callback/Logout/Web Origins temporales de previews en Auth0.
- Refactor `onclick` + endurecer CSP a `script-src-attr 'none'`.
- Self-host/SRI de SheetJS.
- Proteger `main` con ruleset/branch protection.
- Pentest externo / OWASP ASVS L2.

## 10. FRASE PARA CONTINUAR EN OTRO CHAT

`Continúa XOLUM.WEB desde el handoff HANDOFF_XOLUM_2026-08-26_AUTH_READY.md en la rama handoff/xolum-2026-08-26-auth-ready. El SHA productivo validado es ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8 y el candidato validado es https://6a8fa8ed043dcf0008095691--euphonious-crisp-9e0050.netlify.app/. No modificar tms.dev. Primero confirmar/publicar producción y luego continuar con el smoke funcional y cierre de seguridad.`
