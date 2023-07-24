// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/supabase",
    "@vite-pwa/nuxt",
    "@pinia/nuxt",
  ],
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      link: [
        { rel: "stylesheet", href: "/index.css" },
        { rel: "icon", type: "image/png", href: "/logo-ct-sm.png" },
        { rel: "apple-touch-icon", href: "/logo-ct-sm.png" },
      ],
      script: [
        {
          "data-goatcounter": "https://clocktracker.goatcounter.com/count",
          async: true,
          src: "//gc.zgo.at/count.js",
        },
      ],
      meta: [
        {
          name: "theme-color",
          content: "#1C1917",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      sentryDsn: process.env.SENTRY_DSN,
    },
  },
  pwa: {
    registerType: "autoUpdate",
    includeAssets: [
      "/img/**",
      "/img/role/**",
      "fonts/dumbledor.ttf",
      "fonts/tradegothic.ttf",
      "/logo-ct-sm.png",
      "logo.png",
      "robots.txt",
      "index.css",
      "/_nuxt/**.css",
      "/_nuxt/**.js",
    ],
    workbox: {
      globPatterns: ["**/*.{js,css,html}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/[a-z]*\.supabase\.co\/storage\/v1\/object\/public.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'supabase-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 14 // <== 14 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ],
    },
    manifest: {
      name: "ClockTracker",
      short_name: "ClockTracker",
      description: "Record your game details from Blood on the Clocktower",
      theme_color: "#292524",
      background_color: "#1C1917",
      orientation: "any",
      display_override: ["standalone", "window-controls-overlay"],
      handle_links: "auto",
      categories: ["games", "entertainment"],
      dir: "ltr",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/pwa-128x128.png",
          sizes: "128x128",
          type: "image/png",
        },
      ],
    },
  },
});
