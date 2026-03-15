export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

function tryLocalStorage(fn: () => void) {
  try {
    fn();
  } catch {
    // localStorage may be unavailable (e.g. Safari private browsing, disabled cookies)
  }
}

export function themeIs() {
  if (document.documentElement.classList.contains("dark")) {
    return Theme.DARK;
  } else {
    return Theme.LIGHT;
  }
}

export function themeIsLight() {
  return themeIs() === Theme.LIGHT;
}

export function themeIsDark() {
  return themeIs() === Theme.DARK;
}

// Whenever the user explicitly chooses light mode
export function useLightMode() {
  tryLocalStorage(() => { localStorage.theme = "light"; });
  document.documentElement.classList.remove("dark");
}

// Whenever the user explicitly chooses dark mode
export function useDarkMode() {
  tryLocalStorage(() => { localStorage.theme = "dark"; });
  document.documentElement.classList.add("dark");
}

// Whenever the user explicitly chooses to respect the OS preference
export function useOSDefaultMode() {
  tryLocalStorage(() => { localStorage.removeItem("theme"); });

  let storedTheme: string | null = null;
  let hasTheme = false;
  try {
    storedTheme = localStorage.theme;
    hasTheme = "theme" in localStorage;
  } catch {
    // localStorage unavailable
  }

  if (
    storedTheme === "dark" ||
    (!hasTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
