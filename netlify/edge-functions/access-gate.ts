const COOKIE = "__Host-xolum_session";

function decodeBase64(value: string): Uint8Array {
  let normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  const binary = atob(normalized);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function parseCookie(header: string | null): Record<string, string> {
  return Object.fromEntries(
    (header || "")
      .split(/;\s*/)
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index < 0) return [decodeURIComponent(part), ""];
        return [
          decodeURIComponent(part.slice(0, index)),
          decodeURIComponent(part.slice(index + 1)),
        ];
      }),
  );
}

async function verify(token: string | undefined) {
  try {
    const [version, iv, ciphertext, tag] = String(token || "").split(".");
    if (version !== "v1" || !iv || !ciphertext || !tag) return null;

    const rawKey = Netlify.env.get("XOLUM_SESSION_COOKIE_KEY") || "";
    const keyBytes = decodeBase64(rawKey);
    if (keyBytes.length !== 32) return null;

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const ciphertextBytes = decodeBase64(ciphertext);
    const tagBytes = decodeBase64(tag);
    const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    combined.set(ciphertextBytes);
    combined.set(tagBytes, ciphertextBytes.length);

    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decodeBase64(iv),
        tagLength: 128,
      },
      cryptoKey,
      combined,
    );

    const payload = JSON.parse(new TextDecoder().decode(plaintext));
    if (!payload.exp || Date.now() / 1000 >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export default async (request: Request) => {
  const url = new URL(request.url);
  const cookies = parseCookie(request.headers.get("cookie"));
  const session = await verify(cookies[COOKIE]);

  const isAdmin = url.pathname === "/admin" || url.pathname.startsWith("/admin/");
  const isB2B = [
    "/tienda/b2b/catalogo.html",
    "/tienda/b2b/store.html",
    "/tienda/b2b/cotizaciones.html",
    "/tienda/b2b/autorizaciones.html",
  ].includes(url.pathname);

  if (isAdmin && !["SUPER_ADMIN", "ADMIN"].includes(session?.role)) {
    return Response.redirect(
      new URL(`/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`, url),
      302,
    );
  }

  if (
    isB2B &&
    !["B2B_BUYER", "B2B_APPROVER", "SUPER_ADMIN", "ADMIN"].includes(session?.role)
  ) {
    return Response.redirect(
      new URL(`/auth/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`, url),
      302,
    );
  }

  return;
};
