export default defineEventHandler(() => {
  if (process.env.STAGING !== "true") throw createError({ statusCode: 404 });
  // Authentication and authorization are enforced by server/middleware/auth.ts.
  return { allowed: true };
});
