import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

type Row = Record<string, unknown>;

function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "bigint") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "'{}'";
    const items = v.map((item) => {
      if (typeof item === "number" || typeof item === "bigint")
        return String(item);
      return `"${String(item).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    });
    return `'{${items.join(",")}}'`;
  }
  const s = String(v);
  const hasSpecial = s.includes("\n") || s.includes("\r") || s.includes("\\");
  const escaped = s
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return hasSpecial ? `E'${escaped}'` : `'${escaped}'`;
}

// Insert a row with all columns as-is, skip on conflict
async function insertRow(tx: any, table: string, row: Row): Promise<void> {
  const cols = Object.keys(row);
  if (cols.length === 0) return;
  const colStr = cols.map((c) => `"${c}"`).join(", ");
  const valStr = cols.map((c) => sqlVal(row[c])).join(", ");
  await tx.$executeRawUnsafe(
    `INSERT INTO "${table}" (${colStr}) VALUES (${valStr}) ON CONFLICT DO NOTHING`
  );
}

// Insert a row omitting 'id', return the new auto-generated id
async function insertNewRow(
  tx: any,
  table: string,
  row: Row,
  omit: string[] = ["id"]
): Promise<number> {
  const cols = Object.keys(row).filter((c) => !omit.includes(c));
  const colStr = cols.map((c) => `"${c}"`).join(", ");
  const valStr = cols.map((c) => sqlVal(row[c])).join(", ");
  const result = (await tx.$queryRawUnsafe(
    `INSERT INTO "${table}" (${colStr}) VALUES (${valStr}) RETURNING "id"`
  )) as { id: number }[];
  return Number(result[0].id);
}

// Find existing row by a unique column, or insert new (omitting 'id')
async function findOrInsert(
  tx: any,
  table: string,
  row: Row,
  matchCol: string
): Promise<number> {
  const matchVal = row[matchCol];
  const existing = (await tx.$queryRawUnsafe(
    `SELECT "id" FROM "${table}" WHERE "${matchCol}" = ${sqlVal(matchVal)} LIMIT 1`
  )) as { id: number }[];
  if (existing.length > 0) return Number(existing[0].id);
  return insertNewRow(tx, table, row);
}

// Find existing row by composite unique columns, or insert new
async function findOrInsertComposite(
  tx: any,
  table: string,
  row: Row,
  matchCols: string[]
): Promise<number> {
  const where = matchCols
    .map((c) => `"${c}" = ${sqlVal(row[c])}`)
    .join(" AND ");
  const existing = (await tx.$queryRawUnsafe(
    `SELECT "id" FROM "${table}" WHERE ${where} LIMIT 1`
  )) as { id: number }[];
  if (existing.length > 0) return Number(existing[0].id);
  return insertNewRow(tx, table, row);
}

function remap(
  map: Map<number, number>,
  val: unknown
): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return map.get(n) ?? n;
}

export default defineEventHandler(async (handler) => {
  if (process.env.NODE_ENV !== "development") {
    throw createError({
      status: 403,
      statusMessage: "Import is only available in development",
    });
  }

  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "EXPORT_USER_DATA"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    version: number;
    data: Record<string, Row[]>;
  }>(handler);

  if (!body?.data) {
    throw createError({
      status: 400,
      statusMessage: "Invalid JSON format",
    });
  }

  const d = body.data;

  // ID mappings: old autoincrement ID → new ID
  const scriptMap = new Map<number, number>();
  const communityMap = new Map<number, number>();
  const grimoireMap = new Map<number, number>();
  const tokenMap = new Map<number, number>();
  const favoriteGameMap = new Map<number, number>();
  const eventWaitlistMap = new Map<number, number>();
  const featureFlagMap = new Map<number, number>();
  const lsGameMap = new Map<number, number>();

  let imported = 0;

  await prisma.$transaction(
    async (tx) => {
      // Enable FK bypass
      await tx.$executeRawUnsafe(
        "SET session_replication_role = 'replica'"
      );

      // --- Reference data (string PKs, skip if exists) ---

      for (const row of d.cities || []) {
        await insertRow(tx, "City", row);
        imported++;
      }

      for (const row of d.roles || []) {
        await insertRow(tx, "Role", row);
        imported++;
      }

      for (const row of d.roleReminders || []) {
        await findOrInsertComposite(tx, "RoleReminder", row, [
          "role_id",
          "reminder",
        ]);
        imported++;
      }

      // --- FeatureFlags (autoincrement, referenced) ---

      for (const row of d.featureFlags || []) {
        const oldId = Number(row.id);
        const newId = await findOrInsert(tx, "FeatureFlag", row, "name");
        featureFlagMap.set(oldId, newId);
        imported++;
      }

      // --- Scripts (autoincrement, referenced, match by script_id+version) ---

      for (const row of d.scripts || []) {
        const oldId = Number(row.id);
        const newId = await findOrInsertComposite(tx, "Script", row, [
          "script_id",
          "version",
        ]);
        scriptMap.set(oldId, newId);
        imported++;
      }

      // --- _RoleToScript (join table, remap B=Script.id) ---

      for (const row of d.roleToScript || []) {
        await insertRow(tx, "_RoleToScript", {
          A: row.A,
          B: remap(scriptMap, row.B),
        });
        imported++;
      }

      // --- Users (string PK, skip if exists) ---

      for (const row of d.users || []) {
        await insertRow(tx, "UserSettings", row);
        imported++;
      }

      // --- _FeatureFlagToUserSettings (join table, remap A=FeatureFlag.id) ---

      for (const row of d.featureFlagToUser || []) {
        await insertRow(tx, "_FeatureFlagToUserSettings", {
          A: remap(featureFlagMap, row.A),
          B: row.B,
        });
        imported++;
      }

      // --- LS data ---

      for (const row of d.lsCampaigns || []) {
        await insertRow(tx, "LSCampaign", row);
        imported++;
      }

      for (const row of d.lsGames || []) {
        // Int PK but NOT autoincrement - keep original, skip if exists
        const oldId = Number(row.id);
        const existing = (await tx.$queryRawUnsafe(
          `SELECT "id" FROM "LSGame" WHERE "id" = ${oldId} LIMIT 1`
        )) as { id: number }[];
        if (existing.length > 0) {
          lsGameMap.set(oldId, existing[0].id);
        } else {
          await insertRow(tx, "LSGame", {
            ...row,
            script_id: remap(scriptMap, row.script_id),
          });
          lsGameMap.set(oldId, oldId);
        }
        imported++;
      }

      for (const row of d.lsGameRoles || []) {
        await insertRow(tx, "_Games", {
          A: remap(lsGameMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.lsGameDeaths || []) {
        await insertRow(tx, "_Deaths", {
          A: remap(lsGameMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.lsGameRetires || []) {
        await insertRow(tx, "_Retire", {
          A: remap(lsGameMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.lsCampaignRoles || []) {
        await insertRow(tx, "_LSCampaignToRole", row);
        imported++;
      }

      // --- Communities (autoincrement, referenced, match by slug) ---

      for (const row of d.communities || []) {
        const oldId = Number(row.id);
        const newId = await findOrInsert(tx, "Community", row, "slug");
        communityMap.set(oldId, newId);
        imported++;
      }

      // --- Community join tables (remap A=Community.id) ---

      for (const row of d.communityMembers || []) {
        await insertRow(tx, "_CommunityMember", {
          A: remap(communityMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.communityAdmins || []) {
        await insertRow(tx, "_CommunityAdmin", {
          A: remap(communityMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.communityBanned || []) {
        await insertRow(tx, "_CommunityBanned", {
          A: remap(communityMap, row.A),
          B: row.B,
        });
        imported++;
      }
      for (const row of d.communityJoinRequests || []) {
        await insertRow(tx, "_CommunityJoinRequest", {
          A: remap(communityMap, row.A),
          B: row.B,
        });
        imported++;
      }

      // --- CommunityPost (UUID PK, remap community_id) ---

      for (const row of d.communityPosts || []) {
        await insertRow(tx, "CommunityPost", {
          ...row,
          community_id: remap(communityMap, row.community_id),
        });
        imported++;
      }

      // --- Grimoires (autoincrement, referenced) ---

      for (const row of d.grimoires || []) {
        const oldId = Number(row.id);
        const newId = await insertNewRow(tx, "Grimoire", row);
        grimoireMap.set(oldId, newId);
        imported++;
      }

      // --- Games (UUID PK, remap FKs) ---

      for (const row of d.games || []) {
        await insertRow(tx, "Game", {
          ...row,
          script_id: remap(scriptMap, row.script_id),
          community_id: remap(communityMap, row.community_id),
          grimoire_id: remap(grimoireMap, row.grimoire_id),
          ls_game_id: remap(lsGameMap, row.ls_game_id),
          // favorite_id set to null initially, updated later
          favorite_id: null,
        });
        imported++;
      }

      // --- _GameToGrimoire (join table, remap B=Grimoire.id) ---

      for (const row of d.gameToGrimoire || []) {
        await insertRow(tx, "_GameToGrimoire", {
          A: row.A,
          B: remap(grimoireMap, row.B),
        });
        imported++;
      }

      // --- Tokens (autoincrement, referenced, remap grimoire_id) ---

      for (const row of d.tokens || []) {
        const oldId = Number(row.id);
        const newId = await insertNewRow(tx, "Token", {
          ...row,
          grimoire_id: remap(grimoireMap, row.grimoire_id),
        });
        tokenMap.set(oldId, newId);
        imported++;
      }

      // --- ReminderTokens (autoincrement, remap token_id) ---

      for (const row of d.reminderTokens || []) {
        await insertNewRow(tx, "ReminderToken", {
          ...row,
          token_id: remap(tokenMap, row.token_id),
        });
        imported++;
      }

      // --- Characters (autoincrement, remap game_id) ---

      for (const row of d.characters || []) {
        await insertNewRow(tx, "Character", row);
        imported++;
      }

      // --- DemonBluffs (autoincrement, remap game_id) ---

      for (const row of d.demonBluffs || []) {
        await insertNewRow(tx, "DemonBluff", row);
        imported++;
      }

      // --- Fabled (autoincrement) ---

      for (const row of d.fabled || []) {
        await insertNewRow(tx, "Fabled", row);
        imported++;
      }

      // --- FavoriteGames (autoincrement, referenced by Game.favorite_id) ---

      for (const row of d.favoriteGames || []) {
        const oldId = Number(row.id);
        const newId = await insertNewRow(tx, "FavoriteGame", row);
        favoriteGameMap.set(oldId, newId);
        imported++;
      }

      // Update Game.favorite_id with remapped FavoriteGame IDs
      for (const row of d.games || []) {
        if (row.favorite_id !== null && row.favorite_id !== undefined) {
          const newFavId = remap(favoriteGameMap, row.favorite_id);
          if (newFavId !== null) {
            await tx.$executeRawUnsafe(
              `UPDATE "Game" SET "favorite_id" = ${newFavId} WHERE "id" = ${sqlVal(row.id)}`
            );
          }
        }
      }

      // --- Social data (autoincrement, not referenced) ---

      for (const row of d.friends || []) {
        await insertNewRow(tx, "Friend", row);
        imported++;
      }
      for (const row of d.friendRequests || []) {
        await insertNewRow(tx, "FriendRequest", row);
        imported++;
      }
      for (const row of d.charts || []) {
        await insertNewRow(tx, "Chart", row);
        imported++;
      }
      for (const row of d.dids || []) {
        await insertNewRow(tx, "Did", row);
        imported++;
      }
      for (const row of d.koFiPayments || []) {
        await insertNewRow(tx, "KoFiPayment", row);
        imported++;
      }
      for (const row of d.yearInReviews || []) {
        await insertRow(tx, "YearInReview", row);
        imported++;
      }

      // --- Events (UUID PK, remap FKs) ---

      for (const row of d.events || []) {
        await insertRow(tx, "Event", {
          ...row,
          script_id: remap(scriptMap, row.script_id),
          community_id: remap(communityMap, row.community_id),
        });
        imported++;
      }

      for (const row of d.eventAttendees || []) {
        await insertNewRow(tx, "EventAttendee", row);
        imported++;
      }

      // --- EventWaitlists (autoincrement, referenced) ---

      for (const row of d.eventWaitlists || []) {
        const oldId = Number(row.id);
        const newId = await insertNewRow(tx, "EventWaitlist", row);
        eventWaitlistMap.set(oldId, newId);
        imported++;
      }

      for (const row of d.eventWaitlistAttendees || []) {
        await insertNewRow(tx, "EventWaitlistAttendee", {
          ...row,
          waitlist_id: remap(eventWaitlistMap, row.waitlist_id),
        });
        imported++;
      }

      for (const row of d.eventDiscordPosts || []) {
        await insertRow(tx, "EventDiscordPost", row);
        imported++;
      }

      // --- Forum data ---

      for (const row of d.forumCategoryGroups || []) {
        await insertRow(tx, "ForumCategoryGroup", row);
        imported++;
      }
      for (const row of d.forumCategories || []) {
        await insertRow(tx, "ForumCategory", row);
        imported++;
      }
      for (const row of d.userGroups || []) {
        await insertRow(tx, "UserGroup", row);
        imported++;
      }
      for (const row of d.categoryAccess || []) {
        await insertRow(tx, "CategoryAccess", row);
        imported++;
      }
      for (const row of d.userGroupMemberships || []) {
        await insertRow(tx, "UserGroupMembership", row);
        imported++;
      }
      for (const row of d.forumThreads || []) {
        await insertRow(tx, "ForumThread", row);
        imported++;
      }
      for (const row of d.forumPosts || []) {
        await insertRow(tx, "ForumPost", row);
        imported++;
      }
      for (const row of d.forumPostEdits || []) {
        await insertRow(tx, "ForumPostEdit", row);
        imported++;
      }
      for (const row of d.forumPostReactions || []) {
        await insertRow(tx, "ForumPostReaction", row);
        imported++;
      }
      for (const row of d.forumPostReports || []) {
        await insertRow(tx, "ForumPostReport", row);
        imported++;
      }
      for (const row of d.forumBans || []) {
        await insertRow(tx, "ForumBan", row);
        imported++;
      }
      for (const row of d.forumModLogs || []) {
        await insertRow(tx, "ForumModLog", row);
        imported++;
      }
      for (const row of d.forumThreadSubscriptions || []) {
        await insertRow(tx, "ForumThreadSubscription", row);
        imported++;
      }
      for (const row of d.forumThreadReads || []) {
        await insertRow(tx, "ForumThreadRead", row);
        imported++;
      }

      // Reset session_replication_role
      await tx.$executeRawUnsafe(
        "SET session_replication_role = 'origin'"
      );
    },
    { timeout: 300000 }
  );

  return { success: true, imported };
});
