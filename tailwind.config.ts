import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default <Partial<Config>>{
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        sorts: ["Sorts Mill Goudy", "serif"],
        gothic: ["Trade Gothic", "sans-serif"],
      },
      colors: {
        
        "primary-dark": colors.purple[900],
        "primary-darkest": colors.purple[950],
        secondary: colors.stone[600],
        // "secondary-light": colors.stone[500],
        // "secondary-dark": colors.stone[700],
        copy: colors.stone[200],
        danger: colors.red[900],
        // "danger-light": colors.red[800],
        "danger-dark": colors.red[950],
        'muted': colors.stone[500],
        // New/Updated
        primary: colors.purple[700],
        "primary-content": colors.purple[100],
        positive: colors.emerald[400],
        "positive-content": colors.emerald[900],
        caution: colors.amber[400],
        "caution-content": colors.amber[900],
        negative: colors.rose[500],
        "negative-content": colors.rose[950],
        discord: "#5865F2",
        "discord-content": "#ffffff",
        "bgg-purple": "#3f3a60",
        "bgg-purple-content": "#ffffff",
        "bgg-orange": "#ff5100",
        "bgg-orange-content": "#000000",
        "bgstats-grey": "#273039",
        "bgstats-grey-content": "#ffffff",
        "bgstats-green": "#1c8e55",
        digital: "#00C2A8",
        
        // Dark theme
        "dark-primary": colors.purple[600],
        "discord-dark": "#4752C4",
      },
      dropShadow: {
        glow: [
          "0 0px 20px rgba(255,255, 255, 0.35)",
          "0 0px 65px rgba(255, 255,255, 0.2)",
        ],
      },
    },
  },
  plugins: [],
};
