<template>
  <CommunityTemplate>
    <template #header="{ community }">
      <div class="flex flex-wrap w-11/12 m-auto pb-2">
        <nuxt-link
          v-for="member in community.data.members"
          :to="`/@${member.username}`"
        >
          <Avatar
            :value="member.avatar"
            :size="community.data.members.length > 50 ? 'xs' : 'sm'"
            class="border-stone-800"
          />
        </nuxt-link>
      </div>
    </template>
    <template #default="{ community, isMember, isModerator }">
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
      <div v-if="community.data.events.length > 0" class="flex justify-center">
        <nuxt-link
          :to="`/event/${community.data.events[0].id}`"
          class="w-full md:w-[600px]"
        >
          <EventCard
            :event="community.data.events[0]"
            class="mt-6 m-auto"
            :canModifyEvent="isModerator"
            @deleted="reloadCommunity"
          >
            <template #footer="{ event }">
              <div class="flex flex-wrap w-11/12 m-auto pb-2">
                <template v-for="player in allEventAttendees(event)">
                  <nuxt-link
                    v-if="player.user"
                    :to="`/@${player.user.username}`"
                  >
                    <Avatar
                      :value="player.user.avatar"
                      size="xs"
                      class="border-stone-800"
                    />
                  </nuxt-link>
                  <template v-else-if="player.discord_user_id">
                    <Avatar
                      value="/img/discord.png"
                      size="xs"
                      class="border-stone-800"
                    />
                  </template>
                  <template v-else>
                    <Avatar
                      value="/img/default.png"
                      size="xs"
                      class="border-stone-800"
                    />
                  </template>
                </template>
              </div>
            </template>
          </EventCard>
        </nuxt-link>
      </div>
      <div
        class="w-full md:w-11/12 lg:max-w-[800px] m-auto flex flex-col gap-3 mt-8"
      >
        <div v-if="isMember" class="bg-stone-200 dark:bg-stone-900 p-4">
          <label>
            Add to the conversation
            <form @submit.prevent="submitPost">
              <ExpandingTextarea v-model="message" />
              <Button
                type="submit"
                class="px-4 py-2 mt-2"
                primary
                font-size="md"
              >
                Send
              </Button>
            </form>
          </label>
        </div>
        <CommunityPost
          v-for="post in community.data.posts"
          :post="post"
          :community="community.data"
          :isMember="isMember"
          :isModerator="isModerator"
        />
      </div>
    </template>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
import type { Event } from "~/composables/useCommunities";
import { Status } from "~/composables/useFetchStatus";

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const games = useGames();

const metadata = await $fetch(`/api/community/${slug}/minimal`);

const message = ref("");

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
