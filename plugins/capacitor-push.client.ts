export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  if (!config.public.isCapacitorBuild) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const router = useRouter();
  const supabase = useSupabaseClient();

  let currentToken: string | null = null;

  // Register the device token with the server
  async function registerToken(token: string) {
    currentToken = token;
    try {
      await $fetch("/api/fcm-token", {
        method: "POST",
        body: { token },
      });
    } catch (err) {
      console.error("[push] Failed to register FCM token:", err);
    }
  }

  // Unregister the device token from the server
  async function unregisterToken() {
    if (!currentToken) return;
    try {
      await $fetch("/api/fcm-token", {
        method: "DELETE",
        body: { token: currentToken },
      });
    } catch (err) {
      console.error("[push] Failed to unregister FCM token:", err);
    }
    currentToken = null;
  }

  // Request permission and register for push
  async function initPush() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      return;
    }

    await PushNotifications.register();
  }

  // Listen for successful registration — receives the FCM device token
  await PushNotifications.addListener("registration", async (token) => {
    await registerToken(token.value);
  });

  // Listen for registration errors
  await PushNotifications.addListener("registrationError", (error) => {
    console.error("[push] Registration error:", error);
  });

  // Handle notification tap — navigate to the URL in the data payload
  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      const url = notification.notification.data?.url;
      if (url) {
        router.push(url);
      }
    }
  );

  // Initialize push when user is signed in
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user) {
    initPush();
  }

  // React to auth state changes
  supabase.auth.onAuthStateChange(async (event) => {
    if (event === "SIGNED_IN") {
      await initPush();
    } else if (event === "SIGNED_OUT") {
      await unregisterToken();
    }
  });
});
