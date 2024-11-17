// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  experimental: {
    viewTransition: true,
  },
  sourcemap: true,

  devtools: { enabled: false },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/supabase",
    "@vite-pwa/nuxt",
    "@pinia/nuxt",
    "floating-vue/nuxt",
    "nuxt-cron",
    "nuxt-bugsnag",
  ],

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      link: [
        { rel: "stylesheet", href: "/index.css" },
        { rel: "icon", type: "image/png", href: "/logo-ct-sm.png" },
        { rel: "apple-touch-icon", href: "/logo-ct-sm.png" },
        { rel: "apple-touch-startup-image", href: "/logo-ct-sm.png" },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-640x1136.png",
          media:
            "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-750x1294.png",
          media:
            "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-1242x2148.png",
          media:
            "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-1125x2436.png",
          media:
            "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-1536x2048.png",
          media:
            "(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-1668x2224.png",
          media:
            "(min-device-width: 834px) and (max-device-width: 834px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)",
        },
        {
          rel: "apple-touch-startup-image",
          href: "/launch-2048x2732.png",
          media:
            "(min-device-width: 1024px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)",
        },
      ],
      script: [
        {
          "data-goatcounter": "https://clocktracker.goatcounter.com/count",
          async: true,
          src: "//gc.zgo.at/count.js",
        },
        {
          children: `
          if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          `,
        },
      ],
      meta: [
        {
          name: "theme-color",
          content: "#1C1917",
        },
        {
          name: "apple-mobile-web-app-title",
          content: "ClockTracker",
        },
        {
          name: "apple-mobile-web-app-capable",
          content: "yes",
        },
      ],
    },
  },

  supabase: {
    redirect: false,
  },

  runtimeConfig: {
    public: {},
  },

  bugsnag: {
    publishRelease: true,
    // performance: true,
    baseUrl: "https://clocktracker.app",
    disableLog: true,
    config: {
      apiKey: process.env.BUGSNAG_API_KEY!,
      enabledReleaseStages: ["production"],
      releaseStage: process.env.NODE_ENV,
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
      "launch-640x1136.png",
      "launch-750x1294.png",
      "launch-1242x2148.png",
      "launch-1125x2436.png",
      "launch-1536x2048.png",
      "launch-1668x2224.png",
      "launch-2048x2732.png",
    ],
    workbox: {
      globPatterns: ["**/*.{js,css,html}"],
      runtimeCaching: [
        {
          urlPattern:
            /^https:\/\/[a-z]*\.supabase\.co\/storage\/v1\/object\/public.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "supabase-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache the API requests to the ClockTracker API
        {
          urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "clocktracker-api-cache",
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
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

  cron: {
    timeZone: "America/Los_Angeles",
  },

  routeRules: {
    "/scripts/**": {
      ssr: false,
    },
    "/roles/**": {
      ssr: false,
    },
  },

  compatibilityDate: "2024-09-21",
});
