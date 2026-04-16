export const chartColors = {
  // Labels
  labelColor: "oklch(92.3% 0.003 48.717)", // Stone-200
  labelBackground: "rgba(0, 0, 0, 0.5)",
  labelPadding: { top: 3, right: 4, bottom: 1, left: 3 }, // Not really a color
  labelRadius: 4, // Not really a color

  // Roles
  townsfolk: "#0090D4", // Used to be #3297F4
  outsider:  "#003EA8", // Used to be #ADC9FA
  minion:    "#B0141A", // Used to be #D08C7F
  demon:     "#8C0E12", // Used to be #8C0E12
  traveler: "#6B21A8",
  storyteller: "#FFA500",

  // Alignments
  good: "#0090D4",
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
  custom: "oklch(37.1% 0 0)", // Custom scripts -> Neutral 700
  unknown: "oklch(70.8% 0 0)", // Unknown script -> Neutral-400 (else #ff00aa?)

  // Sizes
  teensy: "#FF3547",
  small: "#E11A2C",
  medium: "#B0141A",
  large: "#8C0E12",

  // Location
  online: "#00C2A8",

  // Player Count
  p5:  "#2b1b63",
  p6:  "#3a2379",
  p7:  "#492b90",
  p8:  "#5833a7",
  p9:  "#683bbd",
  p10: "#7843d3",
  p11: "#884beb",
  p12: "#9853ff",
  p13: "#a65fff",
  p14: "#b46cff",
  p15: "#c178ff",
  p16: "#cd86ff",
  p17: "#d894ff",
  p18: "#e2a3ff",
  p19: "#ebb2ff",
  p20: "#f4c1ff",

} as const;

export type ChartColorKey = keyof typeof chartColors;






