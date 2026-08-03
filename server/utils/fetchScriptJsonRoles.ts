import type { Script } from "~/server/generated/prisma/client";
import { prisma } from "./prisma";

const BOTCSCRIPTS_BASE = "https://www.botcscripts.com";
const PERMANENT_FAILURE_STATUSES = new Set([404, 410, 500]);

type ScriptLookup = Pick<
  Script,
  "id" | "script_id" | "version" | "version_pk" | "is_custom_script"
>;

async function markDownloadUnavailable(scriptId: number, url: string, status: number) {
  console.error(
    `Script JSON unavailable (${status}) for script ${scriptId}: ${url}`
  );
  await prisma.script.update({
    where: { id: scriptId },
    data: { download_unavailable: true },
  });
}

async function resolveVersionPk(script: ScriptLookup): Promise<number | null> {
  if (script.version_pk) {
    return script.version_pk;
  }

  const lookupUrl = `${BOTCSCRIPTS_BASE}/api/script_ids/${script.script_id}/`;
  let response: Response;

  try {
    response = await fetch(lookupUrl);
  } catch (error) {
    console.error(`Failed to resolve version pk for script ${script.id}:`, error);
    return null;
  }

  if (PERMANENT_FAILURE_STATUSES.has(response.status)) {
    await markDownloadUnavailable(script.id, lookupUrl, response.status);
    return null;
  }

  if (!response.ok) {
    console.error(
      `Failed to resolve version pk (${response.status}) for script ${script.id}: ${lookupUrl}`
    );
    return null;
  }

  try {
    const data = (await response.json()) as {
      versions?: Record<string, string>;
    };
    const versionUrl = data.versions?.[script.version];
    if (!versionUrl) {
      return null;
    }

    const match = versionUrl.match(/\/api\/scripts\/(\d+)\/?$/);
    if (!match) {
      return null;
    }

    const versionPk = parseInt(match[1], 10);
    await prisma.script.update({
      where: { id: script.id },
      data: { version_pk: versionPk },
    });
    return versionPk;
  } catch (error) {
    console.error(`Failed to parse script_ids response for script ${script.id}:`, error);
    return null;
  }
}

export async function fetchScriptJsonRoles(
  script: ScriptLookup
): Promise<{ id: string }[] | null> {
  if (script.is_custom_script) {
    return null;
  }

  const versionPk = await resolveVersionPk(script);
  if (!versionPk) {
    return null;
  }

  const url = `${BOTCSCRIPTS_BASE}/api/scripts/${versionPk}/json`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    console.error(`Failed to fetch script JSON for script ${script.id}:`, error);
    return null;
  }

  if (PERMANENT_FAILURE_STATUSES.has(response.status)) {
    await markDownloadUnavailable(script.id, url, response.status);
    return null;
  }

  if (!response.ok) {
    console.error(
      `Failed to fetch script JSON (${response.status}) for script ${script.id}: ${url}`
    );
    return null;
  }

  try {
    const data = await response.json();
    return data
      .filter((role: { id: string }) => role.id !== "_meta")
      .map((role: { id: string }) => ({ id: role.id.toLowerCase() }));
  } catch (error) {
    console.error(`Failed to parse script JSON for script ${script.id}:`, error);
    return null;
  }
}
