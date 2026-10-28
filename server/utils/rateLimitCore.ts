import { createHash } from "node:crypto";
import ipaddr from "ipaddr.js";

export function anonymousIdentity(address: string) {
  try {
    const ip = ipaddr.process(address);
    const normalized = ip.kind() === "ipv6"
      ? ip.toByteArray().slice(0, 8).join(".") + "/64"
      : ip.toString();
    return createHash("sha256").update(normalized).digest("hex");
  } catch {
    return "unknown";
  }
}

export class LocalRequestLimits {
  private entries = new Map<string, { count: number; expires: number }>();
  constructor(private capacity = 10_000) {}

  consume(key: string, limit: number, now = Date.now()) {
    let entry = this.entries.get(key);
    if (!entry || entry.expires <= now) {
      if (this.entries.size >= this.capacity) {
        for (const [key, value] of this.entries) {
          if (value.expires <= now) this.entries.delete(key);
        }
        if (this.entries.size >= this.capacity && !entry) {
          return { allowed: false, retryAfter: 60 };
        }
      }
      entry = { count: 0, expires: now + 60_000 };
      this.entries.set(key, entry);
    }
    entry.count++;
    return {
      allowed: entry.count <= limit,
      retryAfter: Math.max(1, Math.ceil((entry.expires - now) / 1000)),
    };
  }
}

export class RequestSlots {
  private total = 0;
  private anonymous = 0;

  acquire(authenticated: boolean): (() => void) | null {
    if (this.total >= 4 || (!authenticated && this.anonymous >= 2)) return null;
    this.total++;
    if (!authenticated) this.anonymous++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.total--;
      if (!authenticated) this.anonymous--;
    };
  }
}

// An atomic, expiring counter: rejected requests do not extend the window.
export const rateLimitScript = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('SET', KEYS[1], 1, 'PX', 60000)
  return {1, 60000}
end
if count >= tonumber(ARGV[1]) then return {0, ttl} end
redis.call('INCR', KEYS[1])
return {1, ttl}
`;
