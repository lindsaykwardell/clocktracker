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

type ScriptCategory =
  | "trouble-brewing"
  | "sects-and-violets"
  | "bad-moon-rising"
  | "custom"
  | "unknown";

function scriptCategory(script?: Script | string | null): ScriptCategory {
  if (!script) return "unknown";
  if (script === Script.TroubleBrewing) return "trouble-brewing";
  if (script === Script.SectsAndViolets) return "sects-and-violets";
  if (script === Script.BadMoonRising) return "bad-moon-rising";
  return "custom";
}

function scriptBgClasses(
  script?: Script | string | null,
  hasCustomBackground = false
) {
  const category = scriptCategory(script);
  return {
    "is-trouble-brewing": category === "trouble-brewing",
    "is-sects-and-violets": category === "sects-and-violets",
    "is-bad-moon-rising": category === "bad-moon-rising",
    "is-custom-script":
      category === "custom" && !hasCustomBackground && !!script,
    "is-unknown-script": category === "unknown" && !hasCustomBackground,
  };
}

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
    scriptCategory,
    scriptBgClasses,
    async fetchScriptVersions(script_id: number) {
      const versions = await $fetch(`/api/script/${script_id}/versions`);

      return naturalOrder(versions).orderBy("desc").sort(["version"]);
    },
    async uploadScript() {
      return new Promise((resolve, reject) => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json";
        fileInput.onchange = async () => {
          if (!fileInput.files || !fileInput.files.length) return;

          const file = fileInput.files[0];
          // The file is a JSON array. Extract it from the file and send it to the server

          const body = await file.text();
          // Parse the JSON string into an object
          const scriptBody = JSON.parse(body);

          // find the metadata
          const metaLocation = scriptBody.findIndex(
            (item: any) => item.id === "_meta"
          );

          // if its not 0, we need to move it to the front
          if (metaLocation > 0) {
            const meta = scriptBody.splice(metaLocation, 1);
            scriptBody.unshift(meta[0]);
          }

          // if it doesn't exist, we need to add it.
          if (metaLocation === -1) {
            scriptBody.unshift({
              id: "_meta",
            });
          }

          // if it doesn't have a name, we need to add it.
          if (!scriptBody[0].name) {
            scriptBody[0].name = file.name;
          }

          try {
            const script = await $fetch("/api/script/upload/upload", {
              method: "POST",
              body: JSON.stringify(scriptBody),
            });

            resolve(script);
          } catch (err) {
            console.error(err);
            reject(err);
          }
        };

        fileInput.click();
      });
    },
  };
};
