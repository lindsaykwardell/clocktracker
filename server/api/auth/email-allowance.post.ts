import { createError, defineEventHandler, readBody, setHeader } from "h3";
import { reserveAuthEmail } from "../../utils/authEmailRedis";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  const body = await readBody(event);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: "Enter a valid email address." });
  }
  let quota;
  try {
    quota = await reserveAuthEmail(email);
  } catch {
    console.warn("auth_email_limit_unavailable");
    throw createError({ statusCode: 503, message: "Email requests are temporarily unavailable. Please try again later." });
  }
  if (!quota.allowed) {
    setHeader(event, "Retry-After", quota.retryAfter);
    console.info(`auth_email_limit_rejected retry_after=${quota.retryAfter}`);
    throw createError({ statusCode: 429, message: "Please wait before requesting another email.", data: { retryAfter: quota.retryAfter } });
  }
  return { allowed: true };
});
