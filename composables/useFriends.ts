import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";
import { FriendRequest } from "@prisma/client";

type Friend = {
  user_id: string;
  username: string;
  avatar: string | null;
  display_name: string;
  pronouns: string | null;
  location: string | null;
};

export const useFriends = defineStore("friends", {
  state: () => ({
    friends: { status: Status.IDLE } as FetchStatus<Friend[]>,
    requests: { status: Status.IDLE } as FetchStatus<FriendRequest[]>,
  }),
  getters: {
    getFriends(): Friend[] {
      if (this.friends.status !== Status.SUCCESS) return [];

      return this.friends.data;
    },
    getRequestCount(): number {
      if (this.requests.status !== Status.SUCCESS) return 0;

      return this.requests.data.length;
    },
  },
  actions: {
    async fetchFriends() {
      // Mark as loading if we don't have the user yet
      if (this.friends.status === Status.IDLE)
        this.friends = { status: Status.LOADING };

      // Fetch the user
      const friends = await $fetch("/api/friends");

      // Otherwise, mark as success
      this.friends = {
        status: Status.SUCCESS,
        data: friends.map(({ friend }) => friend),
      };
    },
  },
});
