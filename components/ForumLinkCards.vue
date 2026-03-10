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

            <!-- GitHub Issue/PR Card -->
            <a
                v-else-if="card.type === 'github' && card.data"
                :href="card.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 px-3 py-2 hover:bg-stone-300/50 dark:hover:bg-stone-700/30 transition-colors"
            >
                <div
                    class="w-10 h-10 rounded shrink-0 flex items-center justify-center"
                    :class="
                        card.data.state === 'open'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500/20 text-purple-400'
                    "
                >
                    <svg
                        viewBox="0 0 16 16"
                        class="w-5 h-5"
                        fill="currentColor"
                    >
                        <template v-if="card.data.is_pull_request">
                            <path
                                d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"
                            />
                        </template>
                        <template v-else-if="card.data.state === 'open'">
                            <path
                                d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                            />
                            <path
                                d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
                            />
                        </template>
                        <template v-else>
                            <path
                                d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"
                            />
                            <path
                                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"
                            />
                        </template>
                    </svg>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold truncate">
                        {{ card.data.title }}
                        <span class="text-stone-400 font-normal"
                            >#{{ card.data.number }}</span
                        >
                    </div>
                    <div class="text-xs text-stone-400 truncate">
                        {{ card.data.is_pull_request ? "Pull Request" : "Issue" }}
                        &middot;
                        <span
                            :class="
                                card.data.state === 'open'
                                    ? 'text-green-400'
                                    : 'text-purple-400'
                            "
                            >{{ card.data.state }}</span
                        >
                        <template v-if="card.data.author">
                            &middot; {{ card.data.author }}
                        </template>
                        <template v-if="card.data.comments > 0">
                            &middot; {{ card.data.comments }} comment{{
                                card.data.comments === 1 ? "" : "s"
                            }}
                        </template>
                    </div>
                    <div
                        v-if="card.data.labels?.length"
                        class="flex gap-1 mt-1 flex-wrap"
                    >
                        <span
                            v-for="label in card.data.labels.slice(0, 5)"
                            :key="label.name"
                            class="inline-block px-1.5 py-0.5 text-[0.625rem] rounded-full font-medium"
                            :style="{
                                backgroundColor: `#${label.color}33`,
                                color: `#${label.color}`,
                            }"
                        >
                            {{ label.name }}
                        </span>
                    </div>
                </div>
            </a>

            <!-- Failed to load -->
            <div
                v-else-if="!card.loading && !card.data"
                class="px-3 py-2 text-xs text-stone-400"
            >
                <component
                    :is="card.type === 'github' ? 'a' : 'nuxt-link'"
                    :to="card.type !== 'github' ? card.url : undefined"
                    :href="card.type === 'github' ? card.url : undefined"
                    :target="card.type === 'github' ? '_blank' : undefined"
                    :rel="card.type === 'github' ? 'noopener noreferrer' : undefined"
                    class="hover:underline"
                >
                    {{ card.url }}
                </component>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type CardType = "user" | "role" | "script" | "community" | "game" | "github";

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

// Client-side cache shared across all ForumLinkCards instances
const cardCache = new Map<string, { data: any; fetchedAt: number }>();
const CARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | undefined {
    const entry = cardCache.get(key);
    if (entry && Date.now() - entry.fetchedAt < CARD_CACHE_TTL) {
        return entry.data;
    }
    return undefined;
}

function setCache(key: string, data: any): void {
    cardCache.set(key, { data, fetchedAt: Date.now() });
}

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

    // Match GitHub issue/PR URLs (both markdown link targets and bare)
    const githubRegex =
        /https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/(issues|pull)\/(\d+)/g;
    while ((match = githubRegex.exec(body)) !== null) {
        const fullUrl = match[0];
        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);
        links.push({
            type: "github",
            url: fullUrl,
            param: `${match[1]}/${match[2]}/${match[3] === "pull" ? "pulls" : "issues"}/${match[4]}`,
        });
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
    const cacheKey = `${link.type}:${link.param}`;
    const cached = getCached(cacheKey);
    if (cached !== undefined) return cached;

    try {
        const result = await fetchCardData(link);
        if (result !== null) setCache(cacheKey, result);
        return result;
    } catch {
        return null;
    }
}

async function fetchCardData(link: InternalLink): Promise<any> {
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
            case "github": {
                // param format: owner/repo/type/number
                const [owner, repo, type, number] = link.param.split("/");
                return await $fetch("/api/forum/github-preview", {
                    query: { owner, repo, type, number },
                });
            }
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
