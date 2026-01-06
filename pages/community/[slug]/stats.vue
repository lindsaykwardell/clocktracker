<template>
  <CommunityTemplate>
    <template #default>
      <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
        <template v-if="pending"> <Loading /> </template>
        <template v-else-if="error">
          Error loading stats.
        </template>
        <template v-else-if="stats?.players.length === 0">
          No stats available.
        </template>
        <template v-else>
          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
              More stats
            </h2>
            <div class="w-full xl:w-3/4 xl:mx-auto grid gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 xl:gap-y-16 community-grid-8">
              <StatsCommunityTopPlayers
                :players="stats.players"
                mode="players"
                title="Most Frequent Players"
                class="col-span-3"
              />
              <StatsCommunityTopPlayers
                :players="stats.players"
                mode="storytellers"
                title="Most Frequent Storytellers"
                class="col-span-3"
              />
              <StatsCommunityTopLocations
                :games="communityGames.data"
                :is-member="isMember"
                class="col-span-2"
              />
            </div>
          </section>

          <section>
            <StatsCommunityHighlights 
              :players="stats.players"
              :games="communityGames.status === Status.SUCCESS ? communityGames.data : []"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>
          
          <section>
            <StatsCommunityOutsiderHighlights 
              :players="stats.players"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <StatsCommunityAlignment
              :games="communityGames"
              :players="stats.players"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <StatsCommunityGamesOverTime 
              :games="communityGames.data" 
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <div class="w-full xl:w-3/4 xl:mx-auto grid grid-cols-4 lg:grid-cols-5 gap-x-2 md:gap-x-4 gap-y-8 md:gap-y-12 xl:gap-y-16">
              <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
                <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-2">
                  Game Size
                </h2>
                
                <div class="col-span-4 lg:col-span-2 grid grid-cols-subgrid">
                  <StatsCommunityPlayercount 
                    :games="communityGames.data"
                    class="col-span-2 lg:col-span-1"
                  />
                  <StatsCommunityMinioncount 
                    :games="communityGames.data"
                    class="col-span-2 lg:col-span-1"
                  />
                </div>
                
              </div>
              
              <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
                <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-4 lg:col-span-3">
                  Scripts played
                </h2>

                <div class="col-span-4 lg:col-span-3 grid grid-cols-subgrid">
                  <StatsCommunityScriptTypes
                    :games="communityGames.data"
                    class="col-span-2 lg:col-span-1"
                  />

                  <StatsCommunityTopScripts 
                    :games="communityGames.data" 
                    class="col-span-2"
                  />
                </div>
              </div>
            </div>
          </section>

          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <StatsCommunityMembers
              :players="stats.players"
              :member-ids="communityMembers"
              class="w-full xl:w-3/4 xl:mx-auto"
            />
          </section>

          <section v-if="communityGames.status === Status.SUCCESS && communityGames.data.length">
            <StatsCommunityRoles :games="communityGames" :players="stats.players" />
          </section>

        </template>

        <div v-if="stats && stats.players.length" class="mt-2 text-sm">
          <p class="text-stone-500">
            Totals: {{ stats.totals.games }} games • {{ stats.totals.players }} players seen in grimoire tokens
          </p>
        </div>
      </div>
    </template>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { defineComponent, h, resolveComponent } from "vue";
import { Status } from "~/composables/useFetchStatus";
type PlayerSummary = {
  user_id: string | null;
  username: string;
  avatar: string | null;
  priority?: number;
  plays: number;
  wins: number;
  losses: number;
  good_plays: number;
  evil_plays: number;
  traveler_plays: number;
  storyteller_plays: number;
  drunk_plays: number;
  lunatic_plays: number;
  mutant_plays: number;
  damsel_plays: number;
  role_details: Record<
    string,
    { token_url: string | null; type: string | null; initial_alignment: string | null }
  >;
  role_tokens: Record<string, string | null>;
  role_games: Record<string, string[]>;
  roles: Record<string, number>;
};

type CommunityStats = {
  totals: { games: number; players: number };
  players: PlayerSummary[];
};

const route = useRoute();
const slug = route.params.slug as string;
const gamesStore = useGames();
const communities = useCommunities();
const user = useSupabaseUser();

const { data: stats, pending, error } = useFetch<CommunityStats>(
  () => `/api/community/${slug}/stats`
);

const communityGames = computed(() => gamesStore.getByCommunity(slug));
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const communityMembers = computed(() => {
  const community = communities.getCommunity(slug);
  if (community.status !== Status.SUCCESS) return [];
  return community.data.members.map((m) => m.user_id);
});

const mostEvil = computed(() => pickTop("evil_plays"));
const mostWins = computed(() => pickTop("wins"));

function pickTop(key: keyof PlayerSummary) {
  if (!stats.value) return null;
  const players = stats.value.players
    .filter((p) => (p[key] as number) > 0)
    .sort((a, b) => (b[key] as number) - (a[key] as number));

  return players[0] || null;
}

function playerLink(player: PlayerSummary | null) {
  if (!player || !player.user_id) return null;
  return `/@${player.username}`;
}

const NuxtLink = resolveComponent("nuxt-link");

const DebugLinks = defineComponent({
  name: "DebugLinks",
  props: {
    games: { type: Array as () => string[], default: () => [] },
  },
  setup(props) {
    return () =>
      props.games.length
        ? h(
            "div",
            {
              class:
                "text-xs text-stone-500 flex flex-wrap gap-2 justify-center mt-1",
            },
            props.games.map((gameId) =>
              h(
                NuxtLink,
                {
                  to: `/game/${gameId}`,
                  class: "underline text-primary",
                },
                { default: () => `Game ${gameId}` }
              )
            )
          )
        : null;
  },
});

onMounted(() => {
  gamesStore.fetchCommunityGames(slug);
});
</script>

<style scoped>
  .community-grid-8 {
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }
</style>
