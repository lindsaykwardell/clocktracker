import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import {
  forumUserSelect,
  isAdmin,
  isModerator,
  getForumBadges,
} from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const postId = handler.context.params!.id;

  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { author_id: true },
  });

  if (!post) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const viewerIsMod = me
    ? (await isAdmin(me.id)) || (await isModerator(me.id))
    : false;

  const edits = await prisma.forumPostEdit.findMany({
    where: { post_id: postId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      previous_body: true,
      edited_by: true,
      created_at: true,
      editor: { select: forumUserSelect },
    },
  });

  // Determine badges for editors who aren't the post author
  const modEditorIds = edits
    .filter((e) => e.edited_by !== post.author_id)
    .map((e) => e.edited_by);
  const editorBadges =
    modEditorIds.length > 0 ? await getForumBadges(modEditorIds) : {};

  return edits.map((edit) => {
    const isModEdit = edit.edited_by !== post.author_id;

    if (isModEdit && !viewerIsMod) {
      // Hide the previous body and editor identity from non-mod viewers
      const badge = editorBadges[edit.edited_by];
      const label = badge === "admin" ? "Admin" : "Moderator";
      return {
        id: edit.id,
        previous_body: null,
        created_at: edit.created_at,
        editor: {
          user_id: "",
          username: "",
          display_name: label,
          avatar: null,
          created_at: null,
        },
        mod_edit: true,
      };
    }

    return {
      id: edit.id,
      previous_body: edit.previous_body,
      created_at: edit.created_at,
      editor: edit.editor,
      mod_edit: isModEdit,
    };
  });
});
