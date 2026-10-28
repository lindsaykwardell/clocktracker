import { createClient } from "redis";
import { createError, defineEventHandler, getHeader, setHeader, type H3Event } from "h3";
import { requestLimits, type ProtectedCategory } from "../../shared/protectedRequests";
import { anonymousIdentity, LocalRequestLimits, RequestSlots, rateLimitScript } from "./rateLimitCore";

const local = new LocalRequestLimits();
const slots = new RequestSlots();
let client: ReturnType<typeof createClient> | null = null;
let connecting: Promise<unknown> | null = null;
let retryRedisAt = 0;

async function sharedLimit(key: string, limit: number) {
  if (!process.env.RATE_LIMIT_REDIS_URL || Date.now() < retryRedisAt) return null;
  try {
    if (!client) {
      client = createClient({
        url: process.env.RATE_LIMIT_REDIS_URL,
        socket: { connectTimeout: 1000, reconnectStrategy: false },
        disableOfflineQueue: true,
        commandsQueueMaxLength: 64,
      });
      client.on("error", () => {}); // Failures are counted below without logging credentials.
      connecting = client.connect();
    }
    await connecting;
    const redis = client;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        redis.eval(rateLimitScript, { keys: [key], arguments: [String(limit)] }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("Redis timeout")), 1000);
        }),
      ]) as number[];
      return { allowed: result[0] === 1, retryAfter: Math.max(1, Math.ceil(result[1] / 1000)) };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    if (Date.now() >= retryRedisAt) console.warn("rate_limit_redis_unavailable fallback=local cooldown_seconds=30");
    retryRedisAt = Date.now() + 30_000;
    if (client?.isOpen) client.destroy();
    client = null;
    connecting = null;
    return null;
  }
}

function rejectRequest(event: H3Event, seconds: number, reason: string): never {
  setHeader(event, "Retry-After", seconds);
  setHeader(event, "Cache-Control", "private, no-store");
  console.info(`rate_limit_rejected category=${event.context.rateLimitCategory} reason=${reason} retry_after=${seconds}`);
  throw createError({
    statusCode: 429,
    statusMessage: "Too Many Requests",
    message: `Please wait ${seconds} seconds before trying again.`,
    data: { retryAfter: seconds },
  });
}

export function defineProtectedHandler<T>(category: ProtectedCategory, handler: (event: H3Event) => Promise<T>) {
  return defineEventHandler(async (event) => {
    // Auth middleware verifies the session; cookies and arbitrary headers never grant a higher limit.
    const userId = event.context.user?.id;
    const authenticated = typeof userId === "string" && userId.length > 0;
    const address = process.env.FLY_APP_NAME
      ? getHeader(event, "fly-client-ip") || "unknown"
      : event.node.req.socket?.remoteAddress || "unknown";
    const identity = authenticated ? `user:${userId}` : `ip:${anonymousIdentity(address)}`;
    const limit = requestLimits[authenticated ? "authenticated" : "anonymous"][category];
    const key = `rate-limit:v1:${category}:${identity}`;
    event.context.rateLimitCategory = category;
    // Track locally even while Redis is healthy, so an outage does not reset local usage.
    const fallback = local.consume(key, limit);
    const shared = await sharedLimit(key, limit);
    const result = shared ?? fallback;
    console.info(`rate_limit_check category=${category} identity=${authenticated ? "authenticated" : "anonymous"} backend=${shared ? "redis" : "local"} allowed=${result.allowed}`);
    if (!result.allowed) rejectRequest(event, result.retryAfter, "quota");
    const release = slots.acquire(authenticated);
    if (!release) rejectRequest(event, 5, "concurrency");
    try {
      return await handler(event);
    } finally {
      release();
    }
  });
}
