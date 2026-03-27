import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { getUserForumPermissions } from "~/server/utils/forum";
import { getUserRestrictions, isAdmin } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    return { permissions: [], restrictions: [], is_admin: false };
  }

  const [permissions, restrictions, admin] = await Promise.all([
    getUserForumPermissions(me.id),
    getUserRestrictions(me.id),
    isAdmin(me.id),
  ]);

  return { permissions, restrictions, is_admin: admin };
});
