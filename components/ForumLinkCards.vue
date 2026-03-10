<template>
    <div v-if="cards.length > 0" class="flex flex-col gap-2 mt-3">
        <div
            v-for="card in cards"
            :key="card.url"
            class="rounded border border-stone-300 dark:border-stone-700/50 bg-stone-200/50 dark:bg-stone-800/50 overflow-hidden"
        >
            <!-- Loading -->
            <div
                v-if="card.loading"
                class="px-3 py-2 text-xs text-stone-400 animate-pulse"
            >
                Loading preview...
            </div>

            <!-- User Card -->
            <nuxt-link
                v-else-if="card.type === 'user' && card.data"
                :to="card.url"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <Avatar
                    :value="card.data.avatar"
                    size="sm"
                    class="border-stone-800 shrink-0"
                    background
                />
                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.display_name }}
                    </div>
                    <div class="text-xs text-stone-400 truncate">
                        @{{ card.data.username }}
                        <template v-if="card.data.pronouns">
                            &middot; {{ card.data.pronouns }}
                        </template>
                    </div>
                    <div
                        v-if="card.data.bio"
                        class="text-xs text-stone-400 truncate mt-0.5"
                    >
                        {{ card.data.bio }}
                    </div>
                </div>
            </nuxt-link>

            <!-- Role Card -->
            <nuxt-link
                v-else-if="card.type === 'role' && card.data"
                :to="card.url"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <img
                    v-if="card.data.token_url"
                    :src="card.data.token_url"
                    :alt="card.data.name"
                    class="w-10 h-10 rounded-full shrink-0"
                />
                <div
                    v-else
                    class="w-10 h-10 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0"
                />
                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.name }}
                    </div>
                    <div class="text-xs text-stone-400 capitalize">
                        {{ card.data.type }}
                        <template v-if="card.data.initial_alignment">
                            &middot;
                            {{ card.data.initial_alignment }}
                        </template>
                    </div>
                    <div
                        v-if="card.data.ability"
                        class="text-xs text-stone-400 truncate mt-0.5"
                    >
                        {{ card.data.ability }}
                    </div>
                </div>
            </nuxt-link>

            <!-- Script Card -->
            <nuxt-link
                v-else-if="card.type === 'script' && card.data"
                :to="card.url"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <img
                    v-if="card.data.logo"
                    :src="card.data.logo"
                    :alt="card.data.name"
                    class="w-10 h-10 rounded shrink-0 object-contain"
                />
                <div
                    v-else
                    class="w-10 h-10 rounded bg-stone-300 dark:bg-stone-600 shrink-0 flex items-center justify-center"
                >
                    <IconUI id="book" size="sm" />
                </div>
                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.name }}
                    </div>
                    <div class="text-xs text-stone-400 truncate">
                        <template v-if="card.data.author">
                            by {{ card.data.author }}
                        </template>
                        <template v-if="card.data.version">
                            &middot; v{{ card.data.version }}
                        </template>
                    </div>
                </div>
            </nuxt-link>

            <!-- Community Card -->
            <nuxt-link
                v-else-if="card.type === 'community' && card.data"
                :to="card.url"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <img
                    v-if="card.data.icon"
                    :src="card.data.icon"
                    :alt="card.data.name"
                    class="w-10 h-10 rounded-full shrink-0 object-cover"
                />
                <div
                    v-else
                    class="w-10 h-10 rounded-full bg-stone-300 dark:bg-stone-600 shrink-0 flex items-center justify-center"
                >
                    <IconUI id="players" size="sm" />
                </div>
                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.name }}
                    </div>
                    <div
                        v-if="card.data.description"
                        class="text-xs text-stone-400 truncate"
                    >
                        {{ card.data.description }}
                    </div>
                    <div
                        v-if="card.data.location"
                        class="text-xs text-stone-400 truncate"
                    >
                        {{ card.data.location }}
                    </div>
                </div>
            </nuxt-link>

            <!-- Game Card -->
            <nuxt-link
                v-else-if="card.type === 'game' && card.data"
                :to="card.url"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <img
                    v-if="card.data.script_logo"
                    :src="card.data.script_logo"
                    :alt="card.data.script"
                    class="w-10 h-10 rounded shrink-0 object-contain"
                />
                <div
                    v-else
                    class="w-10 h-10 rounded bg-stone-300 dark:bg-stone-600 shrink-0 flex items-center justify-center"
                >
                    <IconUI id="book" size="sm" />
                </div>
                <div class="min-w-0">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.script }}
                    </div>
                    <div class="text-xs text-stone-400 truncate">
                        {{ formatGameDate(card.data.date) }}
                        <template v-if="card.data.is_storyteller">
                            &middot; Storyteller
                        </template>
                        <template
                            v-if="
                                card.data.player_count &&
                                card.data.player_count > 0
                            "
                        >
                            &middot; {{ card.data.player_count }} players
                        </template>
                    </div>
                    <div
                        v-if="card.data.community_name || card.data.location"
                        class="text-xs text-stone-400 truncate"
                    >
                        {{
                            card.data.community_name || card.data.location
                        }}
                    </div>
                </div>
            </nuxt-link>

            <!-- Failed to load -->
            <div
                v-else-if="!card.loading && !card.data"
                class="px-3 py-2 text-xs text-stone-400"
            >
                <nuxt-link :to="card.url" class="hover:underline">
                    {{ card.url }}
                </nuxt-link>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type CardType = "user" | "role" | "script" | "community" | "game";

type InternalLink = {
    type: CardType;
    url: string;
    param: string;
};

type CardState = {
    type: CardType;
    url: string;
    loading: boolean;
    data: any;
};

const props = defineProps<{
    body: string;
}>();

function formatGameDate(date: string | null): string {
    if (!date) return "";
    return new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
    }).format(new Date(date));
}

const cards = ref<CardState[]>([]);

function extractInternalLinks(body: string): InternalLink[] {
    const links: InternalLink[] = [];
    const seen = new Set<string>();

    // Match markdown links: [text](url)
    const mdLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdLinkRegex.exec(body)) !== null) {
        const url = match[2];
        processUrl(url, links, seen);
    }

    // Also match bare internal URLs that aren't in markdown links
    // Look for paths like /@username, /roles/x, /scripts/x, /community/x
    // but not ones already captured as markdown link targets
    const bareUrlRegex =
        /(?:^|\s)((?:\/@[\w-]+\/game\/[\w-]+|\/game\/[\w-]+|\/@[\w-]+|\/roles\/[\w-]+|\/scripts\/[\w-]+|\/community\/[\w-]+))(?:\s|$|[.,;!?)}\]])/gm;
    while ((match = bareUrlRegex.exec(body)) !== null) {
        const url = match[1];
        processUrl(url, links, seen);
    }

    return links;
}

function processUrl(
    url: string,
    links: InternalLink[],
    seen: Set<string>,
): void {
    if (seen.has(url)) return;

    let parsed: InternalLink | null = null;

    // Check for /@username/game/[id] before plain /@username
    const userGameMatch = url.match(/^\/@[\w-]+\/game\/([\w-]+)/);
    const gameMatch = url.match(/^\/game\/([\w-]+)/);

    if (userGameMatch) {
        parsed = { type: "game", url, param: userGameMatch[1] };
    } else if (gameMatch) {
        parsed = { type: "game", url, param: gameMatch[1] };
    } else if (url.startsWith("/@")) {
        const username = url.slice(2).split(/[?#]/)[0];
        if (username) parsed = { type: "user", url, param: username };
    } else if (url.startsWith("/roles/")) {
        const roleId = url.slice(7).split(/[?#]/)[0];
        if (roleId) parsed = { type: "role", url, param: roleId };
    } else if (url.startsWith("/scripts/")) {
        const name = decodeURIComponent(url.slice(9).split(/[?#]/)[0]);
        if (name) parsed = { type: "script", url, param: name };
    } else if (url.startsWith("/community/")) {
        const slug = url.slice(11).split(/[?#/]/)[0];
        if (slug) parsed = { type: "community", url, param: slug };
    }

    if (parsed) {
        seen.add(url);
        links.push(parsed);
    }
}

async function fetchCard(link: InternalLink): Promise<any> {
    try {
        switch (link.type) {
            case "user": {
                const data = await $fetch<any>(
                    `/api/user/${link.param}`,
                );
                return {
                    username: data.username,
                    display_name: data.display_name,
                    avatar: data.avatar,
                    pronouns: data.pronouns,
                    bio: data.bio,
                };
            }
            case "role": {
                const { roleBaseUrlFromRole, sizeAdjustedUrl } =
                    useRoleImage();
                const data = await $fetch<any>(
                    `/api/role/${link.param}`,
                );
                const role = data.role;
                const baseUrl = roleBaseUrlFromRole(role);
                return {
                    name: role.name,
                    type: role.type,
                    initial_alignment: role.initial_alignment,
                    ability: role.ability,
                    token_url: sizeAdjustedUrl(baseUrl, "sm"),
                };
            }
            case "script": {
                const { scriptLogo } = useScripts();
                const data = await $fetch<any[]>(
                    `/api/script/name/${link.param}`,
                );
                if (data && data.length > 0) {
                    const s = data[0];
                    return {
                        name: s.name,
                        author: s.author,
                        version: s.version,
                        logo: s.logo ?? scriptLogo(s.name),
                    };
                }
                return null;
            }
            case "community": {
                const data = await $fetch<any>(
                    `/api/community/${link.param}`,
                );
                return {
                    name: data.name,
                    description: data.description,
                    icon: data.icon,
                    location: data.location,
                };
            }
            case "game": {
                const data = await $fetch<any>(
                    `/api/games/${link.param}`,
                );
                return {
                    script: data.script,
                    date: data.date,
                    player_count: data.player_count,
                    location: data.location,
                    location_type: data.location_type,
                    is_storyteller: data.is_storyteller,
                    win_v2: data.win_v2,
                    script_logo: data.associated_script?.logo,
                    community_name: data.community_name,
                };
            }
        }
    } catch {
        return null;
    }
}

watch(
    () => props.body,
    async (body) => {
        const links = extractInternalLinks(body);
        if (links.length === 0) {
            cards.value = [];
            return;
        }

        // Limit to avoid excessive fetching
        const limited = links.slice(0, 5);

        cards.value = limited.map((link) => ({
            type: link.type,
            url: link.url,
            loading: true,
            data: null,
        }));

        const results = await Promise.all(
            limited.map((link) => fetchCard(link)),
        );

        cards.value = limited.map((link, i) => ({
            type: link.type,
            url: link.url,
            loading: false,
            data: results[i],
        }));
    },
    { immediate: true },
);
</script>
