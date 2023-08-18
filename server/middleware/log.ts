export default defineEventHandler((event) => {
  console.log(`${event.node.req.method}: ${getRequestURL(event)}`);
});
