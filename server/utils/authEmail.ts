import { createHash } from "node:crypto";

export function emailIdentity(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

// Reserve atomically before the browser calls Supabase; rejected requests do not extend the cooldown.
export const authEmailLimitScript = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local day = 86400000
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - day)
local count = redis.call('ZCARD', KEYS[1])
local wait = 0
if count >= 5 then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  wait = tonumber(oldest[2]) + day - now
end
if count > 0 then
  local latest = redis.call('ZREVRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  wait = math.max(wait, tonumber(latest[2]) + 300000 - now)
end
if wait > 0 then return {0, wait} end
redis.call('ZADD', KEYS[1], now, ARGV[1])
redis.call('PEXPIRE', KEYS[1], day)
return {1, 0}
`;
