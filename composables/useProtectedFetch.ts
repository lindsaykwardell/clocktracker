import type { FetchOptions } from "ofetch";
import { protectedCategory } from "~/shared/protectedRequests";

export function useProtectedFetch() {
  const requestFetch = useRequestFetch();
  const notice = useState("rate-limit-notice", () => ({ until: 0, message: "" }));
  return async function protectedFetch<T = unknown>(url: string, options: FetchOptions<"json"> = {}): Promise<T> {
    if (!protectedCategory(url)) throw new Error("Expected a protected API route");
    try {
      // Request-scoped fetch forwards verified session cookies and Fly's client IP during SSR.
      const fetcher = import.meta.server ? requestFetch : $fetch;
      return await fetcher<T>(url, { ...options, retry: 0 }) as T;
    } catch (error: any) {
      if (error?.statusCode === 429 || error?.response?.status === 429) {
        const seconds = Math.max(1, Number(error?.data?.data?.retryAfter || error?.response?.headers?.get("retry-after")) || 60);
        notice.value = {
          until: Date.now() + seconds * 1000,
          message: "Too many requests. Your existing results have been kept.",
        };
      }
      throw error;
    }
  };
}
