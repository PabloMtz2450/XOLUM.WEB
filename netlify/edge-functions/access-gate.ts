import { createDecipheriv } from "node:crypto";
import { Buffer } from "node:buffer";
import type { Context } from "@netlify/edge-functions";

const COOKIE = "__Host-xolum_session";
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);
const B2B_ROLES = new Set(["B2B_BUYER", "B2B_APPROVER", "SUPER_ADMIN", "ADMIN"]);

function loginRedirect(url: URL): Response {
  return Response.redirect(
    new URL(`/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`, url),
    302,
  );
}

function sessionKey(): Buffer | null {
  try {
    const raw = Netlify.env.get("XOLUM_SESSION_COOKIE_KEY") || "";
    const key = Buffer.from(raw, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

function verifySessionToken(token: string | undefined) {
  try {
    const [version, iv, ciphertext, tag] = String(token || "").split(".");
    if (version !== "v1" || !iv || !ciphertext || !tag) return null;

    const key = sessionKey();
    if (!key) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");

    const payload = JSON.parse(plaintext);
    if (!payload?.exp || Date.now() / 1000 >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  const isAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const isB2B = [
    "/tienda/b2b/catalogo.html",
    "/tienda/b2b/store.html",
    "/tienda/b2b/cotizaciones.html",
    "/tienda/b2b/autorizaciones.html",
  ].includes(url.pathname);

  // Una sola regla global evita exceder el límite de reglas Edge del plan.
  // Las rutas públicas continúan sin trabajo criptográfico adicional.
  if (!isAdmin && !isB2B) return;

  const token = context.cookies.get(COOKIE);
  const session = verifySessionToken(token);

  if (isAdmin && !ADMIN_ROLES.has(session?.role)) {
    return loginRedirect(url);
  }

  if (isB2B && !B2B_ROLES.has(session?.role)) {
    return loginRedirect(url);
  }

  return;
};
