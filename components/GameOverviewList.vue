<template>
  <div class="flex flex-wrap">
    <table class="w-full">
      <thead>
        <tr>
          <th></th>
          <th>Character</th>
          <th class="hidden md:table-cell">Date</th>
          <th>Script</th>
          <th class="hidden md:table-cell">Location</th>
          <th class="hidden md:table-cell">Community</th>
          <th class="hidden md:table-cell">Players (+Travelers)</th>
          <th>Win/Loss</th>
        </tr>
      </thead>
      <tbody>
        <component
          :is="componentIs"
          v-for="game in games"
          :to="`/game/${game.id}`"
          class="table-row cursor-pointer bg-cover bg-center"
          @click="
            selectMultipleGames.enabled
              ? selectMultipleGames.toggleGame(game.id)
              : null
          "
          :class="{
            'trouble-brewing': game.script === 'Trouble Brewing',
            'sects-and-violets': game.script === 'Sects and Violets',
            'bad-moon-rising': game.script === 'Bad Moon Rising',
            'custom-script':
              [
                'Trouble Brewing',
                'Sects and Violets',
                'Bad Moon Rising',
              ].indexOf(game.script) === -1,
            'select-multiple': selectMultipleGames.enabled,
            selected: selectMultipleGames.selectedGames.includes(game.id),
          }"
        >
          <td class="w-12">
            <a
              v-if="game.bgg_id"
              target="_blank"
              :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
            >
              <img src="/img/bgg.png" class="w-8 md:w-12" />
            </a>
          </td>
          <td>
            <Token
              v-if="
                gamesStore.getLastCharater(game.id).name ||
                gamesStore.getLastCharater(game.id).alignment !== 'NEUTRAL'
              "
              :character="gamesStore.getLastCharater(game.id)"
              size="sm"
            />
          </td>
          <td class="hidden md:table-cell">
            <div class="flex gap-1 items-center">
              <div v-if="isFavorite(game)" class="text-primary">
                <Star class="w-6" />
              </div>
              <div>
                {{ formatDate(game.date) }}
              </div>
            </div>
          </td>
          <td>
            {{ game.script }}
            <template
              v-if="game.associated_script && !isBaseScript(game.script)"
            >
              v{{ game.associated_script.version }}
            </template>
          </td>
          <td class="hidden md:table-cell">
            <template v-if="game.location_type === 'IN_PERSON'">
              {{ game.location || "In Person" }}
            </template>
            <template v-else> Online </template>
          </td>
          <td class="hidden md:table-cell">
            <div class="flex gap-2 items-center">
              <Avatar
                v-if="game.community"
                :value="game.community.icon"
                size="xs"
                class="flex-shrink bg-stone-300 dark:bg-stone-950"
              />
              {{ game.community_name }}
            </div>
          </td>
          <td class="hidden md:table-cell">
            {{ game.player_count }}
            <template v-if="game.traveler_count && game.traveler_count > 0">
              (+{{ game.traveler_count }})
            </template>
          </td>
          <td>
            <div class="flex gap-1">
              <img
                class="w-8 h-8 md:w-12 md:h-12 col-span-auto z-10"
                :src="displayWinIcon(game)"
              />
              <nuxt-link
                v-if="!readonly"
                class="dark:text-white font-bold px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial z-10"
                :to="`/game/${game.id}/edit`"
                ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <path
                    fill="currentColor"
                    d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z"
                  />
                </svg>
              </nuxt-link>
            </div>
          </td>
        </component>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { displayWinIcon } from "~/composables/useGames";

const gamesStore = useGames();
const selectMultipleGames = useSelectMultipleGames();
const { isBaseScript } = useScripts();
const users = useUsers();

defineProps<{
  games: GameRecord[];
  readonly?: boolean;
}>();

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

const nuxtLink = resolveComponent("nuxt-link");

const componentIs = computed(() => {
  if (selectMultipleGames.enabled) return "tr";
  return nuxtLink;
});

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}

.dark {
  .trouble-brewing {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
      url("/img/trouble-brewing-bg.webp");

    &:hover {
      background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
        url("/img/trouble-brewing-bg.webp");
    }
  }

  .sects-and-violets {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
      url("/img/sects-and-violets-bg.webp");

    &:hover {
      background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
        url("/img/sects-and-violets-bg.webp");
    }
  }

  .bad-moon-rising {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
      url("/img/bad-moon-rising-bg.webp");

    &:hover {
      background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
        url("/img/bad-moon-rising-bg.webp");
    }
  }

  .custom-script {
    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
      url("/img/custom-script-bg.webp");

    &:hover {
      background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
        url("/img/custom-script-bg.webp");
    }
  }
}

.trouble-brewing {
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0.7)
    ),
    url("/img/trouble-brewing-bg.webp");

  &:hover {
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.5)
      ),
      url("/img/trouble-brewing-bg.webp");
  }
}

.sects-and-violets {
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0.7)
    ),
    url("/img/sects-and-violets-bg.webp");

  &:hover {
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.5)
      ),
      url("/img/sects-and-violets-bg.webp");
  }
}

.bad-moon-rising {
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0.7)
    ),
    url("/img/bad-moon-rising-bg.webp");

  &:hover {
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.5)
      ),
      url("/img/bad-moon-rising-bg.webp");
  }
}

.custom-script {
  background-image: linear-gradient(
      rgba(255, 255, 255, 0.7),
      rgba(255, 255, 255, 0.7)
    ),
    url("/img/custom-script-bg.webp");

  &:hover {
    background-image: linear-gradient(
        rgba(255, 255, 255, 0.5),
        rgba(255, 255, 255, 0.5)
      ),
      url("/img/custom-script-bg.webp");
  }
}

td {
  @apply h-12 md:h-16 p-2 transition duration-150;
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;

  .select-multiple.selected & {
    @apply bg-primary;
  }
}
</style>
