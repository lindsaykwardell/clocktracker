import type { PrismaClient } from "~/server/generated/prisma/client";
import axios from "axios";

const BASE_URL = "https://www.botcscripts.com";
const PAGE_DELAY_MS = 250;

type ScriptVersionResult = {
  pk: number;
  script_id: number;
  name: string;
  version: string;
  script_type: string;
  author: string;
};

type ScriptVersionsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScriptVersionResult[];
};

function fullUrl(href: string) {
  return BASE_URL + href;
}

function toScriptRecord(script: ScriptVersionResult) {
  const script_id = script.script_id.toString();

  return {
    script_id,
    version_pk: script.pk,
    name: script.name,
    version: script.version,
    author: script.author,
    type: script.script_type,
    json_url: fullUrl(`/script/${script_id}/${script.version}/download`),
    pdf_url: fullUrl(`/script/${script_id}/${script.version}/download_pdf`),
  };
}

async function upsertScript(
  prisma: PrismaClient,
  script: ScriptVersionResult
) {
  const record = toScriptRecord(script);

  await prisma.script.upsert({
    where: {
      script_id_version: {
        script_id: record.script_id,
        version: record.version,
      },
    },
    update: {
      ...record,
      download_unavailable: false,
    },
    create: record,
  });
}

async function fetchScriptsPage(page: number) {
  const response = await axios.get<ScriptVersionsResponse>(
    `${BASE_URL}/api/scripts/?ordering=-pk&page=${page}`
  );

  return response.data;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function importScripts(prisma: PrismaClient) {
  const state = await prisma.scriptImportState.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  const needsFullSync = state.last_version_pk === 0;

  if (needsFullSync) {
    console.log("Running full script import (bootstrap)...");
  }

  let page = 1;
  let imported = 0;
  let maxPk = state.last_version_pk;
  let reachedKnownScripts = false;

  while (!reachedKnownScripts) {
    console.log(`Fetching script page ${page}...`);
    const response = await fetchScriptsPage(page);

    for (const script of response.results) {
      if (!needsFullSync && script.pk <= state.last_version_pk) {
        reachedKnownScripts = true;
        break;
      }

      await upsertScript(prisma, script);
      maxPk = Math.max(maxPk, script.pk);
      imported++;
    }

    if (reachedKnownScripts || !response.next) {
      break;
    }

    page++;
    await sleep(PAGE_DELAY_MS);
  }

  if (maxPk > state.last_version_pk) {
    await prisma.scriptImportState.update({
      where: { id: 1 },
      data: { last_version_pk: maxPk },
    });
  }

  console.log(
    needsFullSync
      ? `Full script import complete. Upserted ${imported} versions.`
      : `Incremental script import complete. Upserted ${imported} new versions.`
  );
}
