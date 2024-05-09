<template>
  <StandardTemplate>
    <section
      v-if="game.status === Status.SUCCESS && player.status === Status.SUCCESS"
      class="flex flex-col gap-4 bg-gradient-to-b from-stone-200 to-stone-400 dark:from-stone-100 dark:to-stone-300 text-black w-full lg:w-4/5 m-auto my-4 rounded shadow-lg relative"
    >
      <div
        class="metadata flex flex-col-reverse md:flex-row items-center md:items-start px-4 pt-4"
      >
        <div class="flex-grow flex flex-col w-full">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <Avatar
              :value="player.data.avatar || ''"
              class="border-2 shadow-xl"
              :class="{
                'border-blue-600': last_character?.alignment === 'GOOD',
                'border-red-600': last_character?.alignment === 'EVIL',
              }"
            />
            <div class="flex-grow">
              <h2 class="text-3xl font-dumbledor">
                <nuxt-link
                  class="hover:underline"
                  :to="`/@${player.data.username}`"
                >
                  {{ player.data.display_name }}
                </nuxt-link>
              </h2>
              <div class="flex flex-col md:flex-row gap-2">
                <div
                  v-if="game.data.is_storyteller"
                  class="font-dumbledor text-xl font-bold bottom-[20px]"
                >
                  Storyteller
                </div>
                <div
                  v-for="(character, i) in game.data.player_characters"
                  class="font-dumbledor text-xl font-bold bottom-[20px]"
                  :class="{
                    'text-blue-800': character.alignment === 'GOOD',
                    'text-red-800': character.alignment === 'EVIL',
                  }"
                >
                  {{ character.name }}
                  <template v-if="character.related">
                    ({{ character.related }})
                  </template>
                  <template v-if="i !== game.data.player_characters.length - 1">
                    ➡
                  </template>
                </div>
              </div>
              <time
                :datetime="dayjs(game.data.date).toISOString()"
                class="text-sm"
              >
                {{ formatDate(game.data.date) }}
              </time>
            </div>
            <div
              v-if="
                last_character.name || last_character.alignment !== 'NEUTRAL'
              "
              class="font-dumbledor text-2xl"
            >
              <nuxt-link
                :to="`/roles/${last_character?.role_id}`"
                class="hover:underline flex flex-col items-center"
              >
                <Token :character="last_character" size="md" />
              </nuxt-link>
            </div>
          </div>
          <div class="flex flex-col md:flex-row gap-4 mt-4">
            <label class="flex gap-3 items-center">
              <span>Script</span>
              <nuxt-link
                class="hover:underline text-blue-800 hover:text-blue-700"
                :to="scriptLink(game.data)"
              >
                {{ game.data.script }}
                <template
                  v-if="
                    game.data.associated_script?.version &&
                    !isBaseScript(game.data.script)
                  "
                >
                  v{{ game.data.associated_script.version }}
                </template>
              </nuxt-link>
            </label>
            <label v-if="storytellers.length" class="flex gap-3 items-center">
              <span>Storyteller{{ storytellers.length === 1 ? "" : "s" }}</span>
              <div>
                <template v-for="(storyteller, index) in storytellers">
                  <nuxt-link
                    v-if="
                      isStorytellerAFriend(storyteller) &&
                      storyteller.includes('@')
                    "
                    class="hover:underline text-blue-800 hover:text-blue-700"
                    :to="`/${storyteller}`"
                  >
                    {{ storyteller }}
                  </nuxt-link>
                  <template v-else>{{ storyteller }}</template>
                  <template v-if="index !== storytellers.length - 1"
                    >,
                  </template>
                </template>
              </div>
            </label>
            <label
              v-if="game.data.player_count"
              class="flex gap-3 items-center"
            >
              <span>Players</span>
              {{ game.data.player_count }}
            </label>
            <label
              v-if="game.data.traveler_count"
              class="flex gap-3 items-center"
            >
              <span>Travelers</span>
              {{ game.data.traveler_count }}
            </label>
          </div>
          <div class="flex flex-col md:flex-row gap-4 mt-4 justify-start">
            <label
              v-if="game.data.community_name"
              class="flex gap-3 items-center"
            >
              <span>Community</span>
              <Avatar
                v-if="game.data.community?.icon"
                :value="game.data.community.icon"
                size="xs"
                class="border-stone-800 flex-shrink"
              />

              <nuxt-link
                v-if="game.data.community?.slug"
                class="hover:underline text-blue-800 hover:text-blue-700"
                :to="`/community/${game.data.community.slug}`"
              >
                {{ game.data.community_name }}
              </nuxt-link>
              <div v-else>{{ game.data.community_name }}</div>
            </label>
            <label class="flex gap-3 items-center">
              <span>Location</span>
              {{
                game.data.location_type === "IN_PERSON" ? "In Person" : "Online"
              }}
              {{ game.data.location ? ` (${game.data.location})` : "" }}
            </label>
            <label
              v-if="game.data?.win_v2 !== WinStatus_V2.NOT_RECORDED"
              class="flex gap-3 items-center"
            >
              <span class="block">Result</span>
              {{
                game.data?.win_v2 === WinStatus_V2.GOOD_WINS
                  ? "Good Wins"
                  : "Evil Wins"
              }}
            </label>
            <label v-if="game.data.parent_game" class="flex gap-3 items-center">
              <span class="block">Tagged By</span>
              <nuxt-link
                class="hover:underline text-blue-800 hover:text-blue-700"
                :to="`/@${game.data.parent_game.user.username}`"
              >
                {{ game.data.parent_game.user.display_name }}
              </nuxt-link>
            </label>
          </div>
          <div
            v-if="game.data.demon_bluffs.length || game.data.fabled.length"
            class="flex flex-col md:flex-row gap-4 mt-4 justify-start"
          >
            <label
              v-if="game.data.demon_bluffs.length"
              class="flex gap-3 items-center"
            >
              <span class="block">Demon Bluffs</span>
              <div class="flex flex-wrap gap-2">
                <Token
                  v-for="bluff in game.data.demon_bluffs"
                  :key="bluff.id"
                  :character="bluff"
                  size="sm"
                />
              </div>
            </label>
            <label
              v-if="game.data.fabled.length"
              class="flex gap-3 items-center"
            >
              <span class="block">Fabled</span>
              <div class="flex flex-wrap gap-2">
                <Token
                  v-for="fabled in game.data.fabled"
                  :key="fabled.id"
                  :character="fabled"
                  size="sm"
                />
              </div>
            </label>
          </div>
          <div v-if="game.data.bgg_id" class="flex flex-wrap gap-2 mt-4">
            <a
              class="flex gap-1 items-center hover:underline text-blue-800 hover:text-blue-700"
              target="_blank"
              :href="`https://boardgamegeek.com/play/details/${game.data.bgg_id}`"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                class="text-[#ff5100]"
              >
                <path
                  fill="currentColor"
                  d="m19.7 4.44l-2.38.64L19.65 0L4.53 5.56l.83 6.67l-1.4 1.34L8.12 24l8.85-3.26l3.07-7.22l-1.32-1.27l.98-7.81Z"
                />
              </svg>
              BoardGameGeek
            </a>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <span
              v-for="tag in game.data.tags"
              class="bg-stone-300 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
            >
              <span>{{ tag }}</span>
            </span>
          </div>
        </div>
        <img
          :src="
            game.data.associated_script?.logo ?? scriptLogo(game.data.script)
          "
          class="w-48 md:w-64 h-48 md:h-64"
        />
      </div>
      <div v-if="game.data.notes || game.data.image_urls.length" class="px-4">
        <h3 class="font-dumbledor text-2xl">Notes and Images</h3>
        <div
          v-if="game.data.notes"
          class="notes bg-stone-100 p-4 shadow-lg my-3"
        >
          <VueMarkdown :source="game.data.notes" />
        </div>
        <div class="flex flex-col gap-5">
          <div class="flex flex-wrap gap-5">
            <div v-for="file in game.data.image_urls" :key="file">
              <a
                :href="fullImageUrl(file)"
                target="_blank"
                class="w-full sm:w-1/2 md:w-64 md:h-64"
              >
                <img
                  :src="fullImageUrl(file)"
                  class="w-full sm:w-1/2 md:w-64 md:h-64 object-cover shadow-lg"
                  crossorigin="anonymous"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="
          game.data.grimoire[0] &&
          game.data.grimoire[0].tokens.some((token) => token.role)
        "
        class="bg-center bg-cover relative text-white"
        :class="{
          'trouble-brewing': game.data.script === 'Trouble Brewing',
          'sects-and-violets': game.data.script === 'Sects and Violets',
          'bad-moon-rising': game.data.script === 'Bad Moon Rising',
          'custom-script':
            ['Trouble Brewing', 'Sects and Violets', 'Bad Moon Rising'].indexOf(
              game.data.script
            ) === -1,
        }"
      >
        <button
          type="button"
          @click="grimPage -= 1"
          v-if="grimPage !== 0"
          class="absolute bottom-0 left-1 flex items-center font-dumbledor z-10"
        >
          <span
            class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
          >
            {{ "<" }} Previous page
          </span>
        </button>
        <button
          v-if="grimPage !== game.data.grimoire.length - 1"
          type="button"
          @click="grimPage += 1"
          class="absolute bottom-0 right-1 flex items-center font-dumbledor z-10"
        >
          <span
            class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
          >
            Next page
            {{ ">" }}
          </span>
        </button>
        <div class="w-screen md:w-full overflow-scroll">
          <Grimoire :tokens="game.data.grimoire[grimPage].tokens" readonly />
        </div>
        <div
          class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800"
        >
          Page {{ grimPage + 1 }} of {{ game.data.grimoire.length }}
        </div>
      </div>
      <Dialog v-model:visible="showSimilarGamesDialog" size="lg">
        <template #title>
          <h2 class="text-2xl font-dumbledor">Similar Games</h2>
        </template>
        <GameOverviewGrid
          :games="similarGames"
          readonly
          cardWidth="w-1/2 lg:w-1/3"
          :onCardClick="confirmMergeGame"
        />
      </Dialog>
      <div
        v-if="user?.id && player.data.user_id === user.id"
        class="absolute top-1 right-3"
        id="menu-controls"
      >
        <Menu>
          <MenuButton>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 16 16"
              class="w-6"
            >
              <path
                fill="#000"
                d="M3 9.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3"
              />
            </svg>
          </MenuButton>
          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <MenuItems
              class="absolute right-0 z-10 bg-stone-100 dark:bg-stone-900 rounded shadow-md whitespace-nowrap flex flex-col items-start min-w-[150px] divide-y divide-stone-500 dark:divide-stone-700 overflow-hidden"
            >
              <div
                v-if="
                  game.data.waiting_for_confirmation || similarGames.length > 0
                "
                class="w-full"
              >
                <MenuItem v-if="game.data.waiting_for_confirmation">
                  <button
                    @click="confirmGame"
                    class="flex gap-1 w-full items-center dark:text-white text-sm px-2 min-h-[32px]"
                  >
                    Add game to my Profile
                  </button>
                </MenuItem>
                <MenuItem v-if="similarGames.length > 0">
                  <button
                    @click="showSimilarGamesDialog = true"
                    :disabled="mergeInFlight"
                    class="flex gap-1 w-full items-center dark:text-white text-sm px-2 min-h-[32px]"
                  >
                    Merge with similar game
                  </button>
                </MenuItem>
              </div>
              <div class="w-full">
                <MenuItem v-if="!game.data.waiting_for_confirmation">
                  <nuxt-link
                    class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                    :to="`/game/${route.params.id}/edit`"
                    id="edit-game"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 32 32"
                      class="w-4"
                    >
                      <path
                        fill="currentColor"
                        d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z"
                      />
                    </svg>
                    Edit
                  </nuxt-link>
                </MenuItem>
                <MenuItem>
                  <button
                    @click="deleteGame(false)"
                    class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 512 512"
                      class="w-4"
                    >
                      <path
                        d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                        fill="currentColor"
                      />
                      <path d="M249 160h14v241h-14z" fill="currentColor" />
                      <path
                        d="M320 160h-14.6l-10.7 241h14.6z"
                        fill="currentColor"
                      />
                      <path
                        d="M206.5 160H192l10.7 241h14.6z"
                        fill="currentColor"
                      />
                    </svg>
                    <template v-if="game.data.waiting_for_confirmation"
                      >Ignore</template
                    >
                    <template v-else>Delete</template>
                  </button>
                </MenuItem>
                <MenuItem v-if="game.data.waiting_for_confirmation">
                  <button
                    @click="deleteGame(true)"
                    class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 512 512"
                      class="w-4"
                    >
                      <path
                        d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                        fill="currentColor"
                      />
                      <path d="M249 160h14v241h-14z" fill="currentColor" />
                      <path
                        d="M320 160h-14.6l-10.7 241h14.6z"
                        fill="currentColor"
                      />
                      <path
                        d="M206.5 160H192l10.7 241h14.6z"
                        fill="currentColor"
                      />
                    </svg>
                    Ignore and Untag Myself
                  </button>
                </MenuItem>
              </div>
              <div class="w-full">
                <MenuItem v-if="canPostToBGG">
                  <button
                    class="bg-[#3f3a60] hover:bg-[#2e2950] transition duration-150 text-white flex items-center w-full text-sm min-h-[32px]"
                    @click="postToBGG"
                    :disabled="bggInFlight"
                  >
                    <div class="w-6 ml-1">
                      <img
                        src="/img/bgg.png"
                        class="w-6 h-6 m-auto"
                        :class="{ 'animate-spin': bggInFlight }"
                      />
                    </div>
                    <span v-if="game.data.bgg_id">Delete from BGG</span>
                    <span v-else>Post to BGG</span>
                  </button>
                </MenuItem>
                <MenuItem v-if="canPostToBGStats">
                  <a
                    :href="bgStatsLink"
                    class="bg-[#333] transition duration-150 dark:text-white flex items-center w-full gap-1 text-sm min-h-[32px]"
                  >
                    <img
                      src="https://clocktracker.app/img/bgstats.png"
                      class="w-5 h-5 ml-1"
                    />
                    Post to BGStats
                  </a>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>
      </div>
      <Tour
        v-if="user?.id && game.data.user_id === user.id"
        :steps="tour"
        tourKey="game-viewer"
      />
    </section>
    <template v-else>
      <Loading class="h-screen" />
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { WinStatus_V2 } from "~/composables/useGames";
import dayjs from "dayjs";
import VueMarkdown from "vue-markdown-render";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const { scriptLogo, isBaseScript } = useScripts();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const user = useSupabaseUser();
const users = useUsers();
const games = useGames();
const friends = useFriends();
const gameId = route.params.id as string;
const bggInFlight = ref(false);
const mergeInFlight = ref(false);

const game = computed(() => games.getGame(gameId));
const player = computed<FetchStatus<User>>(() => {
  if (game.value.status !== Status.SUCCESS) return { status: Status.LOADING };

  return users.getUser(game.value.data.user.username);
});
const grimPage = ref(
  game.value.status === Status.SUCCESS ? game.value.data.grimoire.length - 1 : 0
);
const similarGames = computed(() => games.getSimilarGames(gameId));
const showSimilarGamesDialog = ref(false);

const { canPostToBGStats, link: bgStatsLink } = useBGStats(game);

const canPostToBGG = computed(() => {
  const me = users.getUserById(user.value?.id || "");

  if (me.status !== Status.SUCCESS) return false;

  return !!me.data.bgg_username;
});

watchEffect(() => {
  if (
    game.value.status === Status.ERROR ||
    player.value.status === Status.ERROR
  ) {
    showError({
      statusCode: 404,
      message: `Game not found`,
      fatal: true,
    });
  }
});

watchEffect(() => {
  if (game.value.status === Status.SUCCESS) {
    if (player.value.status !== Status.SUCCESS) {
      users.fetchUser(game.value.data.user.username);
    }
    grimPage.value = game.value.data.grimoire.length - 1;
  }
});

const gameMetadata = await useFetch(`/api/games/${gameId}/minimal`);

if (gameMetadata.error.value) {
  throw gameMetadata.error.value;
}

useHead({
  title: `${gameMetadata.data.value!.user!.display_name} | ${
    gameMetadata.data.value!.script
  }`,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:title",
      content: `${gameMetadata.data.value!.user!.display_name} | ${
        gameMetadata.data.value!.script
      }`,
    },
    {
      property: "og:description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:image",
      content:
        gameMetadata.data.value?.associated_script?.logo ??
        scriptLogo(gameMetadata.data.value!.script as string),
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
      content: `${gameMetadata.data.value!.user!.display_name} | ${
        gameMetadata.data.value!.script
      }`,
    },
    {
      property: "twitter:description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "twitter:image",
      content:
        gameMetadata.data.value?.associated_script?.logo ??
        scriptLogo(gameMetadata.data.value!.script as string),
    },
  ],
});

const last_character = computed(() => {
  return games.getLastCharater(gameId);
});

function isStorytellerAFriend(storyteller: string) {
  if (friends.isFriend(storyteller.replace("@", "") || "")) {
    return true;
  }

  const storytellerUser = users.getUser(storyteller.replace("@", "") || "");

  // If it's me, I'm a friend of myself.
  if (
    storytellerUser.status === Status.SUCCESS &&
    storytellerUser.data.user_id === user.value?.id
  ) {
    return true;
  }

  return false;
}

const storytellers = computed(() => {
  if (game.value.status !== Status.SUCCESS) return [];

  const storytellerList = [];

  if (game.value.data.is_storyteller) {
    storytellerList.push(`@${game.value.data.user.username}`);
  } else if (game.value.data.storyteller) {
    storytellerList.push(game.value.data.storyteller);
  }

  return [...storytellerList, ...game.value.data.co_storytellers];
});

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

function scriptLink(game: GameRecord) {
  if (game.script === "Sects & Violets") return "/scripts/Sects_and_Violets";

  if (game.script_id) {
    if (game.associated_script?.is_custom_script) {
      return `/scripts/${game.script.replaceAll(" ", "_")}?version=${
        game.associated_script.version
      }&id=${game.associated_script.script_id}`;
    } else {
      return `/scripts/${game.script.replaceAll(" ", "_")}?version=${
        game.associated_script?.version
      }`;
    }
  }

  return `https://botcscripts.com/?search=${game.script.replace(
    / /g,
    "+"
  )}&script_type=&include=&exclude=&edition=&author=`;
}

async function deleteGame(alsoUntagMyself: boolean) {
  if (
    confirm(
      `Are you sure you want to delete this game${
        alsoUntagMyself ? " and untag yourself" : ""
      }?`
    )
  ) {
    const result = await $fetch(`/api/games/${route.params.id}?untag=${alsoUntagMyself}`, {
      method: "delete",
    });

    games.games.delete(gameId);

    router.push(`/`);
  }
}

async function confirmGame() {
  if (confirm("Are you sure you want to add this game to your profile?")) {
    const result = await $fetch<GameRecord>(`/api/games/${gameId}/confirm`, {
      method: "POST",
    });

    games.games.set(gameId, { status: Status.SUCCESS, data: result });
  }
}

async function confirmMergeGame(game: GameRecord) {
  if (confirm("Are you sure you want to merge these games?")) {
    mergeInFlight.value = true;
    const result = await $fetch<GameRecord>(`/api/games/${gameId}/merge`, {
      method: "POST",
      body: game,
    });

    games.games.delete(game.id);

    games.games.set(gameId, { status: Status.SUCCESS, data: result });
    mergeInFlight.value = false;
    showSimilarGamesDialog.value = false;
  }
}

const anonymize = ref(false);

watchEffect(() => {
  const me = users.getUserById(user.value?.id);

  if (me.status === Status.SUCCESS) {
    anonymize.value = me.data.privacy === "PRIVATE";
  }
});

async function postToBGG() {
  if (game.value.status !== Status.SUCCESS) return;

  bggInFlight.value = true;

  if (game.value.data.bgg_id) {
    await $fetch(`/api/games/${gameId}/post_to_bgg`, {
      method: "DELETE",
    });
  } else {
    await $fetch(`/api/games/${gameId}/post_to_bgg`, {
      method: "POST",
      body: JSON.stringify({
        anonymize: anonymize.value,
      }),
    });
  }

  await games.fetchGame(gameId);
  bggInFlight.value = false;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));
}

onMounted(() => {
  games.fetchGame(route.params.id as string).then(() => {
    if (game.value.status === Status.SUCCESS) {
      games.fetchSimilarGames(game.value.data.id);
    }
  });

  if (friends.friends.status !== Status.SUCCESS) {
    friends.fetchFriends();
  }
});

const tour = [
  {
    target: "#menu-controls",
    content: "Use this menu to modify or share your game.",
  },
];
</script>

<style scoped>
.metadata label span {
  @apply text-sm text-stone-500;
}

.trouble-brewing {
  background-image: url("/img/trouble-brewing-bg.webp");
}

.sects-and-violets {
  background-image: url("/img/sects-and-violets-bg.webp");
}

.bad-moon-rising {
  background-image: url("/img/bad-moon-rising-bg.webp");
}

.custom-script {
  background-image: url("/img/custom-script-bg.webp");
}
</style>

<style>
.notes {
  h1 {
    @apply text-3xl font-dumbledor;
  }
  h2 {
    @apply text-2xl font-dumbledor;
  }
  h3 {
    @apply text-xl font-dumbledor;
  }
  h4 {
    @apply text-lg font-dumbledor;
  }
  h5 {
    @apply text-base font-dumbledor;
  }
  h6 {
    @apply text-sm font-dumbledor;
  }

  ul {
    @apply list-disc list-inside;
  }
  ol {
    @apply list-decimal list-inside;
  }
  li {
    @apply my-1;
  }
  li ul,
  li ol {
    @apply ml-4;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply my-4;
  }

  p,
  ul,
  ol,
  table,
  pre,
  img {
    @apply my-2;
  }

  table {
    @apply w-full;
    th {
      @apply bg-stone-300 font-bold;
    }
    tr {
      @apply border-b border-stone-300;
    }
    tr:nth-child(even) {
      @apply bg-stone-200;
    }
    td {
      @apply p-1;
    }
  }
  a {
    @apply text-blue-600 hover:underline;
  }
  hr {
    @apply my-4 border-stone-300;
  }
}
</style>
