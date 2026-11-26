<template>
  <StandardTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="playerFetchStatus === Status.ERROR || games.status === Status.ERROR">
        <p class="text-center text-xl font-sorts my-8">
          Unable to load achievements.
        </p>
      </template>

      <template v-else-if="player && !canViewStats">
        <p class="text-center text-xl font-sorts my-8">
          This account is private
        </p>
      </template>

      <!-- While loading: the real toolbar and intro, with placeholders for the header and the cards. -->
      <template v-else>
        <ProfileHeaderSkeleton v-if="!player" />
        <UserHeader v-else :player="player">
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
              aria-current="true"
            >
              Stats
            </nuxt-link>
          </div>
        </UserHeader>

        <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
          <div
            class="flex flex-col gap-3 px-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <!-- Tools on the left, the view toggle on the right, like the stats and games tabs. -->
              <div class="flex flex-wrap items-center gap-3">
                <Button
                  component="nuxt-link"
                  :to="`/@${username}?view=stats`"
                  color="neutral"
                  variant="soft"
                  icon="arrow-left-short"
                >
                  Back to Stats
                </Button>
                <div class="w-full sm:w-64">
                  <Input
                    v-model="search"
                    type="search"
                    color="light"
                    :placeholder="tab === 'role' ? 'Search characters or cards' : 'Search cards'"
                    :aria-label="tab === 'role' ? 'Search characters or cards' : 'Search cards'"
                  />
                </div>
                <label class="inline-flex items-center gap-2 text-sm">
                  <input v-model="hideEmpty" type="checkbox" />
                  Hide empty cards
                </label>
                <!-- Same toggle as the stats tab; the choice is shared between them. -->
                <Button
                  v-if="statsDebug.canDebug.value"
                  @click="statsDebug.enabled.value = !statsDebug.enabled.value"
                  :active="statsDebug.enabled.value"
                  :aria-pressed="statsDebug.enabled.value"
                  color="positive"
                  variant="soft"
                  icon="bug"
                  title="Show which games feed each card"
                >
                  Debug
                </Button>
              </div>

              <SegmentedControl
                v-model="view"
                :options="viewOptions"
                label="Show cards"
              />
            </div>
          </div>

          <section>
            <div class="w-full px-4">
              <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
                Statistic Cards
              </h2>

              <div class="text-center max-w-[80ch] mx-auto mb-16 space-y-4">
                <!-- A div, not a p: the hint's tooltip wrapper is a div. -->
                <div>
                  Statistic cards are ClockTracker's take on achievements for Blood on the Clocktower.<br>
                  They highlight moments that should happen naturally during play, not goals to chase during each game.
                  <!-- The exception to "not goals to chase": fine print in a hint to keep the intro short. -->
                  <InfoHint label="About secret cards">
                    <p>
                      A few edge-case cards are included because they are interesting or funny,
                      even though they might encourage suboptimal play.
                    </p>
                    <p>
                      Those cards are hidden by default: other players cannot see them, you only
                      see them once they are unlocked, and they cannot be favorited.
                    </p>
                  </InfoHint>
                </div>
                <p class="text-sm">
                  Counts are attributed to each character's ability based on recorded game data.<br>
                  Older games and partially tracked games may be missing events, so treat every count as "at least".
                </p>
              </div>

              <!-- Empty or no results, for both card sets; a search gets a way back. -->
              <StatCardsSkeleton v-if="cardsLoading" />
              <div
                v-else-if="noCardsToShow"
                class="flex flex-col items-center gap-3 py-8 text-center"
              >
                <template v-if="searchTerm">
                  <p class="text-xl font-sorts">No cards match "{{ search.trim() }}"</p>
                  <p class="text-stone-600 dark:text-stone-400">
                    Try a character name or a card title.
                  </p>
                  <Button color="neutral" variant="soft" @click="search = ''">
                    Clear search
                  </Button>
                </template>
                <template v-else-if="hideEmpty">
                  <p class="text-xl font-sorts">No cards unlocked yet</p>
                  <Button color="neutral" variant="soft" @click="hideEmpty = false">
                    Show empty cards
                  </Button>
                </template>
                <p v-else class="text-xl font-sorts">No cards available</p>
              </div>
              <!-- While searching: one flat list, without the edition or type headers. -->
              <template v-else-if="tab === 'role' && searchTerm">
                <p class="text-center text-stone-600 dark:text-stone-400 mb-4">
                  {{ searchResults.length }} matching {{ searchResults.length === 1 ? "card" : "cards" }}
                </p>
                <ul class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  <RoleStatCard
                    v-for="previewCard in searchResults"
                    :key="`${tab}-${previewCard.metric_key}-${previewCard.role_id ?? 'general'}`"
                    :card="cardForDisplay(previewCard)"
                    :games="games.status === Status.SUCCESS ? games.data : []"
                    :is-me="isMe"
                    :username="username"
                    :show-favorite-control="shouldShowFavoriteControl(previewCard)"
                    :is-favorite="isFavoriteCard(previewCard)"
                    show-zero-overlay
                    variant="horizontal"
                    @toggleFavorite="toggleFavoriteCard(previewCard)"
                  />
                </ul>
              </template>
              <template v-else-if="tab === 'role'">
                <div class="space-y-12">
                  <section
                    v-for="scriptGroup in rolePreviewCardGroups"
                    :key="`${groupBy}-${scriptGroup.key}`"
                    class="space-y-4"
                  >
                    <div class="flex flex-col items-center gap-4">
                      <img
                        :src="scriptGroup.image"
                        :alt="scriptGroup.title"
                        :class="groupBy === 'type' ? 'w-40 h-40' : 'w-64 h-auto max-w-full'"
                      >
                      <h3 class="sr-only">
                        {{ scriptGroup.title }}
                      </h3>

                      <p class="font-sorts text-2xl">
                        <span class="sr-only">Completion: </span>
                        {{ scriptGroup.achievedCount }}/{{ scriptGroup.totalCount }}
                        <span
                          v-if="scriptGroup.hiddenUnlockedCount"
                          class="text-stone-500 dark:text-stone-400 text-lg"
                        >
                          +{{ scriptGroup.hiddenUnlockedCount }}
                        </span>
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
                        :show-favorite-control="shouldShowFavoriteControl(previewCard)"
                        :is-favorite="isFavoriteCard(previewCard)"
                        show-zero-overlay
                        variant="horizontal"
                        @toggleFavorite="toggleFavoriteCard(previewCard)"
                      />
                    </ul>
                  </section>
                </div>
              </template>

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
                  :show-favorite-control="shouldShowFavoriteControl(previewCard)"
                  :is-favorite="isFavoriteCard(previewCard)"
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

useHead({ title: `Statistic Cards · ${username}` });
const users = useUsers();
const gamesStore = useGames();
const roles = useRoles();
const friends = useFriends();
const meUser = useUser();
const featureFlags = useFeatureFlags();
const statsDebug = useStatsDebug();

const canSeeGeneralCards = computed(() => featureFlags.isEnabled("general-stat-cards"));

const tab = ref<"role" | "general">("role");
const groupBy = ref<"script" | "type">("script");
// One toggle for both: the character cards by edition or by type, or the general cards.
type CardsView = "script" | "type" | "general";
const view = computed<CardsView>({
  get: () => (tab.value === "general" ? "general" : groupBy.value),
  set: (value) => {
    if (value === "general") {
      tab.value = "general";
    } else {
      tab.value = "role";
      groupBy.value = value;
    }
  },
});
// General cards are still a work in progress: behind the "general-stat-cards" flag.
const viewOptions = computed(() => [
  { value: "script" as const, label: "By edition" },
  { value: "type" as const, label: "By character type" },
  {
    value: "general" as const,
    label: "General",
    disabled: !canSeeGeneralCards.value,
    title: canSeeGeneralCards.value ? undefined : "Coming soon",
  },
]);
const search = ref("");
// Empty cards (a count of 0, including locked secret cards) are shown unless
// hidden; the completion counts still include them.
const hideEmpty = ref(false);

function isShownCard(card: { preview: { count: number } }) {
  return !hideEmpty.value || card.preview.count > 0;
}

function normalizeSearchText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const searchTerm = computed(() => normalizeSearchText(search.value));

// Matches only what the card shows: a secret card that isn't unlocked yet
// shows neither its character nor its title, so it never matches a search.
function matchesSearch(card: {
  role_id: string | null;
  role?: { name?: string } | null;
  preview: { metricLabel: string; isHiddenLocked?: boolean };
}) {
  const term = searchTerm.value;
  if (!term) return true;
  if (card.preview.isHiddenLocked) return false;
  const roleName = card.role_id ? roles.getRole(card.role_id)?.name ?? card.role?.name : null;
  return [roleName, card.preview.metricLabel].some(
    (text) => !!text && normalizeSearchText(text).includes(term)
  );
}

const playerStatus = computed(() => users.getUser(username));
const playerFetchStatus = computed(() => playerStatus.value.status);
const player = computed(() => {
  return playerStatus.value.status === Status.SUCCESS ? playerStatus.value.data : null;
});

const games = computed(() => gamesStore.getByPlayer(username));
// The cards need the player (their settings), the games and every character.
const cardsLoading = computed(
  () => !player.value || games.value.status !== Status.SUCCESS || roles.roles.size === 0
);

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
  // Read once: the callbacks below can't see that games.value is narrowed.
  const gameData = games.value.data;

  return pickerRoles.value
    .flatMap((role) =>
      getRoleCardDefinitions(role.id).map((definition) =>
        buildRoleStatCardPreview(
          definition.id,
          gameData,
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

function roleTypeLabel(type: string) {
  if (type === RoleType.TOWNSFOLK) return "Townsfolk";
  if (type === RoleType.OUTSIDER) return "Outsiders";
  if (type === RoleType.MINION) return "Minions";
  if (type === RoleType.DEMON) return "Demons";
  if (type === RoleType.TRAVELER) return "Travellers";
  if (type === RoleType.FABLED) return "Fabled";
  if (type === RoleType.LORIC) return "Loric";
  return type;
}

function roleTypeImage(type: string) {
  const file = type === RoleType.TRAVELER ? "traveller" : type.toLowerCase();
  return `/img/role/160x160/${file}.webp`;
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

function isHiddenConfiguredCard(card: { metric_key: string }) {
  return !!getRoleStatCardDefinition(card.metric_key)?.hidden;
}

const rolePreviewCardGroups = computed(() => {
  const sorted = rolePreviewCards.value
    .slice()
    .sort((a, b) => {
    const scriptCompare =
      scriptOrderValue(getScriptFromCard(a)) - scriptOrderValue(getScriptFromCard(b));
    const typeCompare =
      roleTypeOrderValue(getRoleTypeFromCard(a)) - roleTypeOrderValue(getRoleTypeFromCard(b));

    // The section's own key first, then locked secret cards last within it.
    const groupCompare = groupBy.value === "type" ? typeCompare : scriptCompare;
    if (groupCompare !== 0) return groupCompare;

    const hiddenCompare =
      Number(isHiddenLockedCard(a)) - Number(isHiddenLockedCard(b));
    if (hiddenCompare !== 0) return hiddenCompare;

    if (scriptCompare !== 0) return scriptCompare;
    if (typeCompare !== 0) return typeCompare;

    const saoCompare = getSaoFromCard(a) - getSaoFromCard(b);
    if (saoCompare !== 0) return saoCompare;

    const roleNameA = getRoleNameFromCard(a);
    const roleNameB = getRoleNameFromCard(b);
    if (roleNameA !== roleNameB) return roleNameA.localeCompare(roleNameB);

    return definitionOrderValue(a) - definitionOrderValue(b);
    });

  const groups = new Map<string, typeof sorted>();

  for (const card of sorted) {
    const type = getRoleTypeFromCard(card);
    if (!type || !ROLE_TYPE_ORDER.includes(type as RoleType)) continue;
    if (!matchesSearch(card)) continue;
    const key = groupBy.value === "type" ? type : getScriptFromCard(card);

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(card);
  }

  const groupOrderValue = (key: string) =>
    groupBy.value === "type" ? roleTypeOrderValue(key) : scriptOrderValue(key);

  return Array.from(groups.entries())
    .sort(([keyA], [keyB]) => groupOrderValue(keyA) - groupOrderValue(keyB))
    .map(([key, cards]) => {
      const hiddenUnlockedCount = isMe.value
        ? cards.filter(
          (card) =>
            isHiddenConfiguredCard(card) &&
            !isHiddenLockedCard(card) &&
            card.preview.count > 0
        ).length
        : 0;
      const visibleCards = (
        isMe.value ? cards : cards.filter((card) => !isHiddenConfiguredCard(card))
      ).filter(isShownCard);
      const countableCards = cards.filter((card) => !isHiddenConfiguredCard(card));
      const achievedCount = countableCards.filter((card) => card.preview.count > 0).length;
      const totalCount = countableCards.length;

      return {
        key,
        title: groupBy.value === "type" ? roleTypeLabel(key) : scriptLabel(key),
        image: groupBy.value === "type" ? roleTypeImage(key) : scriptImage(key),
        achievedCount,
        totalCount,
        hiddenUnlockedCount,
        cards: visibleCards,
      };
    })
    .filter((group) => group.cards.length > 0 || group.hiddenUnlockedCount > 0);
});

// The matching cards in their usual order (edition or type, then character),
// without the group headers.
const searchResults = computed(() =>
  rolePreviewCardGroups.value.flatMap((group) => group.cards)
);

const generalPreviewCards = computed(() => {
  if (games.value.status !== Status.SUCCESS) return [];
  const gameData = games.value.data;

  return getGeneralCardDefinitions()
    .map((definition) =>
      buildRoleStatCardPreview(
        definition.id,
        gameData,
        isMe.value,
        null,
        username
      )
    )
    .filter((card): card is NonNullable<typeof card> => {
      if (!card) return false;
      return isMe.value || !isHiddenConfiguredCard(card);
    });
});

const noCardsToShow = computed(() =>
  tab.value === "role"
    ? rolePreviewCardGroups.value.length === 0
    : previewCards.value.length === 0
);

const previewCards = computed(() => {
  const cards = tab.value === "role" ? rolePreviewCards.value : generalPreviewCards.value;
  return cards.filter((card) => matchesSearch(card) && isShownCard(card));
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

function shouldShowFavoriteControl(card: {
  metric_key: string;
  role_id: string | null;
  source: string;
  preview?: { count: number };
}) {
  if (!isMe.value) return false;
  // A card already favorited keeps its button, so it can be removed again.
  if (isFavoriteCard(card)) return true;
  // Nothing to show off yet on a card the player hasn't reached.
  if (card.preview && card.preview.count === 0) return false;
  return !isHiddenConfiguredCard(card);
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
    if (isHiddenConfiguredCard(card)) return;

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
