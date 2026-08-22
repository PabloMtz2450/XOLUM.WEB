# XOLUM.WEB

Repositorio oficial de XOLUM: respaldo técnico, arquitectura de seguridad y preview visual navegable.

## Preview visual
La carpeta `preview/` contiene una maqueta navegable con apariencia de producto final:

- `preview/index.html` — Home comercial B2C/B2B.
- `preview/b2b.html` — Portal de compra empresarial.
- `preview/admin.html` — XOLUM Control Center / consola administrativa.
- `preview/styles.css` — sistema visual XOLUM.

Se incluye `.github/workflows/pages.yml` para publicar automáticamente `preview/` mediante GitHub Pages cuando Pages esté habilitado en el repositorio.

URL prevista de GitHub Pages:
`https://pablomtz2450.github.io/XOLUM.WEB/`

> El preview de GitHub Pages es deliberadamente estático: sirve para revisar diseño, navegación y UX. La autenticación Auth0, Functions, cifrado, CRM real y demás lógica sensible se ejecutan únicamente en el despliegue Netlify.

## Seguridad
No se versionan secretos de Netlify/Auth0, claves de sesión o cifrado, archivos `.env` reales, `.netlify/` ni `node_modules/`.

## Línea técnica
La base segura de referencia es XOLUM V8.1.2 Preview-Safe / Role-Hardened. El objetivo del repositorio es evolucionar a una única fuente de verdad: interfaz + backoffice + Functions + seguridad + documentación.
