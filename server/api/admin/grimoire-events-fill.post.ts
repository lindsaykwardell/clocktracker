import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { hasPermission } from "~/server/utils/permissions";
import { prisma } from "~/server/utils/prisma";
import {
  fillMissingGrimoireEvents,
  type GrimoireEventsFillResult,
} from "~/server/utils/fillMissingGrimoireEvents";

// Runs the grimoire events background fill for one user's games, so it can be
// tried on a known set of games (e.g. on staging, where the background job is
// off). Same rules as the background fill: only games that were never
// generated, events are only added, an editor save at the same time wins.
//
// Keeps going a batch at a time for up to ~25 seconds so the request does not
// time out; run it again if `remaining` is above 0.
const REQUEST_BUDGET_MS = 25 * 1000;

const COUNTERS = [
  "examined",
  "filled",
  "eventsCreated",
  "participantIdsFilled",
  "seatPagesRepaired",
  "seatPagesUnrepaired",
  "skippedSeatMovingScript",
  "alreadyHadEvents",
  "noEvents",
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
  const total: GrimoireEventsFillResult = {
    examined: 0,
    filled: 0,
    eventsCreated: 0,
    participantIdsFilled: 0,
    seatPagesRepaired: 0,
    seatPagesUnrepaired: 0,
    skippedSeatMovingScript: 0,
    alreadyHadEvents: 0,
    noEvents: 0,
    skippedConcurrentSave: 0,
    failed: 0,
    remaining: 0,
    durationMs: 0,
    dryRun,
  };

  while (true) {
    const timeLeft = REQUEST_BUDGET_MS - (Date.now() - startedAt);
    if (timeLeft <= 0) break;

    const batch = await fillMissingGrimoireEvents(prisma, {
      userId: user.user_id,
      dryRun,
      timeBudgetMs: timeLeft,
    });
    for (const key of COUNTERS) total[key] += batch[key];
    total.remaining = batch.remaining;

    // A dry run writes nothing, so the next batch would see the same games.
    // Games that fail are left out of later batches, so a real run always
    // moves on and stops once there is nothing left to look at.
    if (dryRun || batch.examined === 0 || batch.remaining === 0) break;
  }

  total.durationMs = Date.now() - startedAt;
  console.log(
    `[grimoire-events-fill] user ${user.username}: ${JSON.stringify(total)}`
  );

  return { username: user.username, ...total };
});
