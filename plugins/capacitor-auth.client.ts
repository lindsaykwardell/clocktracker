export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();

  if (!config.public.isCapacitorBuild) return;

  const { App } = await import("@capacitor/app");
  const supabase = useSupabaseClient();

  // Listen for deep link callbacks (e.g. clocktracker://auth-callback#access_token=...&refresh_token=...)
  App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.includes("auth-callback")) return;

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

      // Navigate to home
      const router = useRouter();
      router.push("/");
    }
  });
});
