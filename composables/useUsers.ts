import { defineStore } from "pinia";
import { FetchStatus } from "./useFetchStatus";
import { PrivacySetting } from "@prisma/client";

export type User = {
  location: string | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  pronouns: string | null;
  bio: string;
  privacy: PrivacySetting;
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
    getUserById(): (user_id: string) => FetchStatus<User> {
      return (user_id: string) => {
        for (const user of this.users.values()) {
          if (user.status === Status.SUCCESS && user.data.user_id === user_id)
            return user;
        }

        return { status: Status.IDLE };
      };
    },
    getMe(): User | undefined {
      const user = useSupabaseUser();
      if (!user.value) return undefined;

      const me = this.getUserById(user.value.id);
      if (me.status !== Status.SUCCESS) return undefined;
      return me.data;
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
      this.storeUser(user);
    },
    storeUser(user: User) {
      this.users.set(user.username, { status: Status.SUCCESS, data: user });
    },
    async fetchMe() {
      const me = await $fetch("/api/settings");

      this.storeUser(me);
    }
  },
});
