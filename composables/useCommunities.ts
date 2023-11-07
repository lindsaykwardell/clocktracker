import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";
import { User } from "./useUsers";

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  members: User[];
  admins: {
    user_id: string;
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
  },
});
