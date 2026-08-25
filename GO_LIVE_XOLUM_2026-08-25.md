# XOLUM · Go-live controlado · 2026-08-25

> Regla de liberación: **no publicar en xolum.com.mx mientras exista un bloqueante de seguridad, autenticación, integridad del repositorio o respaldo.**

## 1. Auditoría final XOLUM.WEB

Estado: **EN CIERRE**

- [x] Repositorio correcto: `PabloMtz2450/XOLUM.WEB`.
- [x] Rama de rollback creada: `backup/pre-production-2026-08-25`.
- [x] GitHub Pages despliega correctamente el preview.
- [x] Demo TMS usa código de invitación por hash y ya no publica el código en el placeholder.
- [x] Fuente productiva V8.1.2 auditada fuera de producción.
- [x] Cambio OAuth preparado a `application/x-www-form-urlencoded`.
- [x] POST B2C corregido para validar sesión + CSRF real.
- [x] Validadores preview-safe, role-hardening y security: APROBADOS.
- [x] Logos de producción sustituidos únicamente por archivos autorizados sin modificación gráfica.
- [x] Código demo legado `XOLUM-DEMO` retirado de la fuente preparada.
- [ ] El repositorio todavía debe contener **todos** los assets productivos necesarios antes de conectar Netlify a `main`.
- [ ] Refactor pendiente de handlers `onclick` heredados para poder endurecer `script-src-attr` a `none`.

## 2. Validación Home + TMS + App Operador

Estado: **EN VALIDACIÓN**

- [x] Home y TMS presentes en preview.
- [x] Presentación TMS separada de la demo interactiva.
- [x] Torre de Control con pedidos, validación, planeación, rutas y operación.
- [x] App Operador separada, móvil, con viaje, paradas, POD, incidencias, SafeRoute y cola offline simulada.
- [x] Breakpoints responsive definidos en TMS y App Operador.
- [ ] Smoke test visual final desktop.
- [ ] Smoke test visual final móvil real/DevTools después del deploy candidato de Netlify.

## 3. Auth0 401

Estado: **BLOQUEANTE**

- [x] Token exchange corregido según Authorization Code Flow: form-urlencoded.
- [x] PKCE, nonce, state, email verificado y claim de roles conservados.
- [ ] Rotar/verificar `AUTH0_CLIENT_SECRET` y actualizar Netlify sin exponerlo.
- [ ] Confirmar callback 302 exitoso y sesión SUPER_ADMIN.

## 4. Seguridad de /admin, sesión, logout y APIs

Estado: **BLOQUEADO POR PUNTO 3**

- [x] Edge gate para `/admin` y rutas B2B críticas presente.
- [x] Cookie de sesión `__Host-xolum_session`: HttpOnly, Secure, SameSite=Strict, AES-256-GCM.
- [x] CSRF con cookie/header y comparación segura.
- [ ] `/api/session`: 401 sin sesión y 200 con sesión válida.
- [ ] `/api/crm` y APIs admin: 401/403 sin autorización, 200 con rol válido.
- [ ] `/auth/logout`: invalida sesión y bloquea acceso posterior.
- [ ] Incógnito posterior al logout no recupera sesión.

## 5. Respaldo producción actual

Estado: **PARCIAL / NO PUBLICAR AÚN**

- [x] Paquete productivo completo V8.1.2 conservado localmente con SHA-256.
- [x] Rama GitHub de rollback del estado previo creada.
- [x] Netlify mantiene deploys atómicos anteriores para rollback.
- [x] Datos de `getStore()` son site-wide y persisten entre deploys.
- [ ] Exportar/descargar snapshot de stores críticos antes del cambio final: clientes, CRM, master-data, operaciones, B2B, pedidos, cotizaciones y auditoría.

## 6. Netlify gobernado por GitHub

Estado: **NO EJECUTAR TODAVÍA**

Condiciones obligatorias antes de enlazar:

1. Auth0 verde.
2. Assets productivos completos/reproducibles desde GitHub.
3. Respaldo de datos cerrado.
4. Candidate deploy validado.

Después:

- [ ] Link repository: `PabloMtz2450/XOLUM.WEB`.
- [ ] Production branch: `main`.
- [ ] Build/publish reproducible.
- [ ] Variables de entorno revisadas sin imprimir secretos.
- [ ] Auto-publish inicialmente bloqueado hasta aprobar candidate deploy.

## 7. Publicar xolum.com.mx

Estado: **PENDIENTE**

- [ ] Candidate deploy 100% verde.
- [ ] Publicar deploy aprobado.
- [ ] Smoke tests Home, Store, Sellos, TMS, App Operador, Auth0, admin, B2B y APIs.
- [ ] Confirmar dominio, TLS, headers y rutas.

## 8. Limpieza post go-live

Estado: **PENDIENTE**

- [ ] Restaurar Deploy Preview privado.
- [ ] Eliminar localhost/callbacks temporales no necesarios en Auth0.
- [ ] Revocar/rotar secretos previamente expuestos.
- [ ] Retirar códigos y accesos temporales que no deban sobrevivir a pruebas.
- [ ] Mantener rollback conocido y documentado.
- [ ] Habilitar protección/ruleset de `main` para evitar pushes accidentales a producción.

## Criterio final

**Si no es reproducible desde GitHub, no gobierna GitHub. Si no está respaldado, no se publica. Si Auth0 no está verde, `/admin` no sale a producción.**
