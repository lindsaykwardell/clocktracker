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
            class="flex flex-wrap justify-center md:justify-start w-100 md:-mx-3 md:w-[calc(100%+1.5rem)] gap-2 md:gap-1 py-2 md:py-0"
          >
            <nuxt-link
              :to="`/@${username}`"
              class="profile-tab"
              :class="currentTabClass('profile')"
              :aria-current="currentTab === 'profile' ? 'page' : undefined"
            >
              Profile
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=games`"
              class="profile-tab"
              :class="currentTabClass('games')"
              :aria-current="currentTab === 'games' ? 'page' : undefined"
            >
              Games
            </nuxt-link>
            <nuxt-link
              v-if="me?.username === username"
              :to="`/@${username}?view=pending`"
              class="flex gap-1 items-center relative profile-tab"
              :class="currentTabClass('pending')"
              :aria-current="currentTab === 'pending' ? 'page' : undefined"
            >
              <span>Tagged / Draft</span>
              <Badge
                v-if="pendingGames.status === Status.SUCCESS && pendingGames.data.length"
                color="negative"
                aria-label="Pending games count"
                circular
                size="sm"
              >
                {{ pendingGames.data.length }}
              </Badge>
            </nuxt-link>
            <nuxt-link
              :to="`/@${username}?view=stats`"
              class="profile-tab"
              :class="currentTabClass('stats')"
              :aria-current="currentTab === 'stats' ? 'page' : undefined"
            >
              Stats
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
          <UserProfile 
            v-if="currentTab === 'profile'" 
            :player="player" 
          />
          <UserCharts
            v-if="currentTab === 'stats'"
            :games="games"
            :username="username"
          />
          <UserGamesView
            v-if="currentTab === 'games'"
            :player="player"
            :games="games"
          />
          <UserGamesView
            v-if="currentTab === 'pending'"
            :player="player"
            :games="pendingGames"
          >
            <template #default>
              <Button
                v-if="
                  pendingGames.status === Status.SUCCESS &&
                  pendingGames.data.length > 0
                "
                type="button"
                @click="addTaggedGamesToProfile"
                :disabled="inFlight"
                color="positive"
              >
                <template v-if="inFlight">
                  <Spinner class="m-auto" />
                </template>
                <template v-else> Add all games to profile </template>
              </Button>
            </template>

            <template #no-content>
              <div class="flex flex-col items-center gap-2 my-4 text-center">
                <p class="text-2xl font-sorts">No tagged or draft games</p>
                <p class="text-stone-600 dark:text-stone-400 max-w-[60ch]">
                  Games other players tag you in, and drafts you haven't added yet,
                  wait here until you add them to your profile.
                </p>
              </div>
            </template>
          </UserGamesView>
        </template>
        <template v-else>
          <p class="text-center text-2xl my-4 font-sorts">
            This account is private
          </p>
        </template>
      </template>
      <template v-else-if="playerFetchStatus === Status.ERROR">
        <div class="flex gap-3 items-center justify-center h-screen">
          <ImageUI image="imp" class="inline-block w-14 h-14" />
          <p class="text-center text-2xl my-4 font-sorts">
            This account is not available
          </p>
          <ImageUI image="imp" class="inline-block w-14 h-14" />
        </div>
      </template>
      <template v-else>
        <!-- The player loads in the browser: show the open tab's shape right away. -->
        <ProfileHeaderSkeleton :full="currentTab === 'profile'" />
        <div
          v-if="currentTab === 'stats'"
          class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16"
        >
          <!-- Stands in for the stats toolbar until UserCharts renders it. -->
          <div class="flex justify-between gap-3 px-4 pb-3" aria-hidden="true">
            <div class="skeleton-block h-10 w-28 rounded-md" />
            <div class="skeleton-block h-10 w-44 rounded-lg" />
          </div>
          <StatsSkeleton :mode="storytellerStatsFromQuery ? 'storyteller' : 'player'" />
        </div>
        <GamesSkeleton v-else-if="currentTab === 'games' || currentTab === 'pending'" />
        <ProfileSkeleton v-else />
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
const user = useUser();

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
    case "stats":
      return "stats";
    case "pending":
      return "pending";
    case "games":
      return "games";
    default:
      return "profile";
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
});

// The Stats tab's Storyteller view (?storyteller=...), the same rule as
// UserCharts, so the loading skeleton matches the view that will open.
const storytellerStatsFromQuery = computed(() =>
  ["1", "true", "storyteller"].includes(String(route.query.storyteller ?? ""))
);

// Each tab gets its own title, so browser tabs and history can tell them apart.
const pageTitle = computed(() => {
  switch (currentTab.value) {
    case "games":
      return `Games · ${username}`;
    case "pending":
      return `Tagged / Draft · ${username}`;
    case "stats":
      return `Stats · ${username}`;
    default:
      return username;
  }
});

useHead({
  title: pageTitle,
  meta: [
    {
      key: "description",
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