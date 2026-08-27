# XOLUM — separación de entornos

Fecha: 2026-08-27

## Regla arquitectónica

XOLUM.WEB no aloja demos privadas dentro del mismo runtime ni de la misma base de código activa que TMS productivo.

Las demos conviven inicialmente entre ellas dentro de un único repositorio y portal `XOLUM.DEMOS`. Sólo se separarán por producto cuando exista una razón técnica real: escala, seguridad, equipo, ciclo de release o aislamiento de infraestructura.

## Estado actual

### Producción pública

`PabloMtz2450/XOLUM.WEB` gobierna `xolum.com.mx` y permanece separado de las demos.

- Home como manifiesto de marca.
- Store y B2B públicos.
- `/tms`, `/tms/` y `/tms.html` requieren sesión autenticada.
- Los artefactos demo TMS fueron retirados del árbol productivo.
- El build y post-build hardening impiden que el bundle histórico vuelva a publicarlos.

### Repositorio definitivo de demos

Ya existe:

```text
PabloMtz2450/XOLUM.DEMOS
```

Estado:

- repositorio privado;
- separado físicamente de `XOLUM.WEB`;
- portal inicial creado bajo `public/index.html`;
- arquitectura documentada en `ARCHITECTURE.md`;
- migración selectiva TMS documentada en `MIGRATION_TMS.md`;
- no debe desplegarse públicamente hasta implementar el gatekeeper independiente.

Estructura objetivo inicial:

```text
XOLUM.DEMOS/
├── public/
│   ├── index.html
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

## Fuente histórica de la demo TMS

Las ramas de `XOLUM.WEB` ya no son destinos de desarrollo:

```text
extract/xolum-demos-2026-08-27
└── respaldo histórico original

seed/xolum-demos
└── semilla temporal preparada para migración
```

Su función actual es únicamente preservar y verificar la demo original mientras se copia selectivamente a `XOLUM.DEMOS`.

No se debe copiar el árbol completo de `XOLUM.WEB`. Quedan fuera Home, B2B, Auth0 productivo, APIs de negocio, respaldos, secretos y configuración productiva.

Artefactos TMS identificados para migración:

- `preview/tms-app.html`
- `preview/tms-core.js`
- `preview/tms.js`
- `preview/tms-driver.html`
- `preview/tms-driver.js`
- `preview/tms-driver-manifest.json`
- `preview/tms-driver-sw.js`
- `preview/tms-driver-sw-register.js`
- assets mínimos requeridos por la demo.

## Regla de crecimiento

No crear un repositorio por demo desde el inicio.

TMS, Fiscal, Sales, Nómina y futuros pilotos nacen dentro de `XOLUM.DEMOS`. Una demo podrá extraerse posteriormente a otro repo/deploy manteniendo su URL pública mediante routing o proxy.

Ejemplo futuro:

```text
XOLUM.DEMOS            -> portal, gatekeeper e invitaciones
XOLUM.DEMOS.TMS        -> runtime demo TMS, sólo si llega a necesitarlo
XOLUM.DEMOS.FISCAL     -> runtime demo Fiscal, sólo si llega a necesitarlo
```

## Gatekeeper de demos

El portal de demos tendrá autenticación común e independiente de producción.

Debe permitir:

- acceso por invitación;
- usuario y vigencia;
- permisos por producto/proyecto;
- revocación;
- auditoría de accesos;
- sesiones, cookies, secretos y almacenamiento propios.

Nunca reutilizar credenciales, cookies, tokens, secretos ni persistencia del TMS productivo.

Mientras este gatekeeper no exista, `XOLUM.DEMOS` no se considera apto para un deploy público.

## UI de login

TMS y Demos comparten sistema visual XOLUM, no implementación de sesión.

- fondo hueso o negro profundo;
- tipografía institucional;
- sólo campos esenciales;
- acción `ENTRAR ↗`;
- mensajes de error sobrios y sin fuga de información;
- sin plantillas genéricas.

## ZONAS CIEGAS vigentes de TMS productivo

No se inventa todavía un nuevo esquema JWT/base productiva porque no existe evidencia suficiente para determinar con seguridad:

- base de datos productiva definitiva de TMS;
- estrategia final de multi-tenancy;
- catálogo definitivo de roles TMS;
- rotación de claves;
- política de refresh/revocación;
- migración de usuarios;
- infraestructura objetivo para miles de usuarios.

## Flujo oficial actualizado

```text
extract/xolum-demos-2026-08-27
        respaldo histórico
              │
              ▼
seed/xolum-demos
        semilla temporal
              │
              ▼
PabloMtz2450/XOLUM.DEMOS
        repositorio definitivo ya creado
              │
              ▼
demos.xolum.com.mx
        deploy futuro tras gatekeeper
```

Después de validar la migración TMS:

- `extract/...` queda sólo como respaldo histórico;
- `seed/...` queda congelada como evidencia de migración;
- ninguna de esas ramas recibe nuevas funcionalidades;
- toda nueva demo se desarrolla en `XOLUM.DEMOS`.

## Pendientes actuales

1. Migrar íntegramente la demo TMS a `XOLUM.DEMOS/public/tms/` sin copiar código productivo ajeno.
2. Validar equivalencia funcional de TMS y App Operador.
3. Sustituir el gate estático heredado por gatekeeper independiente con invitaciones.
4. Crear deploy independiente y asignar `demos.xolum.com.mx` únicamente después de la protección de acceso.
5. Incorporar Fiscal, Sales, Nómina y futuros pilotos dentro del mismo portal inicial.
6. Separar demos a repos/deploys propios sólo cuando aporte valor real.
