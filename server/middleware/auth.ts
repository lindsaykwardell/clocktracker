import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { jwtVerify } from "jose";

import { enforceStagingAccess } from "../utils/stagingAccess";
import { prisma } from "../utils/prisma";

export default defineEventHandler(async (event) => {
  if (process.env.STAGING === "true") {
    const token = getHeader(event, "authorization")?.match(/^Bearer (.+)$/)?.[1];
    try {
      if (token) {
        const client = await serverSupabaseClient(event);
        const { data, error } = await client.auth.getUser(token);
        if (!error && data.user) event.context.user = data.user;
      } else {
        const claims = await serverSupabaseUser(event);
        if (claims) event.context.user = { ...claims, id: claims.sub };
      }
    } catch { /* Missing or invalid credentials remain unauthenticated. */ }
    return enforceStagingAccess(event, {
      enabled: true,
      expiresAt: process.env.STAGING_EXPIRES_AT,
      isAdmin: async (id) => (await prisma.userSettings.findUnique({
        where: { user_id: id }, select: { is_admin: true },
      }))?.is_admin === true,
    });
  }
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
