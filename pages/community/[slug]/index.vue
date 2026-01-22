<template>
  <CommunityTemplate>
    <template #header="{ community }">
    </template>
    <template #default="{ community, isMember, isModerator }">
      <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
        <section class="w-full xl:w-3/4 xl:mx-auto">
          <CommunityStatsSummary
            v-if="statsGames.length"
            :games="statsGames"
            :member-count="community.data.members.length"
            :active-players-count="activePlayersCount"
          />
        </section>
        
        <template v-if="recentGames.status === Status.SUCCESS">
          <GameOverviewGrid
            v-if="recentGames.data.length > 0"
            :games="recentGames.data"
            showCommunityCard
          />
          <template v-else>
            <p class="text-center py-3 text-stone-400">
              No games have been played yet.
            </p>
          </template>
        </template>
        <template v-else>
          <Loading />
        </template>

        <section class="w-full xl:w-3/4 xl:mx-auto">
          <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Members
          </h2>
          <div class="flex flex-wrap justify-center gap-1">
            <nuxt-link
              v-for="member in community.data.members"
              :to="`/@${member.username}`"
            >
              <Avatar
                :value="member.avatar"
                :size="community.data.members.length > 50 ? 'xs' : 'sm'"
                class="border-stone-800"
                background
              />
            </nuxt-link>
          </div>
        </section>
        

        <section v-if="community.data.events.length > 0" class="w-full md:w-11/12 lg:max-w-[800px] m-auto">
          <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Next Event
          </h2>
          <div class="flex justify-center">
            <EventCard
              :event="community.data.events[0]"
              class="m-auto"
              :canModifyEvent="isModerator"
              @deleted="reloadCommunity"
            >
              <template #footer="{ event }">
                <div class="text-xs text-stone-500 dark:text-stone-400 uppercase">
                  Players
                </div>
                <div class="flex flex-wrap gap-[0.125rem]">
                  <template v-for="player in allEventAttendees(event)">
                    <nuxt-link
                      v-if="player.user"
                      :to="`/@${player.user.username}`"
                    >
                      <Avatar
                        :value="player.user.avatar"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </nuxt-link>
                    <template v-else-if="player.discord_user_id">
                      <Avatar
                        value="/img/discord.png"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </template>
                    <template v-else>
                      <Avatar
                        value="/img/default.png"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </template>
                  </template>
                </div>
              </template>
            </EventCard>
          </div>
        </section>

        <section class="w-full md:w-11/12 lg:max-w-[800px] m-auto">
          <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Message Board
          </h2>
          <div v-if="isMember" class="p-4 mb-8 flex flex-col gap-8 rounded border dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50">
            <form @submit.prevent="submitPost" class="flex flex-col gap-2">
              <div class="flex flex-col gap-1">
                <label>Add to the conversation</label>
                <ExpandingTextarea v-model="message" />
              </div>
              <div>
                <Button
                  type="submit"
                  color="primary"
                >
                  Post message
                </Button>
              </div>
            </form>
          </div>
          <div class="flex flex-col gap-4">
            <CommunityPost
              v-for="post in community.data.posts"
              :post="post"
              :community="community.data"
              :isMember="isMember"
              :isModerator="isModerator"
            />
          </div>
        </section>
      </div>
    </template>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import type { Event } from "~/composables/useCommunities";
import { Status } from "~/composables/useFetchStatus";
import type { GameRecord } from "~/composables/useGames";

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const games = useGames();

const metadata = await $fetch(`/api/community/${slug}/minimal`);
const { data: stats } = await useFetch<{
  totals: { games: number; players: number };
  games: GameRecord[];
}>(() => `/api/community/${slug}/stats`);

const message = ref("");
const statsGames = computed(() => stats.value?.games ?? []);
const activePlayersCount = computed(() => stats.value?.totals?.players ?? 0);

const recentGames = computed(() => {
  const communityGames = games.getByCommunity(slug);
  if (communityGames.status !== Status.SUCCESS) return communityGames;
  return {
    ...communityGames,
    data: naturalOrder(communityGames.data)
      .orderBy("desc")
      .sort(["date"])
      .slice(0, 4),
  };
});

async function submitPost() {
  await communities.submitPost(slug, message.value);

  message.value = "";
}

function allEventAttendees(event: Event) {
  return [
    ...event.registered_players,
    ...(event.waitlists?.flatMap((w) => w.users) ?? []),
  ];
}

function reloadCommunity() {
  location.reload();
}

onMounted(() => {
  games.fetchCommunityGames(slug);
});

useHead({
  title: metadata.name,
  meta: [
    {
      hid: "description",
      name: "description",
      content: metadata.description,
    },
    {
      property: "og:title",
      content: metadata.name,
    },
    {
      property: "og:description",
      content: metadata.description,
    },
    {
      property: "og:image",
      content: metadata.icon,
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: metadata.name,
    },
    {
      property: "twitter:description",
      content: metadata.description,
    },
    {
      property: "twitter:image",
      content: metadata.icon,
    },
  ],
});
</script>
