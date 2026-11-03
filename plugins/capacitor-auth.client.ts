export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();

  if (!config.public.isCapacitorBuild) return;

  const { App } = await import("@capacitor/app");
  const supabase = useSupabaseClient();

  const router = useRouter();

  App.addListener("appUrlOpen", async ({ url }) => {
    console.log("[auth] appUrlOpen:", url);

    // Handle auth callbacks (e.g. clocktracker://auth-callback#access_token=...&refresh_token=...)
    if (url.includes("auth-callback") || url.includes("access_token") || url.includes("code=")) {
      // Close the in-app browser first
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.close();
      } catch {
        // Browser plugin may not be available
      }

      // Parse tokens from URL — could be in hash fragment or query params
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      // Try hash fragment first (e.g. #access_token=...&refresh_token=...)
      if (url.includes("#")) {
        const hashParams = new URLSearchParams(url.split("#")[1]);
        accessToken = hashParams.get("access_token");
        refreshToken = hashParams.get("refresh_token");
      }

      // Fall back to query params (e.g. ?code=...)
      if (!accessToken && url.includes("?")) {
        const queryParams = new URLSearchParams(url.split("?")[1].split("#")[0]);
        const code = queryParams.get("code");
        if (code) {
          console.log("[auth] Got auth code, exchanging for session...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[auth] Code exchange failed:", error);
          } else {
            console.log("[auth] Session set via code exchange");
            router.push("/");
          }
          return;
        }
      }

      console.log("[auth] accessToken:", accessToken ? "present" : "missing");
      console.log("[auth] refreshToken:", refreshToken ? "present" : "missing");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        console.log("[auth] Session set, navigating home");
        router.push("/");
      } else {
        console.warn("[auth] Missing tokens in callback URL");
      }
      return;
    }

    // Handle deep links (e.g. https://clocktracker.app/game/abc-123)
    try {
      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search + parsed.hash;
      if (path && path !== "/") {
        router.push(path);
      }
    } catch {
      // Invalid URL — ignore
    }
  });
});
