# XOLUM — separación de entornos

Fecha: 2026-08-27

## Regla arquitectónica

XOLUM.WEB no debe alojar demos privadas dentro del mismo runtime que TMS productivo.

## Estado observado

- `preview/tms.html` es la landing pública de TMS.
- `preview/tms-app.html` está enlazada desde TMS como demo interactiva.
- `preview/tms-driver.html` y archivos relacionados conviven en el mismo repositorio/runtime.
- `netlify/edge-functions/access-gate.ts` protege actualmente `/admin` y rutas B2B seleccionadas, pero no protege `/tms`, `/tms.html`, `/tms-app.html` ni `/tms-driver.html`.
- La sesión existente se consulta mediante `/api/session` y el login común entra por `/auth/login`.

## Arquitectura objetivo

### Producción TMS

Repositorio/runtime exclusivo de producción.

Rutas públicas de producto:
- `/tms` o dominio dedicado para la entrada oficial.
- Sin enlaces a demos, pilotos o maquetas.

Rutas de aplicación:
- Protegidas por autenticación productiva.
- Sesiones revocables y de corta duración.
- Autorización por tenant/empresa y rol.
- Persistencia productiva independiente del portal de demos.
- Auditoría de login, logout, fallos, refresh y revocación.

### Demos privadas

Repositorio y deploy independientes de `XOLUM.WEB` y del TMS productivo.

Destino recomendado:
- repo: `XOLUM.DEMOS` o equivalente.
- host: `demos.xolum.com.mx` preferido sobre `/demos` para maximizar aislamiento.

Estructura sugerida:

```
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
- gatekeeper independiente.
- acceso únicamente por invitación.
- credenciales de demos nunca compartidas con TMS.
- cookie, secreto de sesión, almacenamiento y usuarios independientes.
- no reutilizar tokens o base productiva de TMS.

## UI de login

TMS y Demos comparten sistema visual XOLUM, no implementación de sesión.

- fondo hueso o negro profundo.
- tipografía institucional.
- usuario.
- contraseña.
- acción `ENTRAR ↗`.
- mensajes de error sobrios y sin fuga de información.
- sin componentes genéricos de plantilla.

## ZONA CIEGA

No se implementa todavía un nuevo esquema JWT/base productiva porque el repositorio actual no contiene evidencia suficiente para determinar la base de datos productiva definitiva de TMS, estrategia de multi-tenancy, rotación de claves, refresh tokens, revocación y migración de usuarios. Implementarlo suponiendo esos datos sería un riesgo de seguridad.

## Criterio de migración

1. Crear repo/deploy independiente para Demos.
2. Copiar las demos existentes al nuevo repo y validarlas allí.
3. Implementar gatekeeper exclusivo del entorno Demos.
4. Retirar `tms-app.html` y cualquier demo del runtime de producción.
5. Implementar/validar autenticación TMS productiva.
6. Proteger las rutas TMS con el mecanismo definitivo.
7. Eliminar referencias cruzadas entre TMS y Demos.
8. Ejecutar smoke, seguridad y rollback antes de producción.
