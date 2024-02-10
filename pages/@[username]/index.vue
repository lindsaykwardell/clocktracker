<template>
  <StandardTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="playerFetchStatus === Status.SUCCESS && player">
        <UserHeader :player="player">
          <div
            v-if="
              player.privacy === PrivacySetting.PUBLIC ||
              player.user_id === user?.id ||
              friends.getFriendStatus(player.user_id) === FriendStatus.FRIENDS
            "
            class="flex justify-start w-screen md:w-full gap-1 h-12"
          >
            <nuxt-link
              :to="`/@${username}`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('dashboard')"
            >
              Games
            </nuxt-link>
            <nuxt-link
              v-if="
                me?.username === username &&
                pendingGames.status === Status.SUCCESS &&
                pendingGames.data.length
              "
              :to="`/@${username}?view=pending`"
              class="relative font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('pending')"
            >
              <span
                class="text-stone-200 bg-red-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
              >
                {{ pendingGames.data.length }}
              </span>
              <span>Tagged</span>
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=charts`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('charts')"
            >
              Charts
            </nuxt-link>
          </div>
        </UserHeader>
        <template
          v-if="
            player.privacy === PrivacySetting.PUBLIC ||
            player.user_id === user?.id ||
            friends.getFriendStatus(player.user_id) === FriendStatus.FRIENDS
          "
        >
          <UserCharts
            v-if="currentTab === 'charts'"
            :games="games"
            :username="username"
          />
          <Dashboard
            v-if="currentTab === 'dashboard'"
            :player="player"
            :games="games"
          />
          <Dashboard
            v-if="currentTab === 'pending'"
            :player="player"
            :games="pendingGames"
          >
            <button
              type="button"
              class="rounded py-1 justify-center text-lg flex gap-2 bg-green-800 hover:bg-green-900 transition duration-150 px-2"
              @click="addTaggedGamesToProfile"
              :disabled="inFlight"
            >
              <template v-if="inFlight">
                <Spinner class="m-auto" />
              </template>
              <template v-else> Add all games to profile </template>
            </button>
          </Dashboard>
        </template>
        <template v-else>
          <p class="text-center text-2xl my-4 font-dumbledor">
            This account is private
          </p>
        </template>
      </template>
      <template v-else-if="playerFetchStatus === Status.ERROR">
        <div class="flex gap-3 items-center justify-center h-screen">
          <img src="/img/role/imp.png" class="inline-block w-16 h-16" />
          <p class="text-center text-2xl my-4 font-dumbledor">
            This account is not available
          </p>
          <img src="/img/role/imp.png" class="inline-block w-16 h-16" />
        </div>
      </template>
      <template v-else>
        <Loading class="h-screen" />
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const users = useUsers();
const friends = useFriends();
const gameStore = useGames();
const username = useRoute().params.username as string;
const user = useSupabaseUser();

const me = computed(() => {
  if (!user.value) return null;

  const u = users.getUserById(user.value.id);

  if (u.status === Status.SUCCESS) {
    return u.data;
  } else {
    return null;
  }
});

const playerStatus = computed(() => users.getUser(username));
const playerFetchStatus = computed(() => playerStatus.value.status);
const player = computed(() => {
  if (playerStatus.value.status === Status.SUCCESS) {
    return playerStatus.value.data;
  } else {
    return null;
  }
});

const games = computed(() => {
  return gameStore.getByPlayer(username);
});

const pendingGames = computed(() => {
  return gameStore.getPendingByPlayer(username);
});

const currentTab = computed(() => {
  switch (route.query.view) {
    case "charts":
      return "charts";
    case "pending":
      return "pending";
    default:
      return "dashboard";
  }
});

function currentTabClass(tab: string) {
  return {
    "border-stone-500": currentTab.value === tab,
    "border-transparent": currentTab.value !== tab,
  };
}

const inFlight = ref(false);

async function addTaggedGamesToProfile() {
  if (pendingGames.value.status !== Status.SUCCESS) return;

  if (
    confirm("Are you sure you want to add all tagged games to your profile?")
  ) {
    inFlight.value = true;
    try {
      const results = await Promise.all(
        pendingGames.value.data.map((game) =>
          $fetch<GameRecord>(`/api/games/${game.id}/confirm`, {
            method: "POST",
          })
        )
      );

      for (const game of results) {
        gameStore.games.set(game.id, { status: Status.SUCCESS, data: game });
      }

      router.push(`/@${username}`);
    } catch (err) {
      inFlight.value = false;
      console.error(err);
      alert(
        "There was an error adding the games to your profile. Try again in a few minutes."
      );
    }
  }
}

onMounted(() => {
  users.fetchUser(username).catch((err) => {
    showError({
      statusCode: 404,
      message: `User ${username} not found`,
      fatal: true,
    });
  });
  gameStore.fetchPlayerGames(username);
  gameStore.fetchPlayerGames(username, { show_tagged_games: true });
});

useHead({
  title: username,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "og:title",
      content: `${username} | ClockTracker`,
    },
    {
      property: "og:description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "og:image",
      content: `/api/user/${username}/avatar` || "",
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
      content: `${username} | ClockTracker`,
    },
    {
      property: "twitter:description",
      content: `View ${username}'s profile on ClockTracker`,
    },
    {
      property: "twitter:image",
      content: `/api/user/${username}/avatar` || "",
    },
  ],
});
</script>
