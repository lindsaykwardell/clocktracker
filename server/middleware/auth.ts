import { serverSupabaseUser } from "#supabase/server";
import { jwtVerify } from "jose";

export default defineEventHandler(async (event) => {
  // Skip auth for CORS preflight requests
  if (event.method === "OPTIONS") {
    return;
  }

  // Check for Bearer token auth (used by Capacitor mobile app)
  const authHeader = getHeader(event, "authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);
        event.context.user = { ...payload, id: payload.sub };
        return;
      } catch {
        // Invalid token — fall through to cookie auth
      }
    }
  }

  // Existing cookie-based auth
  try {
    const claims = await serverSupabaseUser(event);
    if (claims) {
      event.context.user = { ...claims, id: claims.sub };
    }
  } catch {
    // do nothing
  }
});
