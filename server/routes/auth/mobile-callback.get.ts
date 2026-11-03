export default defineEventHandler((event) => {
  // This page is loaded after OAuth completes. The tokens are in the URL
  // hash fragment (#access_token=...&refresh_token=...). Since the hash
  // is only available client-side, we serve a small HTML page that reads
  // the hash and redirects to the custom scheme, which opens the app.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting to ClockTracker...</title>
  <style>
    body {
      background: #1C1917;
      color: #E7E5E4;
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
  </style>
</head>
<body>
  <p>Redirecting to ClockTracker...</p>
  <script>
    var hash = window.location.hash;
    if (hash) {
      window.location.href = 'clocktracker://auth-callback' + hash;
    }
  </script>
</body>
</html>`;
});
