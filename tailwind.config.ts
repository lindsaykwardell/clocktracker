import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default <Partial<Config>>{
  darkMode: "selector",
  theme: {
    extend: {
      fontFamily: {
        dumbledor: ["Dumbledor", "serif"],
        gothic: ["Trade Gothic", "sans-serif"],
      },
      colors: {
        primary: colors.purple[800],
        "primary-light": colors.purple[700],
        "primary-dark": colors.purple[900],
        "primary-darkest": colors.purple[950],
        secondary: colors.stone[600],
        "secondary-light": colors.stone[500],
        "secondary-dark": colors.stone[700],
        copy: colors.stone[200],
        danger: colors.red[900],
        "danger-light": colors.red[800],
        "danger-dark": colors.red[950],
        discord: "#5865F2",
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
