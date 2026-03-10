import { defineStore } from "pinia";
import type { FetchStatus } from "./useFetchStatus";
import { Status } from "./useFetchStatus";

export type ForumUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  created_at: string | null;
  name_color?: string | null;
  badge?: string | null;
};

export type ForumCategoryGroup = {
  id: string;
  name: string;
  sort_order: number;
  categories: ForumCategory[];
};

export type ForumCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  group_id: string | null;
  threadCount: number;
  lastPost: {
    threadId: string;
    threadTitle: string;
    createdAt: string;
    author: ForumUser;
  } | null;
};

export type ForumCategoriesResponse = {
  ungrouped: ForumCategory[];
  groups: ForumCategoryGroup[];
};

export type ForumThread = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  last_post_at: string;
  author: ForumUser;
  _count: { posts: number };
};

export type ForumPostReaction = {
  emoji: string;
  user_id: string;
};

export type ForumPost = {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted?: boolean;
  edited_by_label?: string | null;
  deleted_body?: string | null;
  deleted_author?: ForumUser | null;
  author: ForumUser;
  reactions: ForumPostReaction[];
};

export type ThreadListResponse = {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    is_private: boolean;
  };
  threads: ForumThread[];
  total: number;
  page: number;
  perPage: number;
};

export type ThreadDetailResponse = {
  thread: ForumThread & {
    category: {
      id: string;
      name: string;
      slug: string;
      is_private: boolean;
    };
  };
  posts: ForumPost[];
  total: number;
  page: number;
  perPage: number;
  subscribed: boolean;
};

export const useForum = defineStore("forum", {
  state: () => ({
    categories: { status: Status.IDLE } as FetchStatus<ForumCategoriesResponse>,
    threads: new Map<string, FetchStatus<ThreadListResponse>>(),
    threadDetail: new Map<string, FetchStatus<ThreadDetailResponse>>(),
  }),
  actions: {
    async fetchCategories() {
      this.categories = { status: Status.LOADING };
      try {
        const data = await $fetch<ForumCategoriesResponse>("/api/forum/categories");
        this.categories = { status: Status.SUCCESS, data };
      } catch (err) {
        this.categories = { status: Status.ERROR, error: err };
      }
    },

    async fetchThreads(slug: string, page = 1) {
      this.threads.set(slug, { status: Status.LOADING });
      try {
        const data = await $fetch<ThreadListResponse>(
          `/api/forum/categories/${slug}/threads`,
          { params: { page } }
        );
        this.threads.set(slug, { status: Status.SUCCESS, data });
      } catch (err) {
        this.threads.set(slug, { status: Status.ERROR, error: err });
      }
    },

    async fetchThread(threadId: string, page = 1) {
      this.threadDetail.set(threadId, { status: Status.LOADING });
      try {
        const data = await $fetch<ThreadDetailResponse>(
          `/api/forum/threads/${threadId}`,
          { params: { page } }
        );
        this.threadDetail.set(threadId, { status: Status.SUCCESS, data });
      } catch (err) {
        this.threadDetail.set(threadId, { status: Status.ERROR, error: err });
      }
    },

    async createThread(
      slug: string,
      title: string,
      body: string
    ): Promise<ForumThread> {
      const thread = await $fetch<ForumThread>(
        `/api/forum/categories/${slug}/threads`,
        {
          method: "POST",
          body: { title, body },
        }
      );
      return thread;
    },

    async createPost(threadId: string, body: string): Promise<ForumPost> {
      const post = await $fetch<ForumPost>(
        `/api/forum/threads/${threadId}/posts`,
        {
          method: "POST",
          body: { body },
        }
      );

      const cached = this.threadDetail.get(threadId);
      if (cached?.status === Status.SUCCESS) {
        cached.data.posts.push(post);
        cached.data.total++;
      }

      return post;
    },

    async editPost(postId: string, body: string): Promise<ForumPost> {
      return await $fetch<ForumPost>(`/api/forum/posts/${postId}`, {
        method: "PUT",
        body: { body },
      });
    },

    async deletePost(
      threadId: string,
      postId: string
    ): Promise<{ success: boolean; threadDeleted: boolean }> {
      const result = await $fetch<{
        success: boolean;
        threadDeleted: boolean;
      }>(`/api/forum/posts/${postId}`, { method: "DELETE" });

      if (!result.threadDeleted) {
        const cached = this.threadDetail.get(threadId);
        if (cached?.status === Status.SUCCESS) {
          const idx = cached.data.posts.findIndex((p) => p.id === postId);
          if (idx !== -1) {
            const existing = cached.data.posts[idx];
            cached.data.posts[idx] = {
              ...existing,
              body: "[deleted]",
              deleted: true,
              edited_at: null,
              edited_by_label: null,
              deleted_body: existing.body,
              deleted_author: { ...existing.author },
              author: {
                user_id: "",
                username: "",
                display_name: "[deleted]",
                avatar: null,
                created_at: null,
                name_color: null,
                badge: null,
              },
              reactions: [],
            };
          }
        }
      }

      return result;
    },

    async toggleReaction(
      threadId: string,
      postId: string,
      emoji: string,
      userId: string
    ): Promise<void> {
      await $fetch(`/api/forum/posts/${postId}/reactions`, {
        method: "POST",
        body: { emoji },
      });

      // Optimistically update the cached post
      const cached = this.threadDetail.get(threadId);
      if (cached?.status === Status.SUCCESS) {
        const post = cached.data.posts.find((p) => p.id === postId);
        if (post) {
          const idx = post.reactions.findIndex(
            (r) => r.emoji === emoji && r.user_id === userId
          );
          if (idx !== -1) {
            post.reactions.splice(idx, 1);
          } else {
            post.reactions.push({ emoji, user_id: userId });
          }
        }
      }
    },

    async deleteThread(threadId: string): Promise<void> {
      await $fetch(`/api/forum/threads/${threadId}`, { method: "DELETE" });
      this.threadDetail.delete(threadId);
    },

    async editThreadTitle(threadId: string, title: string): Promise<void> {
      await $fetch(`/api/forum/threads/${threadId}`, {
        method: "PUT",
        body: { title },
      });

      const cached = this.threadDetail.get(threadId);
      if (cached?.status === Status.SUCCESS) {
        cached.data.thread.title = title;
      }
    },

    async togglePin(threadId: string): Promise<void> {
      const result = await $fetch<{ id: string; is_pinned: boolean }>(
        `/api/forum/threads/${threadId}/pin`,
        { method: "PUT" }
      );

      const cached = this.threadDetail.get(threadId);
      if (cached?.status === Status.SUCCESS) {
        cached.data.thread.is_pinned = result.is_pinned;
      }
    },

    async toggleLock(threadId: string): Promise<void> {
      const result = await $fetch<{ id: string; is_locked: boolean }>(
        `/api/forum/threads/${threadId}/lock`,
        { method: "PUT" }
      );

      const cached = this.threadDetail.get(threadId);
      if (cached?.status === Status.SUCCESS) {
        cached.data.thread.is_locked = result.is_locked;
      }
    },
  },
});
