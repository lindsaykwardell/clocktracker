import type { PrismaClient } from "~/server/generated/prisma/client";
import {
  decideReminderLink,
  loadReminderCatalogIndex,
} from "./reminderTokenLinks";

/**
 * Background job that links reminders saved before catalog linking existed
 * (role_reminder_id null and is_custom false) to the reminder catalog, by
 * matching the reminder's icon and text, the same way saving does it.
 * Reminders without a match are marked custom. Either way the row leaves the
 * "unlinked" state, so each reminder is handled once.
 *
 * Safety rules:
 * - Only unlinked rows are touched; the update re-checks that, so a reminder
 *   saved by a user in the meantime keeps what the save wrote.
 * - Only the link columns change; the reminder text and icon are untouched.
 * - Until a reminder is linked it is shown like an official one, as before.
 */

export type ReminderLinkFillMode = "off" | "dry-run" | "on";

/** Controlled by REMINDER_LINK_BACKFILL ("on" | "dry-run"); anything else is off. */
export function reminderLinkFillMode(): ReminderLinkFillMode {
  const value = (process.env.REMINDER_LINK_BACKFILL ?? "").trim().toLowerCase();
  if (value === "on") return "on";
  if (value === "dry-run") return "dry-run";
  return "off";
}

export type ReminderLinkFillResult = {
  examined: number;
  linked: number;
  markedCustom: number;
  updated: number;
  hasMore: boolean;
  durationMs: number;
  dryRun: boolean;
};

/** Reminders the job still has to link. Uses the partial index on unlinked rows. */
export async function countUnlinkedReminders(prisma: PrismaClient): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS "count"
    FROM "ReminderToken"
    WHERE "role_reminder_id" IS NULL
      AND "is_custom" = false
  `;
  return Number(row?.count ?? 0);
}

export async function fillReminderLinks(
  prisma: PrismaClient,
  options: { batchSize?: number; timeBudgetMs?: number; dryRun?: boolean } = {}
): Promise<ReminderLinkFillResult> {
  const batchSize = options.batchSize ?? 2000;
  const timeBudgetMs = options.timeBudgetMs ?? 2 * 60 * 1000;
  const dryRun = options.dryRun ?? false;
  const startedAt = Date.now();

  const result: ReminderLinkFillResult = {
    examined: 0,
    linked: 0,
    markedCustom: 0,
    updated: 0,
    hasMore: false,
    durationMs: 0,
    dryRun,
  };

  // Walks the unlinked rows in id order. The WHERE clause matches the partial
  // index "ReminderToken_unlinked_id_idx", so this never scans the table.
  let cursor = 0;
  for (;;) {
    const rows = await prisma.$queryRaw<
      { id: number; reminder: string; token_url: string }[]
    >`
      SELECT "id", "reminder", "token_url"
      FROM "ReminderToken"
      WHERE "role_reminder_id" IS NULL
        AND "is_custom" = false
        AND "id" > ${cursor}
      ORDER BY "id"
      LIMIT ${batchSize}
    `;
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;
    result.examined += rows.length;

    const catalog = await loadReminderCatalogIndex(prisma, rows);
    const ids: number[] = [];
    const links: (number | null)[] = [];
    for (const row of rows) {
      const link = decideReminderLink(row, new Set(), catalog);
      ids.push(row.id);
      links.push(link.role_reminder_id);
      if (link.role_reminder_id === null) result.markedCustom += 1;
      else result.linked += 1;
    }

    if (!dryRun) {
      result.updated += await prisma.$executeRaw`
        UPDATE "ReminderToken" AS t
        SET "role_reminder_id" = v.role_reminder_id,
            "is_custom" = v.role_reminder_id IS NULL
        FROM unnest(${ids}::int[], ${links}::int[]) AS v(id, role_reminder_id)
        WHERE t."id" = v.id
          AND t."role_reminder_id" IS NULL
          AND t."is_custom" = false
      `;
    }

    if (rows.length < batchSize) break;
    // A dry run reports one batch, like the events fill.
    if (dryRun || Date.now() - startedAt >= timeBudgetMs) {
      result.hasMore = true;
      break;
    }
  }

  result.durationMs = Date.now() - startedAt;
  return result;
}
