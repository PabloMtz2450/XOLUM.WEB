# XOLUM — separación de entornos

Fecha: 2026-08-27

## Regla arquitectónica

XOLUM.WEB no debe alojar demos privadas dentro del mismo runtime ni de la misma base de código activa que TMS productivo.

## Baseline observado antes del refactor

Antes del PR #3 se verificó que:

- `preview/tms.html` mezclaba presentación de TMS con enlaces directos a la demo.
- `preview/tms-app.html` era una demo operativa interactiva.
- `preview/tms-driver.html`, su JavaScript, manifest y Service Worker convivían con el runtime productivo.
- `netlify/edge-functions/access-gate.ts` protegía `/admin` y rutas B2B seleccionadas, pero no `/tms`.
- La demo utilizaba un gate estático en navegador y `sessionStorage`, separado de la sesión productiva real.
- El bundle histórico de producción podía reintroducir artefactos demo durante el ensamblado.

## Estado implementado en PR #3

### Home y Store

- La Home se mantiene como manifiesto de marca.
- La sección aislada de Sellos B2B fue eliminada.
- XOLUM STORE contiene accesos diferenciados a Tienda General y Línea Corporativa B2B.
- Los enlaces B2B apuntan directamente a `/tienda/b2b/`.
- El footer utiliza enlaces verticales y redes sociales mediante SVG.

### TMS productivo

- `preview/tms.html` es ahora exclusivamente la entrada de TMS productivo.
- No contiene enlaces ni referencias a demos, pilotos o PWA de operador.
- `/tms`, `/tms/` y `/tms.html` requieren una sesión autenticada mediante el `access-gate` y `/api/session`.
- No se inventaron roles TMS: la autorización fina por tenant/empresa y rol sigue pendiente del modelo productivo definitivo.

### Extracción de demos

- La versión original de las demos quedó preservada en la rama `extract/xolum-demos-2026-08-27` para migración.
- Los archivos demo fueron eliminados físicamente de la rama productiva de refactor:
  - `preview/tms-app.html`
  - `preview/tms-core.js`
  - `preview/tms.js`
  - `preview/tms-driver.html`
  - `preview/tms-driver.js`
  - `preview/tms-driver-manifest.json`
  - `preview/tms-driver-sw.js`
  - `preview/tms-driver-sw-register.js`
  - assets visuales específicos de la demo TMS.
- `tools/build-production.mjs` ya no depende de esos archivos ni los superpone al candidato productivo.
- `tools/post-build-hardening.mjs` elimina además cualquier copia histórica que pudiera venir dentro del bundle heredado y falla si un artefacto demo sobrevive.

### Build y despliegue

- `npm run build` ejecuta ensamblado y post-build hardening.
- Netlify utiliza exactamente `npm run build`.
- CI y Netlify generan así el mismo candidato productivo.
- Las reglas Netlify que trataban `tms-app.html` y `tms-driver.html` como rutas publicables fueron retiradas.

## Arquitectura objetivo restante

### Producción TMS

El entorno productivo debe evolucionar con:

- autorización por tenant/empresa y rol;
- persistencia productiva definida y escalable;
- sesiones revocables y política de expiración definida;
- auditoría de login, logout, fallos y revocación;
- aplicación operativa productiva independiente de cualquier maqueta.

No se declara que esas capas estén terminadas sólo por proteger la entrada `/tms`.

### Demos privadas

El destino final debe ser un repositorio y deploy independientes de `XOLUM.WEB`.

Destino recomendado:

- repo: `XOLUM.DEMOS` o equivalente;
- host: `demos.xolum.com.mx`;
- autenticación y almacenamiento independientes del TMS productivo.

Estructura sugerida:

```text
XOLUM.DEMOS/
  public/
    index.html
    login/
    proyecto-1/
    proyecto-2/
  netlify/
    functions/
    edge-functions/
```

Características:

- gatekeeper independiente;
- acceso únicamente por invitación;
- credenciales de demos nunca compartidas con TMS;
- cookie, secreto de sesión, almacenamiento y usuarios independientes;
- no reutilizar tokens ni persistencia productiva de TMS.

## UI de login

TMS y Demos deben compartir el sistema visual XOLUM, no la implementación de sesión.

- fondo hueso o negro profundo;
- tipografía institucional;
- sólo campos esenciales;
- acción `ENTRAR ↗`;
- mensajes de error sobrios y sin fuga de información;
- sin componentes genéricos de plantilla.

## ZONAS CIEGAS vigentes

No se implementa todavía un nuevo esquema JWT/base productiva porque no existe evidencia suficiente en este repositorio para determinar con seguridad:

- base de datos productiva definitiva de TMS;
- estrategia final de multi-tenancy;
- catálogo definitivo de roles TMS;
- rotación de claves;
- política de refresh/revocación;
- migración de usuarios;
- infraestructura objetivo para miles de usuarios.

Inventar cualquiera de estas piezas sería sustituir arquitectura por suposición.

## Pendientes para separación física definitiva

1. Crear repositorio independiente `XOLUM.DEMOS`.
2. Migrar desde `extract/xolum-demos-2026-08-27` al nuevo repositorio.
3. Crear deploy independiente, preferentemente `demos.xolum.com.mx`.
4. Implementar gatekeeper de demos con usuarios/invitaciones propios.
5. Validar que demos no compartan secretos, cookies, almacenamiento ni credenciales con TMS.
6. Definir el modelo real de tenant/roles de TMS antes de endurecer autorización fina.
7. Ejecutar pruebas de seguridad y recuperación del TMS productivo antes de declarar capacidad de alto volumen.

## Criterio de aceptación del PR #3

El PR sólo puede fusionarse si el HEAD exacto cumple:

- build completo mediante `npm run build`;
- post-build hardening ejecutado;
- ausencia de artefactos demo en `.xolum-prod/public`;
- validadores de seguridad y roles aprobados;
- smoke desktop aprobado;
- smoke móvil 320/360/390/430 aprobado;
- interacción iPhone 13 aprobada;
- reduced-motion aprobado.
