export const chartColors = {
  // Roles
  townsfolk: "oklch(62.3% 0.214 259.815)", // #3297F4
  outsider: "oklch(48.8% 0.243 264.376)", // #ADC9FA
  minion: "oklch(63.7% 0.237 25.331)", // #D08C7F
  demon: "oklch(50.5% 0.213 27.518)", // #8C0E12
  traveler: "#6B21A8",
  storyteller: "#FFA500",

  // Alignments
  good: "#3297F4",
  evil: "#8C0E12",

  // Outcomes
  win: "#008000",
  loss: "#A00A23",

  // Script types
  tb: "#A00A23", // Trouble Brewing
  bmr: "#F4C43C", // Bad Moon Rising
  snv: "#6B2FA4", // Sects & Violets
  gos: "#3E5F1C", // Garden of Sin
  tomb: "#B65AA5", // The Tomb
  mhd: "#2A6CC7", // Midnight in the House of the Damned
  gse: "#C47A2C", // The Greatest Show on Earth
  custom: "oklch(27.9% 0.041 260.031)", // Custom scripts -> Slate-900
  unknown: "oklch(70.4% 0.04 256.788)", // Unknown script -> Slate-400 (else #ff00aa?)

  // Sizes
  teensy: "#ADD8E6",
  small: "oklch(63.7% 0.237 25.331)", // 1 Minion -> Red-500
  medium: "oklch(50.5% 0.213 27.518)", // 2 Minion -> Red-700
  large: "oklch(39.6% 0.141 25.723)", // 3 Minion -> Red-900

  p5:  "oklch(38% 0.189 293.745)", // Violet-900
  p6:  "oklch(28.3% 0.141 291.089)", // Violet-950
  p7:  "oklch(90.2% 0.063 306.703)",
  p8:  "oklch(82.7% 0.119 306.383)",
  p9:  "oklch(71.4% 0.203 305.504)",
  p10: "oklch(62.7% 0.265 303.9)",
  p11: "oklch(55.8% 0.288 302.321)",
  p12: "oklch(49.6% 0.265 301.924)",
  p13: "oklch(43.8% 0.218 303.724)",
  p14: "oklch(38.1% 0.176 304.987)",
  p15: "oklch(29.1% 0.149 302.717)", // Purple-950
  p16: "oklch(59.1% 0.293 322.896)",
  p17: "oklch(51.8% 0.253 323.949)",
  p18: "oklch(45.2% 0.211 324.591)",
  p19: "oklch(40.1% 0.17 325.612)",
  p20: "oklch(29.3% 0.136 325.661)", // Fuchsia-950
} as const;

export type ChartColorKey = keyof typeof chartColors;