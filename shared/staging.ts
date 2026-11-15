export const stagingPublicPages = new Set(["/", "/login"]);

export function stagingDisabledRoute(path: string): boolean {
  return path === "/reset-password" || path === "/settings/password" ||
    path === "/settings/integrations" || path.startsWith("/api/auth/") ||
    path.startsWith("/api/kofi/") || path.startsWith("/api/storage/") ||
    path.startsWith("/api/settings/bgg") || path.includes("/post_to_bgg") ||
    path.endsWith("/github-issue") || path === "/api/push-subscription" ||
    path === "/api/fcm-token";
}
