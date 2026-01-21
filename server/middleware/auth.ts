import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  try {
    // serverSupabaseUser reads from cookies automatically
    const user = await serverSupabaseUser(event);
    if (user) {
      event.context.user = user;
      // Debug: log user ID to verify it's being read correctly
      if (process.env.NODE_ENV === "development") {
        const userId = (user as any).sub || (user as any).id;
        console.log("[Server Auth] User authenticated:", userId ? "Yes" : "No", userId ? `(ID: ${userId})` : "");
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log("[Server Auth] No user found in session");
    }
  } catch (error) {
    // Log the error for debugging but don't throw
    // This allows unauthenticated requests to continue
    console.error("Error in server auth middleware:", error);
  }
});
