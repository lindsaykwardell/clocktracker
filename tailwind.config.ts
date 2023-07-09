import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        piratesbay: ["PiratesBay", "serif"],
        raleway: ["Raleway", "sans-serif"],
        julee: ["Julee", "cursive"],
      },
    },
  },
  plugins: [],
};
