import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";
import { FriendRequest } from "@prisma/client";

type Friend = {
  user_id: string;
  username: string;
};

type PendingFriendRequest = FriendRequest & {
  from_user: Friend;
  user: Friend;
};

export enum FriendStatus {
  FRIENDS,
  REQUEST_SENT,
  REQUEST_RECEIVED,
  NOT_FRIENDS,
}

export const useFriends = defineStore("friends", {
  state: () => ({
    friends: { status: Status.IDLE } as FetchStatus<Friend[]>,
    requests: { status: Status.IDLE } as FetchStatus<PendingFriendRequest[]>,
  }),
  getters: {
    getFriends(): Friend[] {
      if (this.friends.status !== Status.SUCCESS) return [];

      return this.friends.data;
    },
    getFriendStatus(): (user_id: string) => FriendStatus {
      return (user_id: string): FriendStatus => {
        if (
          this.friends.status === Status.SUCCESS &&
          this.requests.status === Status.SUCCESS
        ) {
          const friend = this.friends.data.find(
            (friend) => friend.user_id === user_id
          );
          const request = this.getFriendRequest(user_id);

          if (friend) return FriendStatus.FRIENDS;
          if (request?.user_id === user_id) return FriendStatus.REQUEST_SENT;
          if (request?.from_user_id === user_id)
            return FriendStatus.REQUEST_RECEIVED;
        }

        return FriendStatus.NOT_FRIENDS;
      };
    },
    getFriendRequests(): PendingFriendRequest[] {
      if (this.requests.status !== Status.SUCCESS) return [];

      return this.requests.data;
    },
    getFriendRequest(): (user_id: string) => PendingFriendRequest | undefined {
      return (user_id: string): PendingFriendRequest | undefined => {
        if (this.requests.status !== Status.SUCCESS) return undefined;

        return this.requests.data.find(
          (request) =>
            request.user_id === user_id || request.from_user_id === user_id
        );
      };
    },
    getRequestCount(): number {
      const user = useSupabaseUser();
      const user_id = user.value?.id;
      if (this.requests.status !== Status.SUCCESS) return 0;

      return this.requests.data.filter((req) => req.user_id === user_id).length;
    },
  },
  actions: {
    async fetchFriends() {
      const user = useSupabaseUser();
      if (!user.value) return;

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
    async fetchRequests() {
      const user = useSupabaseUser();
      if (!user.value) return;
      // Mark as loading if we don't have the user yet
      if (this.requests.status === Status.IDLE)
        this.requests = { status: Status.LOADING };

      // Fetch the user
      const requests = await $fetch("/api/friends/requests");

      // Otherwise, mark as success
      this.requests = {
        status: Status.SUCCESS,
        data: requests.map((request) => ({
          ...request,
          created_at: request.created_at ? new Date(request.created_at) : null,
        })),
      };
    },
    async sendRequest(user_id: string) {
      console.log("sendRequest", user_id);
      const request = await $fetch<PendingFriendRequest>(
        "/api/friends/requests",
        {
          method: "POST",
          body: JSON.stringify({ user_id }),
        }
      );

      if (this.requests.status === Status.SUCCESS) {
        this.requests.data.push({
          ...request,
          created_at: request.created_at ? new Date(request.created_at) : null,
        });
      }

      return request;
    },
    async cancelRequest(user_id: string) {
      console.log("cancelRequest", user_id);
      await $fetch("/api/friends/requests", {
        method: "POST",
        body: JSON.stringify({ user_id }),
      });

      if (this.requests.status === Status.SUCCESS) {
        this.requests.data = this.requests.data.filter(
          (req) => req.user_id !== user_id
        );
      }
    },
    async acceptRequest(request_id: number) {
      console.log("acceptRequest", request_id);
      const friend = await $fetch<Friend>(
        "/api/friends/requests/" + request_id + "/accept",
        {
          method: "POST",
        }
      );

      if (this.requests.status === Status.SUCCESS) {
        this.requests.data = this.requests.data.filter(
          (req) => req.id !== request_id
        );
      }

      this.fetchFriends();
    },
    async declineRequest(request_id: number) {
      console.log("declineRequest", request_id);
      await $fetch("/api/friends/requests/" + request_id + "/decline", {
        method: "POST",
      });

      if (this.requests.status === Status.SUCCESS) {
        this.requests.data = this.requests.data.filter(
          (req) => req.id !== request_id
        );
      }
    },
    async unfriend(username: string) {
      console.log("unfriend", username);
      await $fetch("/api/user/" + username + "/unfriend", {
        method: "POST",
      });

      if (this.friends.status === Status.SUCCESS) {
        this.friends.data = this.friends.data.filter(
          (friend) => friend.username !== username
        );
      }
    },
  },
});
