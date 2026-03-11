import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { getUserForumPermissions, isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    return { permissions: [], is_admin: false };
  }

  const [permissions, admin] = await Promise.all([
    getUserForumPermissions(me.id),
    isAdmin(me.id),
  ]);

  return { permissions, is_admin: admin };
});
