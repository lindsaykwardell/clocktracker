<template>
  <ul class="flex flex-wrap">
    <li
      v-for="game in games"
      class="border border-black transition duration-150 ease-in-out"
      :class="
        cardWidth +
        (selectMultipleGames.selectedGames.includes(game.id)
          ? ' selected'
          : '')
      "
    >
      <div class="relative">
        <button
          v-if="selectMultipleGames.enabled"
          class="absolute top-0 left-0 w-full h-full z-50 cursor-pointer"
          @click="selectMultipleGames.toggleGame(game.id)"
        ></button>
        <component
          :is="componentIs"
          @click="handleCardClick(game)"
          :to="getGameLink(game)"
          class="w-full bg-stone-900 flex flex-col items-center cursor-pointer rounded overflow-hidden text-black h-48 md:h-72 bg-cover bg-center script-bg"
          :style="
            game.associated_script?.background
              ? { '--bg-image-url': `url(${game.associated_script.background})` }
              : {}
          "
          :class="{
            ...scripts.scriptBgClasses(
              game.script,
              !!game.associated_script?.background
            ),
          }"
        >
          <img
            v-if="game.image_urls[0]"
            :src="fullImageUrl(game.image_urls[0])"
            class="absolute bottom-0 w-full h-full object-cover blur-sm"
            crossorigin="anonymous"
          />
          <div
            class="absolute top-0 left-0 text-white md:text-lg bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-1 flex gap-1 items-center"
          >
            <div>{{ formatDate(game.date) }}</div>
          </div>
          <div class="absolute top-8 left-1 z-10">
            <Avatar
              v-if="game.community"
              :value="game.community.icon"
              size="sm"
              class="flex-shrink bg-stone-300 dark:bg-stone-950"
            />
          </div>
          <div
            class="flex-grow items-center justify-center flex font-sorts text-3xl"
          >
            <Token
              v-if="
                showCommunityCard === false &&
                (gamesStore.getLastCharater(game.id).name ||
                  gamesStore.getLastCharater(game.id).alignment !== 'NEUTRAL')
              "
              :character="gamesStore.getLastCharater(game.id)"
              size="lg"
            />
            <div v-else class="bg-black/25 flex justify-center">
              <img
                :src="
                  game.associated_script?.logo ??
                  scripts.scriptLogo(game.script)
                "
                class="w-2/3"
              />
            </div>
          </div>
          <div class="absolute w-full top-0 left-0" />
          <div 
            class="absolute top-0 right-0 p-2 flex gap-1 items-center justify-center game-winner game-winner--grid" 
            v-html="displayWinIconSvg(game, props.showCommunityCard)">
          </div>
        </component>
        <div
          class="absolute bottom-0 left-0 w-full flex justify-between bg-gradient-to-tr from-black/75 via-black/25 to-black/75"
        >
          <div
            class="absolute -top-12 left-0 p-1 flex gap-2 items-center bg-gradient-to-r from-black/75 via-black/50 to-black-0 h-12"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
              class="text-yellow-400"
            >
              <path
                fill="currentColor"
                d="M64.12 147.8a4 4 0 0 1-4 4.2H16a8 8 0 0 1-7.8-6.17a8.35 8.35 0 0 1 1.62-6.93A67.8 67.8 0 0 1 37 117.51a40 40 0 1 1 66.46-35.8a3.94 3.94 0 0 1-2.27 4.18A64.08 64.08 0 0 0 64 144c0 1.28 0 2.54.12 3.8m182-8.91A67.76 67.76 0 0 0 219 117.51a40 40 0 1 0-66.46-35.8a3.94 3.94 0 0 0 2.27 4.18A64.08 64.08 0 0 1 192 144c0 1.28 0 2.54-.12 3.8a4 4 0 0 0 4 4.2H240a8 8 0 0 0 7.8-6.17a8.33 8.33 0 0 0-1.63-6.94Zm-89 43.18a48 48 0 1 0-58.37 0A72.13 72.13 0 0 0 65.07 212A8 8 0 0 0 72 224h112a8 8 0 0 0 6.93-12a72.15 72.15 0 0 0-33.74-29.93Z"
              />
            </svg>
            <div class="text-white font-bold flex items-center gap-2">
              {{ game.player_count }}
              <template v-if="game.traveler_count">
                (+{{ game.traveler_count }})
              </template>
              <div
                v-for="(player, index) in taggedPlayers(game)"
                class="tagged-players"
                :style="`--i: ${index}`"
              >
                <Avatar size="xs" :value="player?.avatar" class="bg-stone-300 dark:bg-stone-950" />
              </div>
            </div>
          </div>
          <div class="flex flex-grow justify-between gap-1 p-1">
            <div class="flex gap-1 items-center">
              <div v-if="isFavorite(game)" class="text-primary">
                <Star class="w-6" />
              </div>
              <div v-if="game.ls_game?.campaign?.id">
                <img src="/img/living-scripts.webp" class="w-8 h-8" />
              </div>
              <div class="font-gothic text-white md:text-lg flex gap-1 items-center">
                <div class="">
                  {{ game.script }}
                  <template
                    v-if="
                      game.associated_script && !scripts.isBaseScript(game.script)
                    "
                  >
                    <span class="inline-flex items-center rounded-sm bg-black/50 text-xs font-medium text-white badge">
                      <template v-if="game.ls_game_id">
                        Game {{ game.associated_script.version }}
                      </template>
                      <template v-else>
                        {{ game.associated_script.version }}
                      </template>
                    </span>
                  </template>
                </div>
              </div>
            </div>
            <div class="game-actions flex gap-2 items-center justify-center">
              <nuxt-link
                  v-if="!selectMultipleGames.enabled && isMyGame(game)"
                  class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                  :title="`Edit game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                  :to="`/game/${game.id}/edit`"
                  >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                  </svg>
                </nuxt-link>
              <a
                v-if="!selectMultipleGames.enabled && game.bgg_id"
                target="_blank"
                class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                :title="`View this game on BoardGameGeek - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 25.4 37.9" aria-hidden="true">
                  <path fill="currentColor" d="m24.9 7-3.8 1 3.7-8L.9 8.8l1.3 10.5L0 21.5l6.6 16.4 14-5.1 4.8-11.4-2.1-2L24.9 7z"/>
                </svg>
              </a>
              <nuxt-link
                v-if="!selectMultipleGames.enabled"
                class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out game-link"
                :title="`View game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${gamesStore.getLastCharater(game.id).name}`
                    : game.script || gamesStore.getLastCharater(game.id)?.name || ''
                }, played on ${formatDate(game.date)}`"
                :to="getGameLink(game)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                  <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                </svg>
              </nuxt-link>
            </div>
            <div class="flex items-center justify-center select-status"
              v-if="selectMultipleGames.enabled"
            >
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { displayWinIconSvg } from "~/composables/useGames";
const gamesStore = useGames();
const users = useUsers();
const me = useMe();

const config = useRuntimeConfig();
const scripts = useScripts();
const selectMultipleGames = useSelectMultipleGames();

const props = withDefaults(
  defineProps<{
    games: GameRecord[];
    cardWidth?: string;
    onCardClick?: (game: GameRecord) => void;
    showCommunityCard?: boolean;
  }>(),
  {
    showCommunityCard: false,
  }
);

const getGameLink = (game: GameRecord) => {
  if (me.value?.status === Status.SUCCESS) {
    const user_id = me.value.data.user_id;
    const childGame = game.child_games?.find(
      (g: { user_id: string }) => g.user_id === user_id
    );
    if (childGame) {
      return `/game/${childGame.id}`;
    }
  }
  return `/game/${game.id}`;
};

const componentIs = computed(() => {
  if (!props.games.length) return "div";
  return props.onCardClick ? "button" : defineNuxtLink({});
});

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    timeZone: "UTC",
  }).format(new Date(date));
}

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

const cardWidth = computed(() => props.cardWidth || "w-1/2 lg:w-1/3 xl:w-1/4");

function handleCardClick(game: GameRecord) {
  if (props.onCardClick) props.onCardClick(game);
}

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

function isMyGame(game: GameRecord) {
  if (me.value.status !== Status.SUCCESS) return false;

  return me.value?.data.user_id === game.user_id;
}

const taggedPlayers = computed(
  () => (game: GameRecord) =>
    game.grimoire
      .flatMap((g) => g.tokens.filter((t) => t.player_id))
      .map((t) => t.player)
      .filter(
        (p, i, a) => p && a.findIndex((p2) => p2?.username === p.username) === i
      )
);
</script>

<style scoped>
th {
  @apply cursor-pointer select-none;
}

.script-bg {
  background-image: var(--bg-image-url);

  &.is-trouble-brewing {
    --bg-image-url: url("/img/scripts/trouble-brewing-bg-grid.webp");
  }

  &.is-sects-and-violets {
    --bg-image-url: url("/img/scripts/sects-and-violets-bg-grid.webp");
  }

  &.is-bad-moon-rising {
    --bg-image-url: url("/img/scripts/bad-moon-rising-bg-grid.webp");
  }

  &.is-custom-script {
    --bg-image-url: url("/img/scripts/custom-script-bg-grid.webp");
  }

  &.is-unknown-script {
    --bg-image-url: url("/img/scripts/unknown-script-bg-grid.webp");
  }
}

.custom-script-name {
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: white;
}

.tagged-players {
  @apply relative;
  left: calc(var(--i) * -1.75rem);
}

li.selected {
  position: relative;

  &::before {
    @apply bg-purple-800/30;

    content: '';
    position: absolute;
    inset: 0;
    z-index: 12;
  }
}
</style>

<style>
.game-winner--grid {
  svg {
    block-size: 2rem;
  }
}

.badge {
  padding: .125rem .25rem;
}
</style>
