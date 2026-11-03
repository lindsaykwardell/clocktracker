export const MAX_HOURS = 168;
export function lifetime(value) {
  const hours = Number(value);
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_HOURS) throw new Error("Lifetime must be 1–168 whole hours");
  return hours;
}
export function validateId(id) {
  if (!/^[a-f0-9]{16}$/.test(id)) throw new Error("Invalid staging environment ID");
  return id;
}
export function names(id, domain) {
  validateId(id);
  if (!/^staging\.[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) throw new Error("Set STAGING_DOMAIN to staging.<your-domain>");
  return { app: `ct-stg-${id}`, db: `ct-stg-${id}-db`, hostname: `${id}.${domain}` };
}
export function extendedExpiry(state, hours, now = Date.now()) {
  if (state.status !== "ready" || now >= state.expiresAt) throw new Error("Only active environments can be extended");
  const expiresAt = now + lifetime(hours) * 3600000;
  if (expiresAt <= state.expiresAt || expiresAt > state.readyAt + MAX_HOURS * 3600000) {
    throw new Error("Extension must increase the lifetime without exceeding seven days from readiness");
  }
  return expiresAt;
}

export function validateAuth(url, key) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") throw new Error("Supabase URL must be an HTTPS origin");
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    const claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    if (key.split(".").length === 3 && claims.role === "anon") return;
  } catch { /* Reject unrecognized and privileged keys. */ }
  throw new Error("Staging requires a Supabase public/anon key, never a service-role key");
}
