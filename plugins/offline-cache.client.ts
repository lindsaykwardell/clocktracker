import { markRaw } from "vue";
import { cacheGet, cacheSet, cacheClear } from "~/utils/offlineCache";
import type { GameRecord } from "~/composables/useGames";
import type { User } from "~/composables/useUsers";
import type { RoleRecord } from "~/composables/useRoles";
import type { Community } from "~/composables/useCommunities";

// Debounce writes to avoid hammering IndexedDB on rapid state changes
const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedCacheSet(key: string, value: unknown, delay = 1000) {
  const existing = pendingWrites.get(key);
  if (existing) clearTimeout(existing);
  pendingWrites.set(
    key,
    setTimeout(() => {
      pendingWrites.delete(key);
      cacheSet(key, value);
    }, delay)
  );
}

// Serialization helpers — extract raw data from store state

function serializeGames(store: ReturnType<typeof useGames>) {
  const games: Record<string, GameRecord> = {};
  for (const [id, status] of store.games) {
    if (status.status === Status.SUCCESS) {
      games[id] = status.data;
    }
  }
  const players: Record<string, number> = {};
  for (const [username, status] of store.players) {
    if (status.status === Status.SUCCESS) {
      players[username] = status.data;
    }
  }
  return { games, players };
}

function serializeUsers(store: ReturnType<typeof useUsers>) {
  const users: Record<string, User> = {};
  for (const [username, status] of store.users) {
    if (status.status === Status.SUCCESS) {
      users[username] = status.data;
    }
  }
  return users;
}

function serializeRoles(store: ReturnType<typeof useRoles>) {
  const roles: Record<string, RoleRecord> = {};
  for (const [id, role] of store.roles) {
    roles[id] = role;
  }
  return roles;
}

function serializeFriends(store: ReturnType<typeof useFriends>) {
  return {
    friends:
      store.friends.status === Status.SUCCESS ? store.friends.data : null,
    requests:
      store.requests.status === Status.SUCCESS ? store.requests.data : null,
    communityMembers:
      store.communityMembers.status === Status.SUCCESS
        ? store.communityMembers.data
        : null,
  };
}

function serializeCommunities(store: ReturnType<typeof useCommunities>) {
  const communities: Record<string, Community> = {};
  for (const [slug, status] of store.communities) {
    if (status.status === Status.SUCCESS) {
      communities[slug] = status.data;
    }
  }
  return communities;
}

function serializeFeatureFlags(store: ReturnType<typeof useFeatureFlags>) {
  const flags: Record<string, boolean> = {};
  for (const [key, value] of store.flags) {
    flags[key] = value;
  }
  return {
    flags,
    scheduledMaintenance: store.scheduledMaintenance?.toISOString() ?? null,
  };
}

// Hydration helpers — restore data into stores

function hydrateGames(
  store: ReturnType<typeof useGames>,
  data: { games: Record<string, GameRecord>; players: Record<string, number> }
) {
  store.$patch((state) => {
    for (const [id, game] of Object.entries(data.games)) {
      state.games.set(id, { status: Status.SUCCESS, data: markRaw(game) });
    }
    for (const [username, count] of Object.entries(data.players)) {
      state.players.set(username, { status: Status.SUCCESS, data: count });
    }
  });
}

function hydrateUsers(
  store: ReturnType<typeof useUsers>,
  data: Record<string, User>
) {
  for (const [username, user] of Object.entries(data)) {
    store.users.set(username, {
      status: Status.SUCCESS,
      data: { ...user, favorites: user.favorites || [] },
    });
  }
}

function hydrateRoles(
  store: ReturnType<typeof useRoles>,
  data: Record<string, RoleRecord>
) {
  for (const [id, role] of Object.entries(data)) {
    store.roles.set(id, role);
  }
}

function hydrateFriends(
  store: ReturnType<typeof useFriends>,
  data: {
    friends: User[] | null;
    requests: any[] | null;
    communityMembers: User[] | null;
  }
) {
  if (data.friends) {
    store.friends = { status: Status.SUCCESS, data: data.friends };
  }
  if (data.requests) {
    store.requests = {
      status: Status.SUCCESS,
      data: data.requests.map((r: any) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at) : null,
      })),
    };
  }
  if (data.communityMembers) {
    store.communityMembers = {
      status: Status.SUCCESS,
      data: data.communityMembers,
    };
  }
}

function hydrateCommunities(
  store: ReturnType<typeof useCommunities>,
  data: Record<string, Community>
) {
  for (const [slug, community] of Object.entries(data)) {
    store.communities.set(slug, { status: Status.SUCCESS, data: community });
  }
}

function hydrateFeatureFlags(
  store: ReturnType<typeof useFeatureFlags>,
  data: { flags: Record<string, boolean>; scheduledMaintenance: string | null }
) {
  for (const [key, value] of Object.entries(data.flags)) {
    store.flags.set(key, value);
  }
  store.scheduledMaintenance = data.scheduledMaintenance
    ? new Date(data.scheduledMaintenance)
    : null;
}

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  const featureFlags = useFeatureFlags();

  // Hydrate feature flags from localStorage (synchronous, always available)
  try {
    const cached = localStorage.getItem("ct-feature-flags");
    if (cached) {
      const data = JSON.parse(cached) as ReturnType<typeof serializeFeatureFlags>;
      hydrateFeatureFlags(featureFlags, data);
    }
  } catch {}

  // Persist feature flags to localStorage on changes
  featureFlags.$subscribe(() => {
    try {
      localStorage.setItem(
        "ct-feature-flags",
        JSON.stringify(serializeFeatureFlags(featureFlags))
      );
    } catch {}
  });

  // Gate the rest behind feature flag (always enabled for Capacitor)
  const isEnabled =
    config.public.isCapacitorBuild || featureFlags.isEnabled("offline_cache");
  if (!isEnabled) return;

  const games = useGames();
  const users = useUsers();
  const roles = useRoles();
  const friends = useFriends();
  const communities = useCommunities();

  // --- Hydrate from cache on startup ---
  const [
    cachedGames,
    cachedUsers,
    cachedRoles,
    cachedFriends,
    cachedCommunities,
  ] = await Promise.all([
    cacheGet<ReturnType<typeof serializeGames>>("games"),
    cacheGet<ReturnType<typeof serializeUsers>>("users"),
    cacheGet<ReturnType<typeof serializeRoles>>("roles"),
    cacheGet<ReturnType<typeof serializeFriends>>("friends"),
    cacheGet<ReturnType<typeof serializeCommunities>>("communities"),
  ]);

  if (cachedRoles) hydrateRoles(roles, cachedRoles);
  if (cachedUsers) hydrateUsers(users, cachedUsers);
  if (cachedFriends) hydrateFriends(friends, cachedFriends);
  if (cachedCommunities) hydrateCommunities(communities, cachedCommunities);
  if (cachedGames) hydrateGames(games, cachedGames);

  // --- Persist on changes (debounced) ---
  games.$subscribe(() => {
    debouncedCacheSet("games", serializeGames(games));
  });

  users.$subscribe(() => {
    debouncedCacheSet("users", serializeUsers(users));
  });

  roles.$subscribe(() => {
    debouncedCacheSet("roles", serializeRoles(roles));
  });

  friends.$subscribe(() => {
    debouncedCacheSet("friends", serializeFriends(friends));
  });

  communities.$subscribe(() => {
    debouncedCacheSet("communities", serializeCommunities(communities));
  });

  // Clear cache on logout
  const user = useUser();
  watch(
    () => user.value?.id,
    (newId, oldId) => {
      if (!newId && oldId) {
        cacheClear();
      }
    }
  );
});
