export default defineEventHandler((event) => {
  const origin = getHeader(event, "origin");

  const allowedOrigins = [
    "capacitor://localhost",
    "http://localhost",
    "https://localhost",
  ];
  if (!origin || !allowedOrigins.includes(origin)) {
    return;
  }

  setHeader(event, "Access-Control-Allow-Origin", origin);
  setHeader(
    event,
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  setHeader(
    event,
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  setHeader(event, "Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (event.method === "OPTIONS") {
    setResponseStatus(event, 204);
    return "";
  }
});
