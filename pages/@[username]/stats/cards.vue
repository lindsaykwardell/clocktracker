<template>
  <StandardTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="playerFetchStatus === Status.LOADING || games.status === Status.LOADING">
        <Loading />
      </template>

      <template v-else-if="playerFetchStatus === Status.ERROR || games.status === Status.ERROR">
        <p class="text-center text-xl font-sorts my-8">
          Unable to load achievements.
        </p>
      </template>

      <template v-else-if="!canViewStats">
        <p class="text-center text-xl font-sorts my-8">
          This account is private
        </p>
      </template>

      <template v-else>
        <UserHeader :player="player!">
          <div
            v-if="
              player?.privacy === PrivacySetting.PUBLIC ||
              isMe ||
              friends.getFriendStatus(player!.user_id) === FriendStatus.FRIENDS
            "
            class="flex flex-wrap justify-center md:justify-start w-100 md:-mx-3 md:w-[calc(100%+1.5rem)] gap-2 md:gap-1 py-2 md:py-0"
          >
            <nuxt-link
              :to="`/@${username}`"
              class="profile-tab border-transparent"
            >
              Profile
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=games`"
              class="profile-tab border-transparent"
            >
              Games
            </nuxt-link>
            <nuxt-link
              v-if="isMe"
              :to="`/@${username}?view=pending`"
              class="profile-tab border-transparent"
            >
              Tagged / Draft
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=stats`"
              class="profile-tab border-stone-500"
            >
              Stats
            </nuxt-link>
          </div>
        </UserHeader>

        <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
          <div
            class="flex flex-col gap-3 px-4"
          >
            <div class="flex items-center justify-between">
              <Button
                component="nuxt-link"
                :to="`/@${username}?view=stats`"
                color="neutral"
                variant="soft"
                icon="arrow-left"
              >
                Back to Stats
              </Button>

              <div class="flex gap-2 justify-center">
                <Button
                  @click="tab = 'role'"
                  :active="tab === 'role'"
                  color="primary"
                  variant="soft"
                >
                  Character
                </Button>
                <Button
                  @click="tab = 'general'"
                  :active="tab === 'general'"
                  color="primary"
                  variant="soft"
                >
                  General
                </Button>
              </div>
            </div>
          </div>

          <section>
            <div class="w-full px-4">
              <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
                Achievements
              </h2>

              <div
                v-if="tab === 'role' && rolePreviewCardGroups.length === 0"
                class="text-sm text-center text-stone-500 dark:text-stone-400 py-8"
              >
                No achievements available.
              </div>
              <template v-else-if="tab === 'role'">
                <div class="space-y-12">
                  <div class="text-center max-w-[80ch] mx-auto mb-16 space-y-8">
                    <p class="text-sm">
                      All card counts are attributed to the character's ability based on recorded game data. These cards show minimum tracked values. 
                      Older games and partially tracked games may be missing events, so treat all counts as "at least".
                    </p>
                  </div>
                  <section
                    v-for="scriptGroup in rolePreviewCardGroups"
                    :key="scriptGroup.script"
                    class="space-y-4"
                  >
                    <div class="flex flex-col items-center gap-4">
                      <img
                        :src="scriptGroup.image"
                        :alt="scriptGroup.title"
                        class="w-64 h-auto max-w-full"
                      >  
                      <h3 class="sr-only">
                        {{ scriptGroup.title }}
                      </h3>

                      <p class="font-sorts text-2xl">
                        <span class="sr-only">Completion: </span>
                        {{ scriptGroup.achievedCount }}/{{ scriptGroup.totalCount }}
                      </p>
                    </div>
                    <ul class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                      <RoleStatCard
                        v-for="previewCard in scriptGroup.cards"
                        :key="`${tab}-${previewCard.metric_key}-${previewCard.role_id ?? 'general'}`"
                        :card="cardForDisplay(previewCard)"
                        :games="games.status === Status.SUCCESS ? games.data : []"
                        :is-me="isMe"
                        :username="username"
                        :show-favorite-control="isMe"
                        :is-favorite="isFavoriteCard(previewCard)"
                        class="transition-opacity"
                        :class="previewCard.preview.count === 0 ? 'opacity-40' : ''"
                        show-zero-overlay
                        variant="horizontal"
                        @toggleFavorite="toggleFavoriteCard(previewCard)"
                      />
                    </ul>
                  </section>
                </div>
              </template>
              <div
                v-else-if="previewCards.length === 0"
                class="text-sm text-center text-stone-500 dark:text-stone-400 py-8"
              >
                No matching cards available.
              </div>

              <ul
                v-else
                class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              >
                <RoleStatCard
                  v-for="previewCard in previewCards"
                  :key="`${tab}-${previewCard.metric_key}-${previewCard.role_id ?? 'general'}`"
                  :card="cardForDisplay(previewCard)"
                  :games="games.status === Status.SUCCESS ? games.data : []"
                  :is-me="isMe"
                  :username="username"
                  :show-favorite-control="isMe"
                  :is-favorite="isFavoriteCard(previewCard)"
                  class="transition-opacity"
                  :class="previewCard.preview.count === 0 ? 'opacity-40' : ''"
                  show-zero-overlay
                  variant="horizontal"
                  @toggleFavorite="toggleFavoriteCard(previewCard)"
                />
              </ul>
            </div>
          </section>
        </div>
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { RoleType } from "~/composables/useRoles";
import {
  ROLE_STAT_CARD_DEFINITIONS,
  buildRoleStatCardPreview,
  getGeneralCardDefinitions,
  getRoleStatCardDefinition,
  getRoleCardDefinitions,
} from "~/composables/useRoleStatCards";

const username = useRoute().params.username as string;
const users = useUsers();
const gamesStore = useGames();
const roles = useRoles();
const friends = useFriends();
const meUser = useUser();

const tab = ref<"role" | "general">("role");

const playerStatus = computed(() => users.getUser(username));
const playerFetchStatus = computed(() => playerStatus.value.status);
const player = computed(() => {
  return playerStatus.value.status === Status.SUCCESS ? playerStatus.value.data : null;
});

const games = computed(() => gamesStore.getByPlayer(username));

const isMe = computed(() => {
  if (!player.value || !meUser.value) return false;
  return player.value.user_id === meUser.value.id;
});

const canViewStats = computed(() => {
  if (!player.value) return false;
  return (
    player.value.privacy === PrivacySetting.PUBLIC ||
    isMe.value ||
    friends.getFriendStatus(player.value.user_id) === FriendStatus.FRIENDS
  );
});

const allRoleStatCards = computed(() => {
  if (!player.value) return [];
  return player.value.role_stat_cards ?? [];
});

const favoriteCards = computed(() => {
  return allRoleStatCards.value.filter((card) => !card.storyteller_only);
});

const favoriteCardByKey = computed(() => {
  const map = new Map<string, (typeof favoriteCards.value)[number]>();
  for (const card of favoriteCards.value) {
    map.set(getCardKey(card.metric_key, card.role_id, card.source), card);
  }
  return map;
});

const pickerRoles = computed(() => {
  return roles
    .getAllRoles()
    .filter((role) => getRoleCardDefinitions(role.id).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
});

const rolePreviewCards = computed(() => {
  if (games.value.status !== Status.SUCCESS) return [];

  return pickerRoles.value
    .flatMap((role) =>
      getRoleCardDefinitions(role.id).map((definition) =>
        buildRoleStatCardPreview(
          definition.id,
          games.value.data,
          isMe.value,
          role,
          username
        )
      )
    )
    .filter((card): card is NonNullable<typeof card> => !!card);
});

const ROLE_TYPE_ORDER: RoleType[] = [
  RoleType.TOWNSFOLK,
  RoleType.OUTSIDER,
  RoleType.MINION,
  RoleType.DEMON,
  RoleType.TRAVELER,
  RoleType.FABLED,
  RoleType.LORIC,
];

const SCRIPT_ORDER = ["tb", "snv", "bmr", "experimental", "npc", "unknown"] as const;

function roleTypeOrderValue(type: string | null | undefined) {
  const index = ROLE_TYPE_ORDER.indexOf(type as RoleType);
  return index === -1 ? ROLE_TYPE_ORDER.length : index;
}

function normalizeScript(script: string | null | undefined) {
  if (!script) return "unknown";

  const normalized = script.trim().toLowerCase();
  if (["tb", "trouble brewing"].includes(normalized)) return "tb";
  if (["snv", "sects & violets", "sects and violets"].includes(normalized)) return "snv";
  if (["bmr", "bad moon rising"].includes(normalized)) return "bmr";
  if (normalized === "npc") return "npc";
  if (["experimental", "exp"].includes(normalized)) return "experimental";

  return normalized;
}

function scriptOrderValue(script: string | null | undefined) {
  const normalized = normalizeScript(script);
  const index = SCRIPT_ORDER.indexOf(
    normalized as (typeof SCRIPT_ORDER)[number]
  );
  return index === -1 ? SCRIPT_ORDER.length : index;
}

function scriptLabel(script: string) {
  if (script === "tb") return "Trouble Brewing";
  if (script === "snv") return "Sects & Violets";
  if (script === "bmr") return "Bad Moon Rising";
  if (script === "experimental") return "Experimental";
  if (script === "npc") return "Fabled & Loric";
  if (script === "unknown") return "Unsorted";
  return script;
}

function scriptImage(script: string) {
  if (script === "tb") return "/img/trouble-brewing.webp";
  if (script === "snv") return "/img/sects-and-violets.webp";
  if (script === "bmr") return "/img/bad-moon-rising.webp";
  if (script === "npc") return "/img/fabled-loric.webp";
  return "/img/carousel.webp";
}

function getRoleTypeFromCard(card: (typeof rolePreviewCards.value)[number]) {
  const roleFromStore = card.role_id ? roles.getRole(card.role_id) : undefined;
  return roleFromStore?.type ?? card.role?.type;
}

function getRoleNameFromCard(card: (typeof rolePreviewCards.value)[number]) {
  const roleFromStore = card.role_id ? roles.getRole(card.role_id) : undefined;
  return roleFromStore?.name ?? card.role?.name ?? "";
}

function getScriptFromCard(card: (typeof rolePreviewCards.value)[number]) {
  const definition = getRoleStatCardDefinition(card.metric_key);
  return normalizeScript(definition?.script);
}

function getSaoFromCard(card: (typeof rolePreviewCards.value)[number]) {
  const definition = getRoleStatCardDefinition(card.metric_key);
  return definition?.sao ?? Number.MAX_SAFE_INTEGER;
}

const definitionOrderById = new Map(
  ROLE_STAT_CARD_DEFINITIONS.map((definition, index) => [definition.id, index])
);

function definitionOrderValue(card: (typeof rolePreviewCards.value)[number]) {
  return definitionOrderById.get(card.metric_key) ?? Number.MAX_SAFE_INTEGER;
}

function isHiddenLockedCard(card: (typeof rolePreviewCards.value)[number]) {
  return !!card.preview?.isHiddenLocked;
}

const rolePreviewCardGroups = computed(() => {
  const sorted = rolePreviewCards.value
    .slice()
    .sort((a, b) => {
    const scriptCompare =
      scriptOrderValue(getScriptFromCard(a)) - scriptOrderValue(getScriptFromCard(b));
    if (scriptCompare !== 0) return scriptCompare;

    const hiddenCompare =
      Number(isHiddenLockedCard(a)) - Number(isHiddenLockedCard(b));
    if (hiddenCompare !== 0) return hiddenCompare;

    const typeCompare =
      roleTypeOrderValue(getRoleTypeFromCard(a)) - roleTypeOrderValue(getRoleTypeFromCard(b));
    if (typeCompare !== 0) return typeCompare;

    const saoCompare = getSaoFromCard(a) - getSaoFromCard(b);
    if (saoCompare !== 0) return saoCompare;

    const roleNameA = getRoleNameFromCard(a);
    const roleNameB = getRoleNameFromCard(b);
    if (roleNameA !== roleNameB) return roleNameA.localeCompare(roleNameB);

    return definitionOrderValue(a) - definitionOrderValue(b);
    });

  const scriptGroups = new Map<string, typeof sorted>();

  for (const card of sorted) {
    const type = getRoleTypeFromCard(card);
    if (!type || !ROLE_TYPE_ORDER.includes(type)) continue;
    const script = getScriptFromCard(card);

    if (!scriptGroups.has(script)) {
      scriptGroups.set(script, []);
    }
    scriptGroups.get(script)!.push(card);
  }

  return Array.from(scriptGroups.entries())
    .sort(([scriptA], [scriptB]) => scriptOrderValue(scriptA) - scriptOrderValue(scriptB))
    .map(([script, cards]) => {
      const achievedCount = cards.filter((card) => card.preview.count > 0).length;
      const totalCount = cards.length;

      return {
        script,
        title: scriptLabel(script),
        image: scriptImage(script),
        achievedCount,
        totalCount,
        cards,
      };
    })
    .filter((group) => group.cards.length > 0);
});

const generalPreviewCards = computed(() => {
  if (games.value.status !== Status.SUCCESS) return [];

  return getGeneralCardDefinitions()
    .map((definition) =>
      buildRoleStatCardPreview(
        definition.id,
        games.value.data,
        isMe.value,
        null,
        username
      )
    )
    .filter((card): card is NonNullable<typeof card> => !!card);
});

const previewCards = computed(() => {
  return tab.value === "role" ? rolePreviewCards.value : generalPreviewCards.value;
});

function cardForDisplay<T extends {
  role_id: string | null;
  role?: { id: string } | null;
  preview?: { isHiddenLocked?: boolean };
}>(card: T): T {
  if (!card.preview?.isHiddenLocked) return card;
  return {
    ...card,
    role_id: null,
    role: null,
  };
}

function getCardKey(metricKey: string, roleId: string | null, source: string) {
  return `${source}::${metricKey}::${roleId ?? "general"}`;
}

function isFavoriteCard(
  card: {
    metric_key: string;
    role_id: string | null;
    source: string;
  }
) {
  return favoriteCardByKey.value.has(
    getCardKey(card.metric_key, card.role_id, card.source)
  );
}

async function toggleFavoriteCard(
  card: {
    metric_key: string;
    role_id: string | null;
    source: string;
  }
) {
  if (!isMe.value) return;

  const existing = favoriteCardByKey.value.get(
    getCardKey(card.metric_key, card.role_id, card.source)
  );

  if (existing) {
    await $fetch(`/api/role_stat_cards/${existing.id}`, {
      method: "DELETE",
    });
  } else {
    await $fetch("/api/role_stat_cards", {
      method: "POST",
      body: JSON.stringify({
        role_id: card.role_id,
        source: card.source,
        metric_key: card.metric_key,
        storyteller_only: false,
      }),
    });
  }

  users.fetchUser(username);
}

onMounted(() => {
  users.fetchUser(username);
  gamesStore.fetchPlayerGames(username);
  roles.fetchRoles();
});
</script>
