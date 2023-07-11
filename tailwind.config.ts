import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        dumbledor: ["Dumbledor", "serif"],
        gothic: ["Trade Gothic", "sans-serif"],
        raleway: ["Raleway", "sans-serif"],
        julee: ["Julee", "cursive"],
      },
    },
  },
  plugins: [],
};
