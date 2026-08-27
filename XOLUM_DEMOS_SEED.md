# XOLUM.DEMOS — semilla de migración

Esta rama (`seed/xolum-demos`) es la base temporal para crear el futuro repositorio independiente `XOLUM.DEMOS`.

## Regla

- `extract/xolum-demos-2026-08-27` queda como respaldo histórico de los archivos originales extraídos de `XOLUM.WEB`.
- `seed/xolum-demos` es la única base de trabajo para preparar el nuevo portal de demos.
- Cuando exista el repositorio `XOLUM.DEMOS`, el contenido de esta rama se migrará una sola vez y el desarrollo continuará exclusivamente allí.
- No se desarrollan nuevas demos en `XOLUM.WEB`.
- No se reutilizan credenciales, cookies, secretos, almacenamiento o sesiones del TMS productivo.

## Estructura inicial objetivo

```text
XOLUM.DEMOS/
├── public/
│   ├── index.html              # portal común de demos
│   ├── login/                  # gatekeeper por invitación
│   ├── tms/                    # demo TMS + operador
│   ├── fiscal/                 # futura demo XOLUM Fiscal
│   ├── sales/                  # futura demo XOLUM Sales
│   ├── nomina/                 # futura demo Nómina
│   └── proyectos/              # pilotos adicionales
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

## Evolución

Se empieza con un único repositorio y un único portal de autenticación para todas las demos. Una demo sólo se separará a otro repositorio/deploy cuando exista una razón real de escala, seguridad, equipo o ciclo de release. La URL pública podrá mantenerse estable mediante routing/proxy.
