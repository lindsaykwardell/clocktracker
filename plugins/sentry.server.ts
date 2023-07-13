// Initialize Sentry

import * as Sentry from "@sentry/node";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  Sentry.init({
    dsn: config.public.sentryDsn,
  })
});
