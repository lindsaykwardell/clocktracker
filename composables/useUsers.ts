import { defineStore } from "pinia";
import type { FetchStatus } from "./useFetchStatus";
import type { Chart } from "@prisma/client";

export enum PrivacySetting {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
  FRIENDS_ONLY = "FRIENDS_ONLY",
  PERSONAL = "PERSONAL",
}

export type User = {
  location: string | null;
  city_id: number | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  pronouns: string | null;
  bio: string;
  privacy: PrivacySetting;
  charts: Chart[];
  bgg_username: string | null;
  enable_bgstats: boolean;
  kofi_level: string;
  opt_into_testing: boolean;
  finished_welcome: boolean;
  disable_tutorials: boolean;
  community_admin: {
    id: number;
  }[];
  communities?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string;
    _count: {
      members: number;
      admins: number;
      posts: number;
    };
  }[];
  dids?: {
    id: number;
    did: string;
  }[];
  favorites: {
    game_id: string;
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
    getUserById(): (user_id?: string) => FetchStatus<User> {
      return (user_id?: string) => {
        for (const user of this.users.values()) {
          if (user.status === Status.SUCCESS && user.data.user_id === user_id)
            return user;
        }

        return this.users.get(user_id || "") || { status: Status.IDLE };
      };
    },
  },
  actions: {
    async fetchUser(username: string) {
      // Mark as loading if we don't have the user yet
      if (!this.users.has(username))
        this.users.set(username, { status: Status.LOADING });

      try {
        const user = await $fetch<User>(`/api/user/${username}`);

        this.storeUser(user);
      } catch (err) {
        this.users.set(username, { status: Status.ERROR, error: err });
      }
    },
    storeUser(user: User) {
      this.users.set(user.username, {
        status: Status.SUCCESS,
        data: { ...user, favorites: user.favorites || [] },
      });
    },
    async fetchMe(user_id?: string) {
      const friends = useFriends();
      const games = useGames();
      const router = useRouter();

      if (!user_id) return;
      this.users.set(user_id, { status: Status.LOADING });

      const me = await $fetch<User>("/api/settings");

      this.storeUser(me);

      games.fetchPlayerGames(me.username);
      friends.fetchFriends();
      friends.fetchRequests();

      setInterval(() => {
        friends.fetchRequests();
        // one minute
      }, 1000 * 60);

      if (!me.finished_welcome) {
        router.push("/welcome");
      }
    },
  },
});
