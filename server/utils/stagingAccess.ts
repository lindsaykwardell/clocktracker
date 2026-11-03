import { createError, getRequestURL, sendRedirect, setHeader, type H3Event } from "h3";
import { stagingDisabledRoute, stagingPublicPages } from "../../shared/staging";

interface StagingOptions {
  enabled: boolean;
  expiresAt: string | undefined;
  isAdmin: (id: string) => Promise<boolean>;
}

export async function enforceStagingAccess(event: H3Event, options: StagingOptions) {
  if (!options.enabled) return;
  setHeader(event, "Cache-Control", "private, no-store");
  setHeader(event, "X-Robots-Tag", "noindex, nofollow, noarchive");
  const expires = Date.parse(options.expiresAt ?? "");
  if (!Number.isFinite(expires) || Date.now() >= expires) {
    throw createError({ statusCode: 410, statusMessage: "Staging environment expired" });
  }
  const path = getRequestURL(event).pathname.replace(/\/+$/, "") || "/";
  // Only application-owned static resources; never exempt APIs by extension.
  const asset = path.startsWith("/_nuxt/") || path.startsWith("/img/") ||
    path.startsWith("/fonts/") || ["/logo.png", "/logo-ct-sm.png", "/index.css", "/favicon.ico"].includes(path);
  if (["GET", "HEAD"].includes(event.method) && (stagingPublicPages.has(path) || asset)) return;

  const userId = event.context.user?.id;
  if (!userId) {
    if (!path.startsWith("/api/") && event.method === "GET") return sendRedirect(event, "/login", 302);
    throw createError({ statusCode: 401, statusMessage: "Sign in to staging" });
  }
  // Database failures fail closed. Admin status is checked on every protected request.
  if (!(await options.isAdmin(userId))) {
    throw createError({ statusCode: 403, statusMessage: "Staging is restricted to administrators" });
  }
  if (stagingDisabledRoute(path)) {
    throw createError({ statusCode: 403, statusMessage: "This action is disabled in staging" });
  }
}
