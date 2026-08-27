# XOLUM — separación de entornos

Fecha: 2026-08-27

## Regla arquitectónica

XOLUM.WEB no debe alojar demos privadas dentro del mismo runtime ni de la misma base de código activa que TMS productivo.

Las demos sí pueden convivir inicialmente entre ellas dentro de un único repositorio y portal `XOLUM.DEMOS`. Se separarán por producto únicamente cuando exista una razón técnica real: escala, seguridad, equipo, ciclo de release o aislamiento de infraestructura.

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

- La versión original de las demos quedó preservada en la rama `extract/xolum-demos-2026-08-27` únicamente como respaldo histórico y fuente de recuperación.
- Se creó `seed/xolum-demos` a partir de esa extracción. Esta es la base temporal de trabajo para poblar el futuro repositorio `XOLUM.DEMOS`.
- `extract/xolum-demos-2026-08-27` no es un entorno ni una rama de desarrollo activo.
- Cuando exista `XOLUM.DEMOS`, el contenido de `seed/xolum-demos` se migrará una sola vez y el desarrollo de demos continuará exclusivamente en ese repositorio.
- Los archivos demo fueron eliminados físicamente de la rama productiva de `XOLUM.WEB`.
- `tools/build-production.mjs` ya no depende de esos archivos ni los superpone al candidato productivo.
- `tools/post-build-hardening.mjs` elimina además cualquier copia histórica que pudiera venir dentro del bundle heredado y falla si un artefacto demo sobrevive.

### Build y despliegue

- `npm run build` ejecuta ensamblado y post-build hardening.
- Netlify utiliza exactamente `npm run build`.
- CI y Netlify generan así el mismo candidato productivo.
- Las reglas Netlify que trataban `tms-app.html` y `tms-driver.html` como rutas publicables fueron retiradas.

## Arquitectura objetivo

### Producción pública

```text
XOLUM.WEB
└── xolum.com.mx
    ├── Home
    ├── Store
    ├── B2B
    └── entradas a productos productivos
```

TMS productivo permanece aislado de cualquier maqueta. Su autorización fina por tenant/empresa y rol se definirá únicamente con el modelo productivo real.

### Portal único de demos

El primer paso será un solo repositorio y un solo deploy para todas las demos:

```text
XOLUM.DEMOS/
├── public/
│   ├── index.html
│   ├── login/
│   ├── tms/
│   ├── fiscal/
│   ├── sales/
│   ├── nomina/
│   └── proyectos/
├── netlify/
│   ├── functions/
│   └── edge-functions/
├── tools/
├── netlify.toml
└── package.json
```

Host objetivo:

```text
https://demos.xolum.com.mx/
https://demos.xolum.com.mx/tms/
https://demos.xolum.com.mx/fiscal/
https://demos.xolum.com.mx/sales/
```

### Regla de crecimiento

No crear un repositorio por demo desde el inicio.

Cada demo permanecerá dentro de `XOLUM.DEMOS` hasta que exista un motivo real para separarla. Si más adelante una demo requiere aislamiento, podrá migrarse a un repo/deploy propio manteniendo la URL pública mediante routing o proxy.

Ejemplo futuro:

```text
XOLUM.DEMOS            -> portal, login e invitaciones
XOLUM.DEMOS.TMS        -> runtime demo TMS
XOLUM.DEMOS.FISCAL     -> runtime demo Fiscal
```

El visitante podrá seguir usando `/tms/` y `/fiscal/` aunque internamente cada producto termine desplegándose por separado.

## Gatekeeper de demos

El portal de demos tendrá una autenticación común e independiente de producción.

Debe permitir:

- acceso por invitación;
- usuario y vigencia;
- habilitación por proyecto/producto;
- revocación;
- auditoría de accesos;
- sesiones, cookies, secretos y almacenamiento propios.

Ejemplo conceptual de autorización:

```text
usuario: prospecto@empresa.mx
productos:
  TMS: permitido
  Fiscal: permitido
  Sales: denegado
vigencia: 2026-09-01 / 2026-09-15
```

Nunca reutilizar credenciales, cookies, tokens, secretos ni persistencia del TMS productivo.

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

## Flujo oficial de migración de demos

```text
extract/xolum-demos-2026-08-27
        respaldo histórico
              │
              ▼
seed/xolum-demos
        base temporal de trabajo
              │
              ▼
XOLUM.DEMOS
        repositorio definitivo
              │
              ▼
demos.xolum.com.mx
```

Después de validar la migración a `XOLUM.DEMOS`:

- `extract/...` queda sólo como respaldo histórico;
- `seed/...` queda congelada como evidencia de migración;
- ninguna de las dos ramas recibe nuevas funcionalidades;
- toda nueva demo nace dentro de `XOLUM.DEMOS`.

## Pendientes físicos

1. Crear repositorio independiente `XOLUM.DEMOS`.
2. Migrar desde `seed/xolum-demos` al nuevo repositorio.
3. Crear deploy independiente `demos.xolum.com.mx`.
4. Construir el portal modular de demos.
5. Implementar gatekeeper común por invitación.
6. Migrar la demo TMS existente a `/tms/` dentro de `XOLUM.DEMOS`.
7. Incorporar Fiscal, Sales, Nómina y futuros pilotos dentro del mismo portal inicial.
8. Separar demos a repos/deploys propios únicamente cuando aporte valor real.
9. Validar que demos no compartan secretos, cookies, almacenamiento ni credenciales con producción.
