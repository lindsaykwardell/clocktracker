import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.clocktracker.mobile",
  appName: "ClockTracker",
  webDir: ".output/public",
  server: {
    // Allow mixed content for development; Capacitor apps load from capacitor:// or http://localhost
    androidScheme: "https",
  },
  plugins: {
    App: {
      // Deep link handling for OAuth callback
      url: "clocktracker",
    },
  },
};

export default config;
