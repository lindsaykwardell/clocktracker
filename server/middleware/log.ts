export default defineEventHandler((event) => {
  const start = Date.now();
  const ip = getRequestIP(event, { xForwardedFor: true });
  const method = event.node.req.method;
  const url = getRequestURL(event);

  event.node.res.on("finish", () => {
    const duration = Date.now() - start;
    const status = event.node.res.statusCode;
    const auth = getHeader(event, "authorization")
      ? "bearer"
      : getHeader(event, "cookie")?.includes("sb-")
        ? "cookie"
        : "anon";

    console.log(
      ` ${ip} [${method}] ${status} ${url} ${duration}ms auth=${auth}`,
    );
  });
});
