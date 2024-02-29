import { defineStore } from "pinia";
import type { FetchStatus } from "./useFetchStatus";
import type { User } from "./useUsers";

export type Community = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_private: boolean;
  members: User[];
  admins: {
    user_id: string;
  }[];
  banned_users?: User[];
  join_requests?: User[];
  posts: CommunityPost[];
  events: Event[];
  discord_server_id?: string;
};

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

export type Event = {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  location_type: "ONLINE" | "IN_PERSON";
  player_count?: number;
  image?: string;
  who_can_register: "ANYONE" | "COMMUNITY_MEMBERS";
  registered_players: {
    name: string;
    created_at: string;
    user: {
      user_id: string;
      username: string;
      avatar: string | null;
    };
  }[];
  waitlists: {
    id: number;
    name: string;
    default: boolean;
    users: {
      name: string;
      created_at: string;
      user: {
        user_id: string;
        username: string;
        avatar: string | null;
      };
    }[];
  }[];
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
    isBanned(): (slug: string, user_id: string | undefined) => boolean {
      return (slug: string, user_id: string | undefined) => {
        const community = this.getCommunity(slug);
        if (community.status !== Status.SUCCESS) return false;

        return (
          community.data?.banned_users?.some(
            (banned_user) => banned_user.user_id === user_id
          ) ?? false
        );
      };
    },
    isPending(): (slug: string, user_id: string | undefined) => boolean {
      return (slug: string, user_id: string | undefined) => {
        const community = this.getCommunity(slug);
        if (community.status !== Status.SUCCESS) return false;

        return (
          community.data?.join_requests?.some(
            (join_request) => join_request.user_id === user_id
          ) ?? false
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
    },
    async joinCommunity(slug: string) {
      try {
        const user = useSupabaseUser();
        const users = useUsers();
        const me = users.getUserById(user.value?.id);
        const community = this.communities.get(slug);
        if (
          community?.status === Status.SUCCESS &&
          me?.status === Status.SUCCESS
        ) {
          await $fetch(`/api/community/${slug}/join`, {
            method: "POST",
          });

          if (community.data.is_private) {
            // Assume there was no prior join requests array,
            // because one wouldn't have been fetched.

            community.data.join_requests = community.data.join_requests || [];
            community.data.join_requests.push(me.data);
          } else {
            community.data.members.push(me.data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    },
    async leaveCommunity(slug: string) {
      try {
        const user = useSupabaseUser();

        const community = this.communities.get(slug);
        if (user.value && community?.status === Status.SUCCESS) {
          await $fetch(`/api/community/${slug}/leave`, {
            method: "DELETE",
          });

          community.data.members = community.data.members.filter(
            (member) => member.user_id !== user.value!.id
          );
        }
      } catch (err) {
        console.error(err);
      }
    },
    async removeUser(slug: string, user_id: string) {
      try {
        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          const removedUser = await $fetch(
            `/api/community/${slug}/admin/${user_id}/remove`,
            {
              method: "DELETE",
            }
          );

          community.data.members = community.data.members.filter(
            (member) => member.user_id !== user_id
          );
          community.data.admins = community.data.admins.filter(
            (admin) => admin.user_id !== user_id
          );
          community.data.banned_users!.push(removedUser as User);
        }
      } catch (err) {
        console.error(err);
      }
    },
    async unbanUser(slug: string, user_id: string) {
      try {
        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          await $fetch(`/api/community/${slug}/admin/${user_id}/unban`, {
            method: "DELETE",
          });

          community.data.banned_users = community.data.banned_users!.filter(
            (banned_user) => banned_user.user_id !== user_id
          );
        }
      } catch (err) {
        console.error(err);
      }
    },
    async approveUser(slug: string, user_id: string) {
      try {
        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          const user = await $fetch<User>(
            `/api/community/${slug}/admin/${user_id}/approve`,
            {
              method: "POST",
            }
          );

          community.data.join_requests = community.data.join_requests!.filter(
            (join_request) => join_request.user_id !== user_id
          );
          community.data.members.push(user);
        }
      } catch (err) {
        console.error(err);
      }
    },
    async denyUser(slug: string, user_id: string) {
      try {
        const community = this.communities.get(slug);
        if (community?.status === Status.SUCCESS) {
          await $fetch(`/api/community/${slug}/admin/${user_id}/deny`, {
            method: "DELETE",
          });

          community.data.join_requests = community.data.join_requests!.filter(
            (join_request) => join_request.user_id !== user_id
          );
        }
      } catch (err) {
        console.error(err);
      }
    },
    async updateIcon(slug: string, icon: string) {
      const user = useSupabaseUser();
      if (this.isModerator(slug, user.value?.id)) {
        const response = await $fetch<Community>(`/api/community/${slug}`, {
          method: "PUT",
          body: JSON.stringify({ icon }),
        });

        this.communities.set(slug, {
          status: Status.SUCCESS,
          data: response,
        });
      }
    },
    async updateCommunity(
      slug: string,
      body: {
        slug: string;
        name: string;
        description: string;
        is_private: boolean;
        discord_server_id: string;
      }
    ) {
      const user = useSupabaseUser();
      if (this.isModerator(slug, user.value?.id)) {
        const response = await $fetch<Community>(`/api/community/${slug}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });

        this.communities.set(body.slug, {
          status: Status.SUCCESS,
          data: response,
        });

        if (response.slug !== slug) {
          const router = useRouter();
          this.communities.delete(slug);
          router.push(`/community/${response.slug}/dashboard`);
        }
      }
    },
  },
});
