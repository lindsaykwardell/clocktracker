<template>
    <div class="relative inline-block forum-link-insert">
        <Button
            variant="link"
            size="sm"
            icon="sign"
            title="Insert link to user, role, script, or game"
            @click="toggle"
        >
            Link to content
        </Button>
        <div
            v-if="open"
            class="absolute z-20 bottom-full mb-2 left-0 w-80 rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-lg"
        >
            <!-- Tabs -->
            <div
                class="flex text-xs border-b border-stone-300/50 dark:border-stone-700/50"
            >
                <button
                    type="button"
                    class="flex-1 px-3 py-1.5 transition-colors"
                    :class="
                        tab === 'search'
                            ? 'text-primary border-b border-primary'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                    "
                    @click="tab = 'search'"
                >
                    Search
                </button>
                <button
                    type="button"
                    class="flex-1 px-3 py-1.5 transition-colors"
                    :class="
                        tab === 'games'
                            ? 'text-primary border-b border-primary'
                            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                    "
                    @click="switchToGames"
                >
                    My Games
                </button>
            </div>

            <!-- Search Tab -->
            <template v-if="tab === 'search'">
                <div
                    class="p-2 border-b border-stone-300/50 dark:border-stone-700/50"
                >
                    <input
                        ref="searchInput"
                        v-model="query"
                        type="text"
                        placeholder="Search users, roles, scripts..."
                        class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-sm focus:outline-none focus:border-primary"
                        @keydown.escape="open = false"
                    />
                </div>
                <div class="max-h-64 overflow-y-auto">
                    <div
                        v-if="loading"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        Searching...
                    </div>
                    <div
                        v-else-if="query.length < 3"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        Type at least 3 characters
                    </div>
                    <div
                        v-else-if="!hasResults"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        No results found
                    </div>
                    <template v-else>
                        <!-- Users -->
                        <template v-if="results.users.length > 0">
                            <div
                                class="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-stone-400"
                            >
                                Users
                            </div>
                            <button
                                v-for="u in results.users.slice(0, 5)"
                                :key="u.user_id"
                                type="button"
                                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-left"
                                @click="insertUser(u)"
                            >
                                <Avatar
                                    :value="u.avatar"
                                    size="xs"
                                    class="border-stone-800 shrink-0"
                                    background
                                />
                                <div class="min-w-0">
                                    <div class="truncate font-medium">
                                        {{ u.display_name }}
                                    </div>
                                    <div
                                        class="truncate text-xs text-stone-400"
                                    >
                                        @{{ u.username }}
                                    </div>
                                </div>
                            </button>
                        </template>

                        <!-- Roles -->
                        <template v-if="results.roles.length > 0">
                            <div
                                class="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-stone-400"
                            >
                                Roles
                            </div>
                            <button
                                v-for="r in results.roles.slice(0, 5)"
                                :key="r.id"
                                type="button"
                                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-left"
                                @click="insertRole(r)"
                            >
                                <img
                                    v-if="roleImageUrl(r)"
                                    :src="roleImageUrl(r)!"
                                    :alt="r.name"
                                    class="w-6 h-6 rounded-full shrink-0"
                                />
                                <div
                                    v-else
                                    class="w-6 h-6 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0"
                                />
                                <div class="min-w-0">
                                    <div class="truncate font-medium">
                                        {{ r.name }}
                                    </div>
                                    <div
                                        class="truncate text-xs text-stone-400 capitalize"
                                    >
                                        {{ r.type }}
                                    </div>
                                </div>
                            </button>
                        </template>

                        <!-- Scripts -->
                        <template v-if="results.scripts.length > 0">
                            <div
                                class="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-stone-400"
                            >
                                Scripts
                            </div>
                            <button
                                v-for="s in results.scripts.slice(0, 5)"
                                :key="s.id"
                                type="button"
                                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-left"
                                @click="insertScript(s)"
                            >
                                <img
                                    v-if="s.logo"
                                    :src="s.logo"
                                    :alt="s.name"
                                    class="w-6 h-6 rounded shrink-0 object-contain"
                                />
                                <div
                                    v-else
                                    class="w-6 h-6 rounded bg-stone-300 dark:bg-stone-600 shrink-0"
                                />
                                <div class="min-w-0">
                                    <div class="truncate font-medium">
                                        {{ s.name }}
                                    </div>
                                    <div
                                        v-if="s.author"
                                        class="truncate text-xs text-stone-400"
                                    >
                                        by {{ s.author }}
                                    </div>
                                </div>
                            </button>
                        </template>

                        <!-- Communities -->
                        <template v-if="results.communities.length > 0">
                            <div
                                class="px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-stone-400"
                            >
                                Communities
                            </div>
                            <button
                                v-for="c in results.communities.slice(0, 5)"
                                :key="c.id"
                                type="button"
                                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-left"
                                @click="insertCommunity(c)"
                            >
                                <img
                                    v-if="c.icon"
                                    :src="c.icon"
                                    :alt="c.name"
                                    class="w-6 h-6 rounded-full shrink-0"
                                />
                                <div
                                    v-else
                                    class="w-6 h-6 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0"
                                />
                                <div class="min-w-0">
                                    <div class="truncate font-medium">
                                        {{ c.name }}
                                    </div>
                                </div>
                            </button>
                        </template>
                    </template>
                </div>
            </template>

            <!-- My Games Tab -->
            <template v-if="tab === 'games'">
                <div
                    class="p-2 border-b border-stone-300/50 dark:border-stone-700/50"
                >
                    <input
                        ref="gameSearchInput"
                        v-model="gameFilter"
                        type="text"
                        placeholder="Filter by script name, location..."
                        class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-sm focus:outline-none focus:border-primary"
                        @keydown.escape="open = false"
                    />
                </div>
                <div class="max-h-64 overflow-y-auto">
                    <div
                        v-if="gamesLoading"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        Loading games...
                    </div>
                    <div
                        v-else-if="filteredGames.length === 0 && !gameFilter"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        No games found.
                    </div>
                    <div
                        v-else-if="filteredGames.length === 0"
                        class="p-3 text-center text-sm text-stone-400"
                    >
                        No games matching "{{ gameFilter }}"
                    </div>
                    <template v-else>
                        <button
                            v-for="game in filteredGames.slice(0, 20)"
                            :key="game.id"
                            type="button"
                            class="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-left"
                            @click="insertGame(game)"
                        >
                            <img
                                :src="game.associated_script?.logo ?? scriptLogo(game.script)"
                                :alt="game.script"
                                class="w-6 h-6 rounded shrink-0 object-contain"
                            />
                            <div class="min-w-0">
                                <div class="truncate font-medium">
                                    {{ game.script }}
                                </div>
                                <div
                                    class="truncate text-xs text-stone-400"
                                >
                                    {{ formatGameDate(game.date) }}
                                    <template
                                        v-if="game.community_name"
                                    >
                                        &middot;
                                        {{ game.community_name }}
                                    </template>
                                    <template
                                        v-else-if="game.location"
                                    >
                                        &middot; {{ game.location }}
                                    </template>
                                </div>
                            </div>
                        </button>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

const emit = defineEmits<{
    insert: [markdown: string];
}>();

const games = useGames();
const me = useMe();
const { roleBaseUrlFromRole, sizeAdjustedUrl } = useRoleImage();
const { scriptLogo } = useScripts();

const myUsername = computed(() =>
    me.value.status === Status.SUCCESS ? me.value.data.username : null,
);

function roleImageUrl(role: { id: string; token_url: string | null }): string | undefined {
    const baseUrl = roleBaseUrlFromRole(role);
    return sizeAdjustedUrl(baseUrl, "sm");
}

const open = ref(false);
const tab = ref<"search" | "games">("search");
const query = ref("");
const loading = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const gameSearchInput = ref<HTMLInputElement | null>(null);
const gameFilter = ref("");
const gamesLoading = ref(false);
const gamesFetched = ref(false);

type SearchResults = {
    users: {
        user_id: string;
        username: string;
        display_name: string;
        avatar: string | null;
    }[];
    roles: {
        id: string;
        name: string;
        type: string;
        token_url: string | null;
    }[];
    scripts: { id: number; name: string; author: string | null; logo: string | null }[];
    communities: {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
    }[];
};

const results = ref<SearchResults>({
    users: [],
    roles: [],
    scripts: [],
    communities: [],
});

const hasResults = computed(
    () =>
        results.value.users.length > 0 ||
        results.value.roles.length > 0 ||
        results.value.scripts.length > 0 ||
        results.value.communities.length > 0,
);

const allGames = computed(() => {
    if (!myUsername.value) return [];
    const data = games.getByPlayer(myUsername.value);
    if (data?.status !== Status.SUCCESS) return [];
    return [...data.data].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
});

const filteredGames = computed(() => {
    if (!gameFilter.value) return allGames.value;
    const q = gameFilter.value.toLowerCase();
    return allGames.value.filter(
        (g) =>
            g.script?.toLowerCase().includes(q) ||
            g.location?.toLowerCase().includes(q) ||
            g.community_name?.toLowerCase().includes(q) ||
            g.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
            g.player_characters?.some((c: any) =>
                c.name?.toLowerCase().includes(q),
            ),
    );
});

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(query, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (val.length < 3) {
        results.value = {
            users: [],
            roles: [],
            scripts: [],
            communities: [],
        };
        return;
    }
    loading.value = true;
    searchTimeout = setTimeout(async () => {
        try {
            results.value = await $fetch("/api/search", {
                query: { query: val },
            });
        } catch {
            results.value = {
                users: [],
                roles: [],
                scripts: [],
                communities: [],
            };
        } finally {
            loading.value = false;
        }
    }, 300);
});

function toggle() {
    open.value = !open.value;
    if (open.value) {
        tab.value = "search";
        query.value = "";
        gameFilter.value = "";
        results.value = {
            users: [],
            roles: [],
            scripts: [],
            communities: [],
        };
        nextTick(() => searchInput.value?.focus());
    }
}

async function switchToGames() {
    tab.value = "games";
    gameFilter.value = "";
    nextTick(() => gameSearchInput.value?.focus());

    if (!gamesFetched.value && myUsername.value) {
        gamesLoading.value = true;
        try {
            await games.fetchPlayerGames(myUsername.value);
        } catch {}
        gamesLoading.value = false;
        gamesFetched.value = true;
    }
}

function formatGameDate(date: string | null): string {
    if (!date) return "";
    return new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
    }).format(new Date(date));
}

function insertUser(u: SearchResults["users"][number]) {
    emit("insert", `[@${u.username}](/@${u.username})`);
    open.value = false;
}

function insertRole(r: SearchResults["roles"][number]) {
    emit("insert", `[${r.name}](/roles/${r.id})`);
    open.value = false;
}

function insertScript(s: SearchResults["scripts"][number]) {
    const encoded = encodeURIComponent(s.name);
    emit("insert", `[${s.name}](/scripts/${encoded})`);
    open.value = false;
}

function insertCommunity(c: SearchResults["communities"][number]) {
    emit("insert", `[${c.name}](/community/${c.slug})`);
    open.value = false;
}

function insertGame(game: any) {
    const label = `${game.script} (${formatGameDate(game.date)})`;
    const username = myUsername.value;
    const url = username
        ? `/@${username}/game/${game.id}`
        : `/game/${game.id}`;
    emit("insert", `[${label}](${url})`);
    open.value = false;
}

function onClickOutside(e: MouseEvent) {
    if (
        open.value &&
        !(e.target as HTMLElement).closest(".forum-link-insert")
    ) {
        open.value = false;
    }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() =>
    document.removeEventListener("click", onClickOutside),
);
</script>
