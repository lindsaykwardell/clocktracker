import { stagingDisabledRoute, stagingPublicPages } from "~/shared/staging";

export default defineNuxtRouteMiddleware(async (to) => {
  if (!useRuntimeConfig().public.staging || stagingPublicPages.has(to.path)) return;
  if (!useUser().value) return navigateTo("/login");
  try {
    await useRequestFetch()("/api/staging-access");
  } catch {
    return abortNavigation(createError({ statusCode: 403, statusMessage: "Staging is restricted to administrators" }));
  }
  if (stagingDisabledRoute(to.path)) return navigateTo("/");
});
