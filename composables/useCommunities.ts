import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";
import { User } from "./useUsers";

export type CommunityPost = {
  id: string;
  content: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
  };
  replies: {
    id: string;
    content: string;
    created_at: string;
    user: {
      user_id: string;
      username: string;
      display_name: string;
      avatar: string | null;
    };
  }[];
  _count: {
    replies: number;
  };
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  members: User[];
  admins: {
    user_id: string;
  }[];
  posts: CommunityPost[];
};

export const useCommunities = defineStore("communities", {
  state: () => ({
    communities: new Map<string, FetchStatus<Community>>(),
  }),
  getters: {
    getCommunity(): (slug: string) => FetchStatus<Community> {
      return (slug: string) => {
        return this.communities.get(slug) || { status: Status.IDLE };
      };
    },
    isMember(): (slug: string, user_id: string | undefined) => boolean {
      return (slug: string, user_id: string | undefined) => {
        const community = this.getCommunity(slug);
        if (community.status !== Status.SUCCESS) return false;

        return community.data?.members.some(
          (member) => member.user_id === user_id
        );
      };
    },
    isModerator(): (slug: string, user_id: string | undefined) => boolean {
      return (slug: string, user_id: string | undefined) => {
        const community = this.getCommunity(slug);
        if (community.status !== Status.SUCCESS) return false;

        return community.data?.admins.some(
          (admin) => admin.user_id === user_id
        );
      };
    },
  },
  actions: {
    async fetchCommunity(slug: string) {
      // Mark as loading if we don't have the community yet
      if (!this.communities.has(slug))
        this.communities.set(slug, { status: Status.LOADING });

      try {
        const community = await $fetch<Community>(`/api/community/${slug}`);

        this.communities.set(slug, {
          status: Status.SUCCESS,
          data: community,
        });
      } catch (err) {
        this.communities.set(slug, {
          status: Status.ERROR,
          error: (err as any).statusMessage,
        });
      }
    },
    async submitPost(slug: string, content: string) {
      try {
        const post = await $fetch(`/api/community/${slug}/post`, {
          method: "POST",
          body: JSON.stringify({ content }),
        });

        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          community.data?.posts.unshift(post);
        }
      } catch (err) {
        console.error(err);
      }
    },
    async submitReply(slug: string, reply_to_id: string, content: string) {
      try {
        const reply = await $fetch(`/api/community/${slug}/post/`, {
          method: "POST",
          body: JSON.stringify({ content, reply_to_id }),
        });

        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          const post = community.data.posts.find((p) => p.id === reply_to_id);
          if (post) {
            post._count.replies++;
            post.replies.push(reply);
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    async deletePost(slug: string, post_id: string) {
      try {
        await $fetch(`/api/community/${slug}/post/${post_id}`, {
          method: "DELETE",
        });

        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          community.data.posts = community.data?.posts.filter(
            (post) => post.id !== post_id
          );
          community.data.posts.forEach((post) => {
            post.replies = post.replies.filter((reply) => reply.id !== post_id);
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    async toggleAdmin(slug: string, user_id: string) {
      try {
        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          const is_admin = community.data.admins.some(
            (admin) => admin.user_id === user_id
          );

          const method = is_admin ? "DELETE" : "POST";
          await $fetch(`/api/community/${slug}/admin/${user_id}`, {
            method,
          });

          if (is_admin) {
            community.data.admins = community.data.admins.filter(
              (admin) => admin.user_id !== user_id
            );
          } else {
            community.data.admins.push({ user_id });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  },
});
