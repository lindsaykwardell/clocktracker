export type ProtectedCategory = "search" | "games-stats";

export function protectedCategory(path: string): ProtectedCategory | null {
  path = path.split("?")[0].replace(/\/+$/, "");
  if (path === "/api/search") return "search";
  if (
    /^\/api\/user\/[^/]+\/games$/.test(path) ||
    /^\/api\/games\/community\/[^/]+$/.test(path) ||
    /^\/api\/(script|roles|community)\/[^/]+\/stats$/.test(path)
  ) return "games-stats";
  return null;
}

export const requestLimits = {
  anonymous: { search: 2, "games-stats": 5 },
  authenticated: { search: 60, "games-stats": 120 },
} as const;
