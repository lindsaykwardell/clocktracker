import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

async function queryByIds(
  table: string,
  idCol: string,
  ids: unknown[],
  idType: string = "text"
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  return prisma.$queryRawUnsafe(
    `SELECT * FROM "${table}" WHERE "${idCol}" = ANY($1::${idType}[])`,
    ids
  );
}

function dedup<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const username = handler.context.params!.username;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const targetUser = await prisma.userSettings.findUnique({
    where: { username },
    select: { user_id: true },
  });

  if (!targetUser) {
    throw createError({ status: 404, statusMessage: "User not found" });
  }

  const userId = targetUser.user_id;

  // ===== PHASE 1: Collect game IDs =====

  const [ownGames, taggedTokens] = await Promise.all([
    prisma.game.findMany({
      where: { user_id: userId },
      select: { id: true },
    }),
    prisma.token.findMany({
      where: { player_id: userId },
      select: { grimoire_id: true },
    }),
  ]);

  const taggedGrimoireIds = dedup(
    taggedTokens
      .map((t) => t.grimoire_id)
      .filter((id): id is number => id !== null)
  );

  const taggedGameJoins =
    taggedGrimoireIds.length > 0
      ? await prisma.$queryRawUnsafe<{ A: string }[]>(
          `SELECT "A" FROM "_GameToGrimoire" WHERE "B" = ANY($1::int[])`,
          taggedGrimoireIds
        )
      : [];

  const gameIds = new Set<string>([
    ...ownGames.map((g) => g.id),
    ...taggedGameJoins.map((j) => j.A),
  ]);

  // Tree expansion: add parents, then all children of everything
  if (gameIds.size > 0) {
    const gamesWithParents = await prisma.game.findMany({
      where: { id: { in: [...gameIds] } },
      select: { id: true, parent_game_id: true },
    });
    for (const g of gamesWithParents) {
      if (g.parent_game_id) gameIds.add(g.parent_game_id);
    }
    const children = await prisma.game.findMany({
      where: { parent_game_id: { in: [...gameIds] } },
      select: { id: true },
    });
    for (const c of children) gameIds.add(c.id);
  }

  const gameIdArr = [...gameIds];

  // ===== PHASE 2: Game-related data =====

  const gameGrimoireJoins =
    gameIdArr.length > 0
      ? await prisma.$queryRawUnsafe<{ A: string; B: number }[]>(
          `SELECT * FROM "_GameToGrimoire" WHERE "A" = ANY($1::text[])`,
          gameIdArr
        )
      : [];
  const grimoireIds = dedup(gameGrimoireJoins.map((j) => j.B));

  const [characters, demonBluffs, fabled, favoriteGames, tokens, grimoires] =
    await Promise.all([
      queryByIds("Character", "game_id", gameIdArr),
      queryByIds("DemonBluff", "game_id", gameIdArr),
      queryByIds("Fabled", "game_id", gameIdArr),
      queryByIds("FavoriteGame", "game_id", gameIdArr),
      queryByIds("Token", "grimoire_id", grimoireIds, "int"),
      queryByIds("Grimoire", "id", grimoireIds, "int"),
    ]);

  const tokenIds = dedup(tokens.map((t: any) => t.id));
  const reminderTokens = await queryByIds(
    "ReminderToken",
    "token_id",
    tokenIds,
    "int"
  );

  // Collect role IDs from game data
  const roleIds = new Set<string>();
  for (const t of tokens) {
    if (t.role_id) roleIds.add(t.role_id as string);
    if (t.related_role_id) roleIds.add(t.related_role_id as string);
  }
  for (const c of characters) {
    if (c.role_id) roleIds.add(c.role_id as string);
    if (c.related_role_id) roleIds.add(c.related_role_id as string);
  }
  for (const d of demonBluffs) {
    if (d.role_id) roleIds.add(d.role_id as string);
  }
  for (const f of fabled) {
    if (f.role_id) roleIds.add(f.role_id as string);
  }

  // Get game rows for FKs
  const gameRows = await queryByIds("Game", "id", gameIdArr);
  const scriptIds = new Set<number>();
  const lsGameIds = new Set<number>();
  const communityIds = new Set<number>();
  for (const g of gameRows) {
    if (g.script_id) scriptIds.add(g.script_id as number);
    if (g.ls_game_id) lsGameIds.add(g.ls_game_id as number);
    if (g.community_id) communityIds.add(g.community_id as number);
  }

  const scriptIdArr = [...scriptIds];
  const lsGameIdArr = [...lsGameIds];

  const [scripts, roleToScriptJoins, lsGames] = await Promise.all([
    queryByIds("Script", "id", scriptIdArr, "int"),
    scriptIdArr.length > 0
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM "_RoleToScript" WHERE "B" = ANY($1::int[])`,
          scriptIdArr
        )
      : Promise.resolve([]),
    queryByIds("LSGame", "id", lsGameIdArr, "int"),
  ]);

  for (const j of roleToScriptJoins) {
    roleIds.add(j.A as string);
  }

  const lsCampaignIds = dedup(
    lsGames.map((g) => g.ls_campaign_id as string).filter(Boolean)
  );

  const [lsCampaigns, lsGameJoins, lsDeathJoins, lsRetireJoins, lsCampaignRoleJoins] =
    await Promise.all([
      queryByIds("LSCampaign", "id", lsCampaignIds),
      lsGameIdArr.length > 0
        ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `SELECT * FROM "_Games" WHERE "A" = ANY($1::int[])`,
            lsGameIdArr
          )
        : Promise.resolve([]),
      lsGameIdArr.length > 0
        ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `SELECT * FROM "_Deaths" WHERE "A" = ANY($1::int[])`,
            lsGameIdArr
          )
        : Promise.resolve([]),
      lsGameIdArr.length > 0
        ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `SELECT * FROM "_Retire" WHERE "A" = ANY($1::int[])`,
            lsGameIdArr
          )
        : Promise.resolve([]),
      lsCampaignIds.length > 0
        ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
            `SELECT * FROM "_LSCampaignToRole" WHERE "A" = ANY($1::text[])`,
            lsCampaignIds
          )
        : Promise.resolve([]),
    ]);

  for (const j of [
    ...lsGameJoins,
    ...lsDeathJoins,
    ...lsRetireJoins,
    ...lsCampaignRoleJoins,
  ]) {
    roleIds.add(j.B as string);
  }

  const roleIdArr = [...roleIds];
  const [roles, roleReminders] = await Promise.all([
    queryByIds("Role", "id", roleIdArr),
    queryByIds("RoleReminder", "role_id", roleIdArr),
  ]);

  // ===== PHASE 3: User social/personal data =====

  const [
    friends,
    friendRequests,
    charts,
    dids,
    koFiPayments,
    yearInReviews,
    featureFlagJoins,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "Friend" WHERE "user_id" = $1 OR "friend_id" = $1`,
      userId
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "FriendRequest" WHERE "user_id" = $1 OR "from_user_id" = $1`,
      userId
    ),
    queryByIds("Chart", "user_id", [userId]),
    queryByIds("Did", "user_id", [userId]),
    queryByIds("KoFiPayment", "user_id", [userId]),
    queryByIds("YearInReview", "user_id", [userId]),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "_FeatureFlagToUserSettings" WHERE "B" = $1`,
      userId
    ),
  ]);

  const featureFlagIds = dedup(featureFlagJoins.map((j) => j.A as number));
  const featureFlags = await queryByIds(
    "FeatureFlag",
    "id",
    featureFlagIds,
    "int"
  );

  // ===== PHASE 4: Community data =====

  const [
    communityMemberJoins,
    communityAdminJoins,
    communityBannedJoins,
    communityJoinRequestJoins,
    communityPosts,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "_CommunityMember" WHERE "B" = $1`,
      userId
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "_CommunityAdmin" WHERE "B" = $1`,
      userId
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "_CommunityBanned" WHERE "B" = $1`,
      userId
    ),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "_CommunityJoinRequest" WHERE "B" = $1`,
      userId
    ),
    queryByIds("CommunityPost", "user_id", [userId]),
  ]);

  for (const j of [
    ...communityMemberJoins,
    ...communityAdminJoins,
    ...communityBannedJoins,
    ...communityJoinRequestJoins,
  ]) {
    communityIds.add(j.A as number);
  }
  for (const p of communityPosts) {
    if (p.community_id) communityIds.add(p.community_id as number);
  }

  // ===== PHASE 5: Event data =====

  const [userEvents, userAttendees, userWaitlistAttendees] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "Event" WHERE "created_by_id" = $1`,
      userId
    ),
    queryByIds("EventAttendee", "user_id", [userId]),
    queryByIds("EventWaitlistAttendee", "user_id", [userId]),
  ]);

  const eventIds = new Set<string>();
  for (const e of userEvents) eventIds.add(e.id as string);
  for (const a of userAttendees) eventIds.add(a.event_id as string);

  const userWaitlistIds = dedup(
    userWaitlistAttendees.map((a) => a.waitlist_id as number)
  );
  if (userWaitlistIds.length > 0) {
    const userWaitlists = await queryByIds(
      "EventWaitlist",
      "id",
      userWaitlistIds,
      "int"
    );
    for (const w of userWaitlists) eventIds.add(w.event_id as string);
  }

  const eventIdArr = [...eventIds];
  const existingEventIds = new Set(userEvents.map((e) => e.id as string));
  const missingEventIds = eventIdArr.filter((id) => !existingEventIds.has(id));
  const additionalEvents = await queryByIds("Event", "id", missingEventIds);
  const allEvents = [...userEvents, ...additionalEvents];

  for (const e of allEvents) {
    if (e.script_id) scriptIds.add(e.script_id as number);
    if (e.community_id) communityIds.add(e.community_id as number);
  }

  const [allEventAttendees, allEventWaitlists, eventDiscordPosts] =
    await Promise.all([
      queryByIds("EventAttendee", "event_id", eventIdArr),
      queryByIds("EventWaitlist", "event_id", eventIdArr),
      queryByIds("EventDiscordPost", "event_id", eventIdArr),
    ]);

  const allWaitlistIds = dedup(allEventWaitlists.map((w) => w.id as number));
  const allWaitlistAttendees = await queryByIds(
    "EventWaitlistAttendee",
    "waitlist_id",
    allWaitlistIds,
    "int"
  );

  // ===== PHASE 6: Forum data =====

  const [
    groupMemberships,
    forumThreads,
    forumPosts,
    forumReactions,
    forumReports,
    forumBans,
    forumModLogs,
    forumSubscriptions,
    forumReads,
  ] = await Promise.all([
    queryByIds("UserGroupMembership", "user_id", [userId]),
    queryByIds("ForumThread", "author_id", [userId]),
    queryByIds("ForumPost", "author_id", [userId]),
    queryByIds("ForumPostReaction", "user_id", [userId]),
    queryByIds("ForumPostReport", "reporter_id", [userId]),
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "ForumBan" WHERE "user_id" = $1 OR "banned_by" = $1`,
      userId
    ),
    queryByIds("ForumModLog", "actor_id", [userId]),
    queryByIds("ForumThreadSubscription", "user_id", [userId]),
    queryByIds("ForumThreadRead", "user_id", [userId]),
  ]);

  const postIds = dedup(forumPosts.map((p) => p.id as string));
  const forumPostEdits = await queryByIds("ForumPostEdit", "post_id", postIds);

  const groupIds = dedup(groupMemberships.map((m) => m.group_id as string));
  const [userGroups, categoryAccess] = await Promise.all([
    queryByIds("UserGroup", "id", groupIds),
    groupIds.length > 0
      ? prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM "CategoryAccess" WHERE "group_id" = ANY($1::text[])`,
          groupIds
        )
      : Promise.resolve([]),
  ]);

  const categoryIds = new Set<string>();
  for (const t of forumThreads) categoryIds.add(t.category_id as string);
  for (const a of categoryAccess) categoryIds.add(a.category_id as string);
  for (const b of forumBans) {
    if (b.category_id) categoryIds.add(b.category_id as string);
  }

  const forumCategories = await queryByIds("ForumCategory", "id", [
    ...categoryIds,
  ]);
  const categoryGroupIds = dedup(
    forumCategories
      .map((c) => c.group_id as string)
      .filter(Boolean)
  );
  const forumCategoryGroups = await queryByIds("ForumCategoryGroup", "id", categoryGroupIds);

  // ===== PHASE 7: Collect all referenced user IDs =====

  const allUserIds = new Set<string>([userId]);

  for (const f of friends) {
    allUserIds.add(f.user_id as string);
    allUserIds.add(f.friend_id as string);
  }
  for (const fr of friendRequests) {
    allUserIds.add(fr.user_id as string);
    allUserIds.add(fr.from_user_id as string);
  }
  for (const t of tokens) {
    if (t.player_id) allUserIds.add(t.player_id as string);
  }
  for (const g of gameRows) {
    allUserIds.add(g.user_id as string);
  }
  for (const p of communityPosts) {
    allUserIds.add(p.user_id as string);
  }
  for (const e of allEvents) {
    if (e.created_by_id) allUserIds.add(e.created_by_id as string);
  }
  for (const a of allEventAttendees) {
    if (a.user_id) allUserIds.add(a.user_id as string);
  }
  for (const a of allWaitlistAttendees) {
    if (a.user_id) allUserIds.add(a.user_id as string);
  }
  for (const b of forumBans) {
    allUserIds.add(b.user_id as string);
    allUserIds.add(b.banned_by as string);
  }
  for (const e of forumPostEdits) {
    allUserIds.add(e.edited_by as string);
  }
  for (const r of forumReports) {
    allUserIds.add(r.reporter_id as string);
    if (r.resolved_by) allUserIds.add(r.resolved_by as string);
  }
  for (const s of scripts) {
    if (s.user_id) allUserIds.add(s.user_id as string);
  }

  const allUsers = await queryByIds("UserSettings", "user_id", [...allUserIds]);

  // ===== PHASE 8: Reference data (cities, additional scripts/communities) =====

  const cityIds = new Set<string>();
  for (const u of allUsers) {
    if (u.city_id) cityIds.add(u.city_id as string);
  }

  const communities = await queryByIds(
    "Community",
    "id",
    [...communityIds],
    "int"
  );
  for (const c of communities) {
    if (c.city_id) cityIds.add(c.city_id as string);
  }

  const cities = await queryByIds("City", "id", [...cityIds]);

  const existingScriptIds = new Set(scripts.map((s) => s.id as number));
  const additionalScriptIds = [...scriptIds].filter(
    (id) => !existingScriptIds.has(id)
  );
  const additionalScripts = await queryByIds(
    "Script",
    "id",
    additionalScriptIds,
    "int"
  );
  const allScripts = [...scripts, ...additionalScripts];

  // ===== OUTPUT JSON =====

  setResponseHeader(handler, "Content-Type", "application/json");
  setResponseHeader(
    handler,
    "Content-Disposition",
    `attachment; filename="clocktracker-${username}.json"`
  );

  return {
    version: 1,
    user: username,
    generated: new Date().toISOString(),
    gameCount: gameIdArr.length,
    data: {
      cities,
      roles,
      roleReminders,
      featureFlags,
      users: allUsers,
      scripts: allScripts,
      roleToScript: roleToScriptJoins,
      lsCampaigns,
      lsGames,
      lsGameRoles: lsGameJoins,
      lsGameDeaths: lsDeathJoins,
      lsGameRetires: lsRetireJoins,
      lsCampaignRoles: lsCampaignRoleJoins,
      communities,
      communityMembers: communityMemberJoins,
      communityAdmins: communityAdminJoins,
      communityBanned: communityBannedJoins,
      communityJoinRequests: communityJoinRequestJoins,
      communityPosts,
      grimoires,
      games: gameRows,
      gameToGrimoire: gameGrimoireJoins,
      tokens,
      reminderTokens,
      characters,
      demonBluffs,
      fabled,
      favoriteGames,
      friends,
      friendRequests,
      charts,
      dids,
      koFiPayments,
      yearInReviews,
      featureFlagToUser: featureFlagJoins,
      events: allEvents,
      eventAttendees: allEventAttendees,
      eventWaitlists: allEventWaitlists,
      eventWaitlistAttendees: allWaitlistAttendees,
      eventDiscordPosts,
      forumCategoryGroups,
      forumCategories,
      userGroups,
      categoryAccess,
      userGroupMemberships: groupMemberships,
      forumThreads,
      forumPosts,
      forumPostEdits,
      forumPostReactions: forumReactions,
      forumPostReports: forumReports,
      forumBans,
      forumModLogs,
      forumThreadSubscriptions: forumSubscriptions,
      forumThreadReads: forumReads,
    },
  };
});
