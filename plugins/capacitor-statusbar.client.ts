export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  if (!config.public.isCapacitorBuild) return;

  const { StatusBar, Style } = await import("@capacitor/status-bar");

  // Style the status bar to match the app theme
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: "#0c0a09" }); // stone-950

  // Get the actual status bar height and expose as CSS variable.
  // Android WebView doesn't reliably support env(safe-area-inset-*),
  // so we measure and set it ourselves.
  const info = await StatusBar.getInfo();
  const height = info.height ?? 0;
  document.documentElement.style.setProperty(
    "--cap-status-bar-height",
    `${height}px`
  );
});
