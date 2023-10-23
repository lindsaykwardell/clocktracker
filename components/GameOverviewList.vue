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
          <th class="hidden md:table-cell">Players</th>
          <th>Win/Loss</th>
        </tr>
      </thead>
      <tbody>
        <nuxt-link
          v-for="game in games"
          :to="`/game/${game.id}`"
          class="table-row cursor-pointer bg-cover bg-center"
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
            <Token :character="gamesStore.getLastCharater(game.id)" size="sm" />
          </td>
          <td class="hidden md:table-cell">{{ formatDate(game.date) }}</td>
          <td>{{ game.script }}</td>
          <td class="hidden md:table-cell">
            <template v-if="game.location_type === 'IN_PERSON'">
              {{ game.location || "In Person" }}
            </template>
            <template v-else> Online </template>
          </td>
          <td class="hidden md:table-cell">{{ game.community }}</td>
          <td class="hidden md:table-cell">{{ game.player_count }}</td>
          <td class="flex gap-1">
            <img
              class="w-8 h-8 md:w-12 md:h-12 col-span-auto z-10"
              :src="
                game.is_storyteller
                  ? game.win
                    ? '/img/role/good.png'
                    : '/img/role/evil.png'
                  : game.win
                  ? '/img/win.png'
                  : '/img/loss.png'
              "
            />
            <nuxt-link
              v-if="!readonly"
              class="text-white font-bold px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial z-10"
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
          </td>
        </nuxt-link>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { GameRecord } from "~/composables/useGames";

const gamesStore = useGames();

defineProps<{
  games: GameRecord[];
  readonly?: boolean;
  username: string;
}>();

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language).format(new Date(date));
}
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}

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

td {
  @apply h-12 md:h-16 p-2;
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
