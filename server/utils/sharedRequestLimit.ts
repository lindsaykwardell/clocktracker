import { createClient } from "redis";
import { rateLimitScript } from "./rateLimitCore";

let client: ReturnType<typeof createClient> | null = null;
let connecting: Promise<unknown> | null = null;
let retryRedisAt = 0;

export async function sharedLimit(key: string, limit: number) {
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
      connecting = client.connect().then(redis => redis.unref());
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
    if (Date.now() >= retryRedisAt) console.warn("rate_limit_redis_unavailable cooldown_seconds=30");
    retryRedisAt = Date.now() + 30_000;
    if (client?.isOpen) client.destroy();
    client = null;
    connecting = null;
    return null;
  }
}

