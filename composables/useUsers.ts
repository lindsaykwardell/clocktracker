import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";

export type User = {
  location: string | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  pronouns: string | null;
  bio: string;
  followers: {
    user: {
      user_id: string;
      username: string;
      avatar: string | null;
      display_name: string;
      pronouns: string | null;
      location: string | null;
    };
  }[];
  following: {
    following: {
      user_id: string;
      username: string;
      avatar: string | null;
      display_name: string;
      pronouns: string | null;
      location: string | null;
    };
  }[];
};

export const useUsers = defineStore("users", {
  state: () => ({
    users: new Map<string, FetchStatus<User>>(),
  }),
  getters: {
    getUser(): (username: string) => FetchStatus<User> {
      return (username: string) => {
        return this.users.get(username) || { status: Status.IDLE };
      };
    },
  },
  actions: {
    async fetchUser(username: string) {
      // Mark as loading if we don't have the user yet
      if (!this.users.has(username))
        this.users.set(username, { status: Status.LOADING });

      // Fetch the user
      const user = await $fetch(`/api/user/${username}`);

      // // If we got an error, mark as error
      // if (user.error.value) {
      //   this.users.set(username, { status: Status.ERROR, error: user.error });
      //   return;
      // }

      // Otherwise, mark as success
      this.users.set(username, {
        status: Status.SUCCESS,
        data: user,
      });
    },
  },
});
