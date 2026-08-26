const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);
const B2B_ROLES = new Set(["B2B_BUYER", "B2B_APPROVER", "SUPER_ADMIN", "ADMIN"]);

function loginRedirect(url: URL): Response {
  return Response.redirect(
    new URL(`/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`, url),
    302,
  );
}

async function readSession(request: Request, url: URL) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie) return null;

  try {
    const response = await fetch(new URL("/api/session", url.origin), {
      method: "GET",
      headers: {
        cookie,
        "x-xolum-edge-session-check": "1",
      },
      redirect: "manual",
    });

    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.ok || !payload?.authenticated || !payload?.user) return null;
    return payload.user;
  } catch {
    return null;
  }
}

export default async (request: Request) => {
  const url = new URL(request.url);

  const isAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const isB2B = [
    "/tienda/b2b/catalogo.html",
    "/tienda/b2b/store.html",
    "/tienda/b2b/cotizaciones.html",
    "/tienda/b2b/autorizaciones.html",
  ].includes(url.pathname);

  // Esta Edge Function corre de forma global para usar una sola regla de Netlify,
  // pero sólo consulta la sesión cuando la ruta realmente requiere protección.
  if (!isAdmin && !isB2B) return;

  const user = await readSession(request, url);

  if (isAdmin && !ADMIN_ROLES.has(user?.role)) {
    return loginRedirect(url);
  }

  if (isB2B && !B2B_ROLES.has(user?.role)) {
    return loginRedirect(url);
  }

  return;
};
