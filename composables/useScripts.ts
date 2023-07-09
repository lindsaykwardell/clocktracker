enum Script {
  TroubleBrewing = "Trouble Brewing",
  SectsAndViolets = "Sects & Violets",
  BadMoonRising = "Bad Moon Rising",
  CustomScript = "Custom Script",
}

const baseScripts = [
  Script.TroubleBrewing,
  Script.SectsAndViolets,
  Script.BadMoonRising,
];

export const useScripts = () => {
  return {
    baseScripts,
    scriptLogo: (script: Script | string) => {
      if (script === Script.TroubleBrewing) {
        return "/img/trouble-brewing.webp";
      } else if (script === Script.SectsAndViolets) {
        return "/img/sects-and-violets.webp";
      } else if (script === Script.BadMoonRising) {
        return "/img/bad-moon-rising.webp";
      } else {
        return "/img/custom-script.webp";
      }
    },
  };
};
