import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import {
  forumUserSelect,
  userCanViewCategory,
  getForumNameColors,
  getForumBadges,
  isAdmin,
  isModerator,
} from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const threadId = handler.context.params!.id;
  const query = getQuery(handler);
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 25;

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
    select: {
      id: true,
      title: true,
      is_pinned: true,
      is_locked: true,
      created_at: true,
      last_post_at: true,
      category_id: true,
      author: { select: forumUserSelect },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          is_private: true,
          mod_posting_only: true,
          is_announcement: true,
        },
      },
    },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const canView = await userCanViewCategory(
    me?.id ?? null,
    thread.category_id,
    thread.category.is_private
  );

  if (!canView) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  // Check if viewer is mod/admin (for seeing deleted post content)
  const viewerIsMod = me
    ? (await isAdmin(me.id)) || (await isModerator(me.id))
    : false;

  const where = { thread_id: threadId };

  const [rawPosts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      orderBy: { created_at: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        body: true,
        created_at: true,
        edited_at: true,
        deleted_at: true,
        author_id: true,
        author: { select: forumUserSelect },
        reactions: {
          select: {
            emoji: true,
            user_id: true,
          },
        },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  // Get name colors for all post authors + thread author
  const authorIds = [
    thread.author.user_id,
    ...rawPosts.filter((p) => !p.deleted_at).map((p) => p.author.user_id),
    // Include deleted post authors too if viewer is mod
    ...(viewerIsMod
      ? rawPosts.filter((p) => p.deleted_at).map((p) => p.author.user_id)
      : []),
  ];
  const [nameColors, badges] = await Promise.all([
    getForumNameColors(authorIds),
    getForumBadges(authorIds),
  ]);

  // For edited posts, fetch the last edit to determine who edited it
  const editedPostIds = rawPosts
    .filter((p) => p.edited_at && (!p.deleted_at || viewerIsMod))
    .map((p) => p.id);

  const lastEdits =
    editedPostIds.length > 0
      ? await prisma.forumPostEdit.findMany({
          where: { post_id: { in: editedPostIds } },
          orderBy: { created_at: "desc" },
          distinct: ["post_id"],
          select: {
            post_id: true,
            edited_by: true,
          },
        })
      : [];

  // Determine the role of each last editor
  const editorIds = lastEdits.map((e) => e.edited_by);
  const editorBadges =
    editorIds.length > 0 ? await getForumBadges(editorIds) : {};

  const lastEditMap = new Map<
    string,
    { edited_by: string; editor_badge: string | null }
  >();
  for (const edit of lastEdits) {
    lastEditMap.set(edit.post_id, {
      edited_by: edit.edited_by,
      editor_badge: editorBadges[edit.edited_by] ?? null,
    });
  }

  // Build posts response
  const posts = rawPosts.map((post) => {
    if (post.deleted_at) {
      const base = {
        id: post.id,
        body: "[deleted]",
        created_at: post.created_at,
        edited_at: null,
        deleted: true,
        edited_by_label: null as string | null,
        author: {
          user_id: "",
          username: "",
          display_name: "[deleted]",
          avatar: null,
          created_at: null,
          name_color: null as string | null,
          badge: null as string | null,
        },
        reactions: [] as { emoji: string; user_id: string }[],
        deleted_body: null as string | null,
        deleted_author: null as {
          user_id: string;
          username: string;
          display_name: string;
          avatar: string | null;
          created_at: string | null;
          name_color: string | null;
          badge: string | null;
        } | null,
      };

      // For mods/admins, include the original content and edit trail
      if (viewerIsMod) {
        base.deleted_body = post.body;
        base.deleted_author = {
          ...post.author,
          name_color: nameColors[post.author.user_id] ?? null,
          badge: badges[post.author.user_id] ?? null,
        };
        if (post.edited_at) {
          base.edited_at = post.edited_at;
          const lastEdit = lastEditMap.get(post.id);
          if (lastEdit && lastEdit.edited_by !== post.author_id) {
            base.edited_by_label =
              lastEdit.editor_badge === "admin" ? "admin" : "moderator";
          }
        }
      }

      return base;
    }

    // Determine edited_by_label
    let editedByLabel: string | null = null;
    if (post.edited_at) {
      const lastEdit = lastEditMap.get(post.id);
      if (lastEdit && lastEdit.edited_by !== post.author_id) {
        // Edited by someone other than the author
        if (lastEdit.editor_badge === "admin") {
          editedByLabel = "admin";
        } else {
          editedByLabel = "moderator";
        }
      }
    }

    return {
      id: post.id,
      body: post.body,
      created_at: post.created_at,
      edited_at: post.edited_at,
      deleted: false,
      edited_by_label: editedByLabel,
      author: {
        ...post.author,
        name_color: nameColors[post.author.user_id] ?? null,
        badge: badges[post.author.user_id] ?? null,
      },
      reactions: post.reactions,
      deleted_body: null,
      deleted_author: null,
    };
  });

  // Update last_read_at for subscribed users
  if (me) {
    await prisma.forumThreadSubscription.updateMany({
      where: {
        thread_id: threadId,
        user_id: me.id,
      },
      data: { last_read_at: new Date() },
    });
  }

  // Check if user is subscribed
  const subscribed = me
    ? !!(await prisma.forumThreadSubscription.findUnique({
        where: { thread_id_user_id: { thread_id: threadId, user_id: me.id } },
      }))
    : false;

  return {
    thread: {
      ...thread,
      author: {
        ...thread.author,
        name_color: nameColors[thread.author.user_id] ?? null,
        badge: badges[thread.author.user_id] ?? null,
      },
    },
    posts,
    total,
    page,
    perPage,
    subscribed,
  };
});
