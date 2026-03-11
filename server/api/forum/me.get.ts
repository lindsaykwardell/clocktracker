import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { getUserForumPermissions, getUserRestrictions, isAdmin } from "~/server/utils/forum";

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
