<template>
  <CommunityTemplate v-slot="{ community, isMember, isModerator }">
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
      <Loading />
    </template>
    <div
      class="w-full md:w-11/12 lg:max-w-[800px] m-auto flex flex-col gap-3 mt-8"
    >
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
      <CommunityPost
        v-for="post in community.data.posts"
        :post="post"
        :isMember="isMember"
        :isModerator="isModerator"
        @delete="deletePost"
        @reply="submitReply"
      />
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";

const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const games = useGames();

const message = ref("");

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

  message.value = "";
}

async function submitReply(content: { content: string; parent_id: string }) {
  await communities.submitReply(slug, content.parent_id, content.content);
}

async function deletePost(postId: string) {
  await communities.deletePost(slug, postId);
}

onMounted(() => {
  communities.fetchCommunity(slug);
  games.fetchCommunityGames(slug);
});
</script>
