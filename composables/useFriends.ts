import { defineStore } from "pinia";
import type { FetchStatus } from "./useFetchStatus";
import type { FriendRequest } from "@prisma/client";
import type { User } from "./useUsers";
import naturalOrder from "natural-order";

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
    friends: { status: Status.IDLE } as FetchStatus<User[]>,
    requests: { status: Status.IDLE } as FetchStatus<PendingFriendRequest[]>,
    recommended: { status: Status.IDLE } as FetchStatus<User[]>,
    communityMembers: { status: Status.IDLE } as FetchStatus<User[]>,
  }),
  getters: {
    getFriends(): User[] {
      if (this.friends.status !== Status.SUCCESS) return [];

      return naturalOrder(this.friends.data).orderBy("desc").sort(["username"]);
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
    getFriendRecommendations(): User[] {
      if (this.recommended.status !== Status.SUCCESS) return [];

      return this.recommended.data;
    },
    getCommunityMembers(): User[] {
      if (this.communityMembers.status !== Status.SUCCESS) return [];

      return this.communityMembers.data;
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
    getRequestCount(): (user_id?: string) => number {
      return (user_id) => {
        if (this.requests.status !== Status.SUCCESS) return 0;

        return this.requests.data.filter((req) => req.user_id === user_id)
          .length;
      };
    },
    getFriendByUsername(): (username: string) => User | undefined {
      return (username: string): User | undefined => {
        if (this.friends.status !== Status.SUCCESS) return undefined;

        return this.friends.data.find((friend) => friend.username === username);
      };
    },
    isFriend(): (username: string) => boolean {
      return (username: string): boolean => {
        if (this.friends.status !== Status.SUCCESS) return false;

        return this.friends.data.some((friend) => friend.username === username);
      };
    },
  },
  actions: {
    async fetchFriends() {
      const users = useUsers();

      // Mark as loading if we don't have the user yet
      if (this.friends.status === Status.IDLE)
        this.friends = { status: Status.LOADING };

      // Fetch the user
      const friends = await $fetch<{ friend: User }[]>("/api/friends");

      // Otherwise, mark as success
      this.friends = {
        status: Status.SUCCESS,
        data: friends.map(({ friend }) => friend),
      };
      this.friends.data.forEach((friend) => {
        users.storeUser(friend);
      });
    },
    async fetchRequests() {
      // Mark as loading if we don't have the user yet
      if (this.requests.status === Status.IDLE)
        this.requests = { status: Status.LOADING };

      // Fetch the user
      const requests = await $fetch("/api/friends/requests");

      // If the requests are different from last time, check to see if we have any new friends.
      if (
        this.requests.status === Status.SUCCESS &&
        requests.length !== this.requests.data.length
      ) {
        this.fetchFriends();
      }

      // Otherwise, mark as success
      this.requests = {
        status: Status.SUCCESS,
        data: requests.map((request) => ({
          ...request,
          created_at: request.created_at ? new Date(request.created_at) : null,
        })),
      };
    },
    async fetchRecommended() {
      // Only fetch recommended once
      if (this.recommended.status === Status.SUCCESS) return;

      const request = await $fetch<User[]>("/api/friends/suggested");

      this.recommended = {
        status: Status.SUCCESS,
        data: request,
      };

      const users = useUsers();
      request.forEach((user) => {
        users.storeUser(user);
      });
    },
    async fetchCommunityMembers() {
      const request = await $fetch<User[]>("/api/community_members");

      this.communityMembers = {
        status: Status.SUCCESS,
        data: request,
      };

      const users = useUsers();
      request.forEach((user) => {
        users.storeUser(user);
      });
    },
    async sendRequest(user_id: string) {
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
      await $fetch("/api/friends/requests", {
        method: "DELETE",
        body: JSON.stringify({ user_id }),
      });

      if (this.requests.status === Status.SUCCESS) {
        const friendRequest = this.getFriendRequest(user_id);
        this.requests.data = this.requests.data.filter(
          (req) => req.id !== friendRequest?.id
        );
      }
    },
    async acceptRequest(request_id: number) {
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
