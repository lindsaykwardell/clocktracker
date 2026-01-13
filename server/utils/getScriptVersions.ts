import { PrivacySetting, Script } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import axios from "axios";
import * as cheerio from "cheerio";
import { prisma } from "./prisma";

export async function getScriptVersions(script: Script, me: User | null) {
  if (script.is_custom_script) {
    // If the script is custom, it's not in the BOTC database.
    // Check if there are others with the same name belonging
    // to the same user.

    const scripts = await prisma.script.findMany({
      where: {
        name: script.name,
        // We _should_ be pulling by script_id, but we aren't right now.
        // Why??
        OR: [
          // If someone owns this script
          // This is weird and I need to come back to it,
          // but since uploaded scripts are _technically_ public,
          // we can just fetch any versions,
          {
            user_id: {
              equals: script.user_id,
            },
          },
          // If you own this script
          {
            user_id: {
              equals: me?.id || "",
            },
          },
          // If you have played this script
          {
            games: {
              some: {
                user_id: {
                  equals: me?.id || "",
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        version: true,
      },
    });

    return scripts;
  }

  const versions = await prisma.script.findMany({
    where: {
      script_id: script.script_id,
    },
    select: {
      id: true,
      version: true,
    },
  });

  return versions;
}

export function isVersionOne(version: string): boolean {
  return versionOne.includes(version);
}

const versionOne = ["1.0.0", "0.0.1", "0.0.0"];

async function fetchVersions(id: string) {
  const response = await axios.get(`https://botcscripts.com/script/${id}`);
  const $ = cheerio.load(response.data);
  // const description = $("div#notes").text();
  const versions: string[] = [];
  $("select[name=selected_version] option").each((index, element) => {
    const version = $(element).text().trim();
    versions.push(version);
  });

  return versions;
}
