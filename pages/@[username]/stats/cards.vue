<template>
  <StandardTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="playerFetchStatus === Status.LOADING || games.status === Status.LOADING">
        <Loading />
      </template>

      <template v-else-if="playerFetchStatus === Status.ERROR || games.status === Status.ERROR">
        <p class="text-center text-xl font-sorts my-8">
          Unable to load stat cards.
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
                Statistic Cards
              </h2>

              <div
                v-if="previewCards.length === 0"
                class="text-sm text-center text-stone-500 dark:text-stone-400 py-8"
              >
                No matching cards available.
              </div>

              <div
                v-else
                class="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              >
                <RoleStatCard
                  v-for="previewCard in previewCards"
                  :key="`${tab}-${previewCard.metric_key}-${previewCard.role_id ?? 'general'}`"
                  :card="previewCard"
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
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import {
  buildRoleStatCardPreview,
  getGeneralCardDefinitions,
  getRoleCardDefinitions,
} from "~/composables/useRoleStatCards";

const username = useRoute().params.username as string;
const users = useUsers();
const gamesStore = useGames();
const roles = useRoles();
const friends = useFriends();
const meUser = useSupabaseUser();

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
