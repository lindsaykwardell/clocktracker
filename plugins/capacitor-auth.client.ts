export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();

  if (!config.public.isCapacitorBuild) return;

  const { App } = await import("@capacitor/app");
  const supabase = useSupabaseClient();

  const router = useRouter();

  App.addListener("appUrlOpen", async ({ url }) => {
    // Handle auth callbacks (e.g. clocktracker://auth-callback#access_token=...&refresh_token=...)
    if (url.includes("auth-callback")) {
      const hashParams = new URLSearchParams(url.split("#")[1] || "");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Close the in-app browser
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.close();
        } catch {
          // Browser plugin may not be available
        }

        router.push("/");
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
