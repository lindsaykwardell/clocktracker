export enum Theme {
  LIGHT = "light",
  DARK = "dark",
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
  localStorage.theme = "light";
  document.documentElement.classList.remove("dark");
}

// Whenever the user explicitly chooses dark mode
export function useDarkMode() {
  localStorage.theme = "dark";
  document.documentElement.classList.add("dark");
}

// Whenever the user explicitly chooses to respect the OS preference
export function useOSDefaultMode() {
  localStorage.removeItem("theme");

  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
