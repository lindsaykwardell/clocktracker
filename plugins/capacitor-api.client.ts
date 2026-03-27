export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  if (!config.public.isCapacitorBuild) return;

  const apiBaseUrl = config.public.apiBaseUrl as string;
  const supabase = useSupabaseClient();

  let accessToken: string | null = null;

  // Track the current access token
  supabase.auth.onAuthStateChange((_event, session) => {
    accessToken = session?.access_token ?? null;
  });

  // Replace globalThis.$fetch with one that rewrites /api/ URLs and attaches Bearer token
  const originalFetch = globalThis.$fetch;
  globalThis.$fetch = originalFetch.create({
    onRequest({ options, request }) {
      // Only intercept relative /api/ requests
      const url = typeof request === "string" ? request : request.toString();
      if (url.startsWith("/api/")) {
        // Rewrite to production API
        (options as any).baseURL = apiBaseUrl;
      }

      // Attach Bearer token
      if (accessToken) {
        const headers = new Headers(options.headers as HeadersInit);
        headers.set("Authorization", `Bearer ${accessToken}`);
        options.headers = headers;
      }
    },
  }) as typeof globalThis.$fetch;
});
