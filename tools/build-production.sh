#!/usr/bin/env bash
set -euo pipefail

BUNDLE="production/XOLUM_RUNTIME_BASE_GITOPT_2026-08-25.zip"
OUT=".xolum-prod"

if [[ ! -f "$BUNDLE" ]]; then
  echo "ERROR: falta $BUNDLE. Se cancela el build para impedir un despliegue incompleto." >&2
  exit 42
fi

rm -rf "$OUT"
mkdir -p "$OUT"
unzip -q "$BUNDLE" -d "$OUT"

# Overlay de los productos web que evolucionan en XOLUM.WEB.
cp preview/tms.html "$OUT/public/tms.html"
cp preview/tms-app.html "$OUT/public/tms-app.html"
cp preview/tms-core.js "$OUT/public/tms-core.js"
cp preview/tms.js "$OUT/public/tms.js"
cp preview/tms-driver.html "$OUT/public/tms-driver.html"
cp preview/tms-driver.js "$OUT/public/tms-driver.js"
cp preview/tms-driver-manifest.json "$OUT/public/tms-driver-manifest.json"
cp preview/tms-driver-sw.js "$OUT/public/tms-driver-sw.js"
mkdir -p "$OUT/public/assets/tms"
cp preview/assets/tms/* "$OUT/public/assets/tms/"

# La identidad autorizada del bundle gobierna producción. El preview sólo usa la misma versión de 64 px.

# Bloqueos de regresión obvios.
if grep -R "XOLUM-DEMO" "$OUT/public" >/dev/null 2>&1; then
  echo "ERROR: se detectó el código demo legado XOLUM-DEMO en archivos públicos." >&2
  exit 43
fi

if grep -R "XOLUM-TMS-DEMO-2026" "$OUT/public/tms"* >/dev/null 2>&1; then
  echo "ERROR: el código TMS de prueba quedó expuesto en texto plano dentro del HTML/JS público." >&2
  exit 44
fi

node "$OUT/tools/validate-preview-safe.mjs"
node "$OUT/tools/validate-role-hardening.mjs"
node "$OUT/tools/validate-security.mjs"

echo "XOLUM production candidate assembled and validated."
