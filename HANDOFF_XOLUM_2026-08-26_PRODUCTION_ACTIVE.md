# XOLUM.WEB — PRODUCCIÓN ACTIVA

Fecha de cierre: 2026-08-26 (CDMX)
Repositorio canónico: `PabloMtz2450/XOLUM.WEB`
Rama productiva: `main`
SHA productivo estable: `ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`
Dominio productivo: `https://xolum.com.mx`
Proyecto Netlify: `euphonious-crisp-9e0050`
Project ID: `28bfbe4c-24ef-46d2-8bdd-56166034162d`
Deploy validado y promovido: `https://6a8fa8ed043dcf0008095691--euphonious-crisp-9e0050.netlify.app/`

## ESTADO

**XOLUM.WEB PRODUCCIÓN ACTIVA — AUTENTICACIÓN/SEGURIDAD VALIDADA EN RUNTIME.**

El deploy construido desde `main@ee89b188` fue publicado manualmente mediante `Publish deploy` manteniendo el auto publishing bloqueado durante la validación inmediata.

## RESPALDOS / BASELINES

- `backup/pre-production-2026-08-26-auth-complete` → SHA `ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`
- `baseline/production-2026-08-26` → SHA `ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8`
- respaldo anterior: `backup/pre-production-2026-08-25`
- bundle base: `production/XOLUM_RUNTIME_BASE_GITOPT_2026-08-25.zip`
- SHA-256 esperado del bundle: `dca475cf39aa50e8f6a3ed084649a9a8505beb6c8cad8917ddeb31c2d3ee1a5e`

## PRUEBAS DE PRODUCCIÓN APROBADAS

1. `https://xolum.com.mx/admin/` sin sesión → solicita autenticación Auth0.
2. Login Auth0 → válido.
3. Callback real usado por producción → `https://xolum.com.mx/auth/callback`.
4. Regreso a `/admin/` → Centro de control.
5. Usuario/rol observado → `admin@xolum.com.mx`, `SUPER_ADMIN`.
6. `/api/session` autenticado → `ok:true`, `authenticated:true`, `role:SUPER_ADMIN`.
7. Navegación limpia posterior → `https://xolum.com.mx/admin/` sin `code`/`state` residuales.
8. `/api/security-status` en producción → `ok:true`.
9. `session_cookie` reporta `AES-256-GCM cifrada + HttpOnly + Secure + SameSite=Lax`.
10. CSRF reporta `double-submit + same-origin`.
11. Variables críticas reportadas `true`: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, XOLUM_SESSION_COOKIE_KEY, XOLUM_DATA_ENCRYPTION_KEY, XOLUM_SUPERADMIN_EMAIL, XOLUM_SITE_URL.
12. Logout desde Admin → sesión invalidada.
13. `/api/session` después de logout → `{"ok":false,"authenticated":false}`.
14. `/admin/` después de logout → vuelve a Auth0.

## CAUSA RAÍZ AUTH0 RESUELTA

La cookie de sesión `__Host-xolum_session` usaba `SameSite=Strict`. En el flujo cross-site `XOLUM -> Auth0 -> /auth/callback -> /admin/`, Chromium podía almacenar la cookie pero no enviarla en el primer salto protegido. Eso provocaba el bucle de autenticación aunque `/api/session` funcionara después en navegación same-site.

Corrección validada y productiva:

- sesión: `SameSite=Lax`
- `Secure`
- `HttpOnly`
- prefijo `__Host-`
- AES-256-GCM
- cookie CSRF separada conserva `SameSite=Strict`
- mutaciones conservan double-submit + same-origin

## ORÍGENES AUTH0 / NETLIFY

`_origin.mjs` permite solo:

- `https://xolum.com.mx`
- `https://www.xolum.com.mx`, normalizado a producción
- immutable deploy URLs del proyecto exacto `euphonious-crisp-9e0050`
- localhost / 127.0.0.1 para Netlify Dev

`auth-login.mjs`, `auth-callback.mjs` y `auth-logout.mjs` usan el origen validado de la petición.

## BUILD VALIDADO

Comando:

`node tools/build-production.mjs && node tools/post-build-hardening.mjs`

Última validación local verde:

- PREVIEW SAFE: APROBADO
- ROLE HARDENING: APROBADO
- Security validator passed
- allowed origins governed by Git
- logout uses validated request origin
- session SameSite=Lax; CSRF SameSite=Strict
- security-status aligned
- Functions bundling OK
- Edge Functions bundling OK
- Netlify Build Complete

## REGLAS DE GOBIERNO

- GitHub `PabloMtz2450/XOLUM.WEB/main` es la fuente de verdad.
- No tocar `PabloMtz2450/xolum-web`.
- No modificar `PabloMtz2450/tms.dev`; referencia de solo lectura salvo autorización explícita.
- No almacenar secretos en GitHub.
- `main` seguía sin branch protection al cierre; proteger después del smoke/cierre de previews.

## ZONA CIEGA — DATOS

No se ha certificado todavía una exportación externa independiente y restaurable de todos los objetos Netlify Blobs. Stores identificados:

- xolum-crm-v70
- xolum-customers-v68
- xolum-commerce-v68
- xolum-operations-v80
- xolum-b2b
- xolum-orders-v68
- xolum-quotes-v80
- xolum-security-audit-v81

Publicar el deploy no eliminó estos stores, pero el plan de recuperación de datos no debe considerarse cerrado hasta exportar y probar restauración.

## PENDIENTES INMEDIATOS DESPUÉS DE ESTE CORTE

1. Smoke funcional Home desktop/mobile.
2. Smoke funcional TMS desktop/mobile.
3. Smoke App Operador/PWA desktop y móvil.
4. Verificar Service Worker, manifest y offline.
5. Revisar consola, CSP, 404, assets, rutas y responsive.
6. Validar escritura/lectura real de APIs operativas con datos de prueba controlados.
7. Exportación externa completa de Netlify Blobs + prueba de restauración.
8. Limpiar URL temporal del deploy validado en Auth0 y dejar producción + localhost cuando ya no sea necesaria.
9. Resolver Auth0 Google `Dev Keys`: credenciales productivas propias o deshabilitar conexión.
10. Refactor de `onclick` legacy y CSP `script-src-attr 'none'`.
11. Self-host/SRI de SheetJS usado por TMS App.
12. Proteger `main` con ruleset/branch protection.
13. Pentest externo / OWASP ASVS L2 antes de escalar información de alto impacto.

## FRASE PARA CONTINUAR EN OTRO CHAT

`Continúa XOLUM.WEB desde HANDOFF_XOLUM_2026-08-26_PRODUCTION_ACTIVE.md en la rama handoff/xolum-2026-08-26-auth-ready. PRODUCCIÓN YA ESTÁ ACTIVA en https://xolum.com.mx con baseline ee89b1884af2d64d6faf1a8a2dfe4c7c584a85d8. Auth0, sesión SUPER_ADMIN, security-status y logout ya fueron validados en producción. No modificar tms.dev. Lo siguiente es smoke funcional Home + TMS + App Operador, respaldo externo de Netlify Blobs y cierre de hardening.`
