<template>
  <AuthenticatedTemplate>
    <template v-if="community.status === Status.SUCCESS">
      <div class="bg-stone-950 shadow-lg">
        <div
          class="flex flex-col items-center p-2 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto"
        >
          <div class="flex flex-col items-center gap-3 w-full">
            <div class="flex-grow flex flex-col items-center md:items-start">
              <h3 class="font-dumbledor text-2xl lg:text-3xl">
                {{ community.data.name }}
              </h3>
            </div>
            <button
              class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 hover:bg-blue-900"
              :class="{
                'bg-blue-950': !isMember,
                'border border-blue-950 text-blue-700 hover:text-white':
                  isMember,
              }"
            >
              <template v-if="isMember"> Leave Community </template>
              <template v-else> Join Community </template>
            </button>
          </div>
          <hr class="border-stone-100 w-full my-4" />
          <p class="whitespace-pre-wrap text-left w-full py-4">
            {{ community.data.description }}
          </p>
        </div>
      </div>
      <template v-if="recentGames.status === Status.SUCCESS">
        <GameOverviewGrid
          v-if="recentGames.data.length > 0"
          :games="recentGames.data"
          cardWidth="w-1/2 lg:w-1/4"
          readonly
        />
        <template v-else>
          <p class="text-center">No games have been played yet.</p>
        </template>
      </template>
      <template v-else>
        <LoadingSpinner />
      </template>
      <div class="max-w-[800px] m-auto flex flex-col gap-3 mt-8">
        <div v-if="isMember" class="bg-stone-900 p-4">
          <label>
            Add to the conversation
            <form @submit.prevent="submitPost">
              <ExpandingTextarea
                class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
                v-model="message"
              />
              <button
                type="submit"
                class="rounded transition duration-150 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 mt-2"
              >
                Send
              </button>
            </form>
          </label>
        </div>
        <div v-for="post in community.data.posts">
          {{ post.content }}
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    </template>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const games = useGames();
const user = useSupabaseUser();

const message = ref("");

const community = computed(() => communities.getCommunity(slug));
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const recentGames = computed(() => {
  const communityGames = games.getByCommunity(slug);
  if (communityGames.status !== Status.SUCCESS) return communityGames;
  return {
    ...communityGames,
    data: naturalOrder(
      communityGames.data.filter((g) => !g.parent_game_id).slice(0, 4)
    )
      .orderBy("desc")
      .sort(["date"]),
  };
});

async function submitPost() {
  await communities.submitPost(slug, message.value);

  console.log("submitted post")

  message.value = "";
}

onMounted(() => {
  communities.fetchCommunity(slug);
  games.fetchCommunityGames(slug);
});
</script>
