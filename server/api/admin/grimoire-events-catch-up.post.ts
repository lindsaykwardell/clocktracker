import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { hasPermission } from "~/server/utils/permissions";
import { prisma } from "~/server/utils/prisma";
import {
  catchUpGrimoireEvents,
  type GrimoireEventsCatchUpResult,
} from "~/server/utils/grimoireEventsCatchUp";

// Runs the grimoire events catch-up for one user's games: adds the events of
// reminder rules added after the games had their events, and nothing else.
// Same rules as the background job: each catch-up runs once per game, events
// are only added, an editor save at the same time wins.
//
// Keeps going a batch at a time for up to ~25 seconds so the request does not
// time out; run it again if `remaining` is above 0.
const REQUEST_BUDGET_MS = 25 * 1000;

const COUNTERS = [
  "examined",
  "gamesWithNewEvents",
  "eventsCreated",
  "skippedConcurrentSave",
  "failed",
] as const;

export default defineEventHandler(async (event) => {
  const me: User | null = event.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "MANAGE_APP_TOOLS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{ username?: string; dryRun?: boolean }>(event);
  const username = (body?.username ?? "").trim().replace(/^@/, "");
  if (!username) {
    throw createError({ status: 400, statusMessage: "Missing username" });
  }
  const dryRun = !!body?.dryRun;

  const user = await prisma.userSettings.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { user_id: true, username: true },
  });
  if (!user) {
    throw createError({ status: 404, statusMessage: `No user called ${username}` });
  }

  const startedAt = Date.now();
  const total: GrimoireEventsCatchUpResult = {
    examined: 0,
    gamesWithNewEvents: 0,
    eventsCreated: 0,
    skippedConcurrentSave: 0,
    failed: 0,
    remaining: 0,
    durationMs: 0,
    dryRun,
  };

  while (true) {
    const timeLeft = REQUEST_BUDGET_MS - (Date.now() - startedAt);
    if (timeLeft <= 0) break;

    const batch = await catchUpGrimoireEvents(prisma, {
      userId: user.user_id,
      dryRun,
      timeBudgetMs: timeLeft,
    });
    for (const key of COUNTERS) total[key] += batch[key];
    total.remaining = batch.remaining;

    // A dry run writes nothing, so the next batch would see the same games.
    if (dryRun || batch.examined === 0 || batch.remaining === 0) break;
  }

  total.durationMs = Date.now() - startedAt;
  console.log(
    `[grimoire-events-catch-up] user ${user.username}: ${JSON.stringify(total)}`
  );

  return { username: user.username, ...total };
});
