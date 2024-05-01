export default defineEventHandler((event) => {
  const ip_address = getRequestIP(event, { xForwardedFor: true});
  console.log(`${ip_address} [${event.node.req.method}]: ${getRequestURL(event)}`);
});
