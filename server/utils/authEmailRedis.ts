import { randomUUID } from "node:crypto";
import { createClient } from "redis";
import { authEmailLimitScript, emailIdentity } from "./authEmail";

let client: ReturnType<typeof createClient> | null = null;
let connecting: Promise<unknown> | null = null;

export async function reserveAuthEmail(email: string) {
  if (!process.env.RATE_LIMIT_REDIS_URL) throw new Error("Email limiter unavailable");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!client) {
      client = createClient({
        url: process.env.RATE_LIMIT_REDIS_URL,
        socket: { connectTimeout: 750, reconnectStrategy: false },
        disableOfflineQueue: true,
        commandsQueueMaxLength: 32,
      });
      client.on("error", () => {});
      connecting = client.connect().then(redis => redis.unref());
    }
    const redis = client;
    const result = await Promise.race([
      (async () => {
        await connecting;
        return redis.eval(authEmailLimitScript, {
          keys: [`auth-email:v1:${emailIdentity(email)}`], arguments: [randomUUID()],
        }) as Promise<number[]>;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Email limiter timeout")), 1000);
      }),
    ]);
    return { allowed: result[0] === 1, retryAfter: Math.max(1, Math.ceil(result[1] / 1000)) };
  } catch {
    if (client?.isOpen) client.destroy();
    client = null;
    connecting = null;
    throw new Error("Email limiter unavailable");
  } finally {
    clearTimeout(timer);
  }
}
