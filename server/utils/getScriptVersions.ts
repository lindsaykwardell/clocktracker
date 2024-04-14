import { PrivacySetting, PrismaClient, Script } from "@prisma/client";
import axios from "axios";
import cheerio from "cheerio";

const prisma = new PrismaClient();

export async function getScriptVersions(script: Script) {
  if (!script.script_id) {
    // If the script doesn't have a script_id, it's not in the BOTC database.
    // Assume it's a custom uploaded script for the user, and check if there
    // are others with the same name.

    const scripts = await prisma.script.findMany({
      where: {
        name: script.name,
        user_id: script.user_id,
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

  if (versions.length === 1 && !versionOne.includes(versions[0].version)) {
    // If there is only one version and it's not the first, assume there are more that we need to fetch.
    try {
      const fetchedVersions = await fetchVersions(script.script_id);

      for (const version of fetchedVersions) {
        const versionedScript = {
          ...script,
          script_id: script.script_id,
          id: undefined,
          version: version,
          json_url: `https://botcscripts.com/script/${script.script_id}/${version}/download`,
          pdf_url: `https://botcscripts.com/script/${script.script_id}/${version}/download_pdf`,
        };
        const script_ = await prisma.script.upsert({
          where: {
            script_id_version: {
              script_id: versionedScript.script_id,
              version: versionedScript.version,
            },
          },
          update: {
            ...versionedScript,
          },
          create: {
            ...versionedScript,
          },
        });

        if (versions[0].version !== script_.version) {
          versions.push(script_);
        }
      }
    } catch {
      // If we can't fetch the versions, just return the one we have.
    }
  }

  return versions;
}

export function isVersionOne(version: string): boolean {
  return versionOne.includes(version);
}

const versionOne = ["1.0.0", "0.0.1", "0.0.0"];

async function fetchVersions(id: number) {
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
