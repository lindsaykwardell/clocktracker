import naturalOrder from "natural-order";

enum Script {
  TroubleBrewing = "Trouble Brewing",
  SectsAndViolets = "Sects and Violets",
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
    Script,
    baseScripts,
    scriptLogo: (script: Script | string) => {
      if (script === Script.TroubleBrewing) {
        return "/img/trouble_brewing.png";
      } else if (script === Script.SectsAndViolets) {
        return "/img/sects_and_violets.png";
      } else if (script === Script.BadMoonRising) {
        return "/img/bad_moon_rising.png";
      } else {
        return "/img/custom-script.webp";
      }
    },
    isBaseScript: (script: Script | string) => {
      return baseScripts.includes(script as Script);
    },
    async fetchScriptVersions(script_id: number) {
      const versions = await $fetch(
        `/api/script/${script_id}/versions`
      );

      return naturalOrder(versions)
      .orderBy("desc")
      .sort(["version"]);
    },
  };
};
