<template>
  <ul class="flex flex-wrap">
    <li
      v-for="game in games"
      class="border border-black transition duration-150 ease-in-out"
      :class="
        cardWidth +
        (selectMultipleGames.selectedGames.includes(game.id) ? ' selected' : '')
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
              ? {
                  '--bg-image-url': `url(${game.associated_script.background})`,
                }
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
            class="absolute top-0 left-0 text-white md:text-lg bg-gradient-to-br from-black/75 via-black/50 to-black-0 p-1 flex gap-2 items-center"
          >
            <div>{{ formatDate(game.date) }}</div>
            <span
              v-if="game.ignore_for_stats"
              class="inline-flex gap-1 items-center rounded-sm bg-red-700/60 text-xs font-medium text-white badge"
            >
              <IconUI id="disabled" size="xs" /><span class="sr-only"
                >Ignore for </span
              >Stats
            </span>
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
            <div class="relative token-solarsystem">
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
              <div v-if="uniquePlayableRoles(game).length" class="hidden md:block">
                <Token
                  v-for="(role, i) in orbitRoles(game)"
                  :key="role.key"
                  :character="{
                    alignment: role.alignment,
                    role: {
                      token_url: role.token_url,
                      alternate_token_urls: role.alternate_token_urls,
                      initial_alignment: role.initial_alignment,
                    },
                  }"
                  size="sm"
                  class="orbit-token"
                  :class="`orbit-token--${i}`"
                  :style="{ '--pos': orbitPos(game, i + orbitOffset(game)) }"
                />
                <Token
                  v-if="uniquePlayableRoles(game).length > 5"
                  :character="{
                    role: {
                      name: '',
                      token_url: '',
                    },
                  }"
                  size="sm"
                  class="orbit-token orbit-token--more"
                  :style="{ '--pos': orbitPos(game, 0) }"
                >
                  <span class="font-sorts font-semibold text-lg text-black"
                    >+{{ uniquePlayableRoles(game).length - 4 }}</span
                  >
                </Token>
              </div>
            </div>
          </div>
          <div class="absolute w-full top-0 left-0" />
          <div
            class="absolute top-0 right-0 p-2 flex gap-1 items-center justify-center game-winner game-winner--grid"
            v-html="displayWinIconSvg(game, props.showCommunityCard)"
          ></div>
        </component>
        <div
          class="absolute bottom-0 left-0 w-full flex justify-between bg-gradient-to-tr from-black/75 via-black/25 to-black/75"
        >
          <div
            class="absolute -top-6 md:-top-12 left-0 p-1 flex gap-2 items-center bg-gradient-to-r from-black/75 via-black/50 to-black-0 h-6 md:h-12"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
              class="text-yellow-400 w-4 h-h md:w-auto md:h-auto"
            >
              <path
                fill="currentColor"
                d="M64.12 147.8a4 4 0 0 1-4 4.2H16a8 8 0 0 1-7.8-6.17a8.35 8.35 0 0 1 1.62-6.93A67.8 67.8 0 0 1 37 117.51a40 40 0 1 1 66.46-35.8a3.94 3.94 0 0 1-2.27 4.18A64.08 64.08 0 0 0 64 144c0 1.28 0 2.54.12 3.8m182-8.91A67.76 67.76 0 0 0 219 117.51a40 40 0 1 0-66.46-35.8a3.94 3.94 0 0 0 2.27 4.18A64.08 64.08 0 0 1 192 144c0 1.28 0 2.54-.12 3.8a4 4 0 0 0 4 4.2H240a8 8 0 0 0 7.8-6.17a8.33 8.33 0 0 0-1.63-6.94Zm-89 43.18a48 48 0 1 0-58.37 0A72.13 72.13 0 0 0 65.07 212A8 8 0 0 0 72 224h112a8 8 0 0 0 6.93-12a72.15 72.15 0 0 0-33.74-29.93Z"
              />
            </svg>
            <div class="text-white font-bold flex items-center gap-2 min-w-[50px] text-xs md:text-base">
              <span>{{ game.player_count }}</span>
              <span class="hidden md:inline">
                <template v-if="game.traveler_count">
                  (+{{ game.traveler_count }})
                </template>
                <div
                  v-for="(player, index) in taggedPlayers(game)"
                  class="tagged-players"
                  :style="`--i: ${index}`"
                >
                  <Avatar
                    size="xs"
                    :value="player?.avatar"
                    class="bg-stone-300 dark:bg-stone-950"
                  /></div
              ></span>
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
              <div
                class="font-gothic text-white md:text-lg flex gap-1 items-center"
              >
                <div class="text-sm md:text-base">
                  {{ game.script }}
                  <template
                    v-if="
                      game.associated_script &&
                      !scripts.isBaseScript(game.script)
                    "
                  >
                    <span
                      class="hidden md:inline-flex items-center rounded-sm bg-black/50 text-xs font-medium text-white badge"
                    >
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
            <div
              class="game-actions gap-2 items-center justify-center hidden md:flex"
            >
              <nuxt-link
                v-if="!selectMultipleGames.enabled && isMyGame(game)"
                class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                :title="`Edit game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                :to="`/game/${game.id}/edit`"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"
                  />
                </svg>
              </nuxt-link>
              <a
                v-if="!selectMultipleGames.enabled && game.bgg_id"
                target="_blank"
                class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out z-10"
                :title="`View this game on BoardGameGeek - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                :href="`https://boardgamegeek.com/play/details/${game.bgg_id}`"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 25.4 37.9"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="m24.9 7-3.8 1 3.7-8L.9 8.8l1.3 10.5L0 21.5l6.6 16.4 14-5.1 4.8-11.4-2.1-2L24.9 7z"
                  />
                </svg>
              </a>
              <nuxt-link
                v-if="!selectMultipleGames.enabled"
                class="text-white bg-black hover:bg-purple-600 transition-colors duration-250 ease-in-out game-link"
                :title="`View game - ${
                  game.script && gamesStore.getLastCharater(game.id)?.name
                    ? `${game.script} as ${
                        gamesStore.getLastCharater(game.id).name
                      }`
                    : game.script ||
                      gamesStore.getLastCharater(game.id)?.name ||
                      ''
                }, played on ${formatDate(game.date)}`"
                :to="getGameLink(game)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  <path
                    d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"
                  />
                </svg>
              </nuxt-link>
            </div>
            <div
              class="flex items-center justify-center select-status"
              v-if="selectMultipleGames.enabled"
            >
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"
                  />
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

function uniquePlayableRoles(game: GameRecord) {
  // Identify the final playable role to avoid duplicating it in the mini-row
  const lastPlayable = [...game.player_characters]
    .reverse()
    .find(
      (c) => c.role_id && c.role?.type !== "FABLED" && c.role?.type !== "LORIC"
    );
  const lastPlayableRoleId = lastPlayable?.role_id ?? null;
  const lastPlayableAlignment = lastPlayable?.alignment ?? "UNKNOWN";

  // Track which alignments we've already shown for each role_id (to avoid repeats).
  const seenAlignmentsByRole = new Map<string, Set<string>>();

  const roles: {
    key: string;
    name: string;
    token_url: string | null;
    alternate_token_urls?: string[] | null;
    alignment: string | null;
    initial_alignment: string | null;
  }[] = [];

  for (const [index, character] of game.player_characters.entries()) {
    if (!character.role_id || !character.name) continue;
    if (character.role?.type === "FABLED" || character.role?.type === "LORIC")
      continue;

    // Skip entries that match the final role/alignment (shown as the main token).
    if (
      lastPlayableRoleId &&
      character.role_id === lastPlayableRoleId &&
      (character.alignment ?? "UNKNOWN") === lastPlayableAlignment
    ) {
      continue;
    }

    const alignmentKey = character.alignment ?? "UNKNOWN";
    const seen =
      seenAlignmentsByRole.get(character.role_id) ?? new Set<string>();
    if (seen.has(alignmentKey)) continue;
    seen.add(alignmentKey);
    seenAlignmentsByRole.set(character.role_id, seen);

    roles.push({
      key: `${character.role_id}:${alignmentKey}:${index}`,
      name: character.name,
      token_url:
        character.role?.token_url ?? character.related_role?.token_url ?? null,
      alternate_token_urls: character.role?.alternate_token_urls ?? null,
      alignment: character.alignment ?? null,
      initial_alignment: character.role?.initial_alignment ?? null,
    });
  }

  return roles;
}

const orbitRoles = (game: GameRecord) => {
  const roles = uniquePlayableRoles(game);
  if (roles.length > 5) {
    // Keep the most recent 4 roles; oldest are summarized in +N.
    return roles.slice(-4);
  }
  // Keep up to the most recent 5 roles.
  return roles.slice(-5);
};

const orbitCount = (game: GameRecord) =>
  Math.min(uniquePlayableRoles(game).length, 5);

const orbitOffset = (game: GameRecord) =>
  uniquePlayableRoles(game).length > 5 ? 1 : 0;

const orbitPos = (game: GameRecord, index: number) => {
  const count = orbitCount(game);
  if (!count) return 0;
  return index - (count - 1) / 2;
};

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

    content: "";
    position: absolute;
    inset: 0;
    z-index: 12;
  }
}
</style>

<style scoped>
.select-status {
  > span {
    @apply bg-white dark:text-white dark:bg-black;

    position: relative;
    z-index: 13;

    .selected & {
      @apply bg-purple-600 text-white dark:text-white dark:bg-purple-800;
    }

    .select-multiple:hover & {
      @apply bg-purple-800 text-white dark:text-white dark:bg-purple-600;
    }
  }
}

.game-actions,
.select-status {
  > a,
  > span {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    block-size: 2rem;
    inline-size: 2rem;
  }

  svg {
    block-size: 1.125rem;
    inline-size: auto;
  }
}

.game-row {
  position: relative;
}

.game-link::after {
  content: "";
  inset: 0;
  position: absolute;
}

.game-winner {
  z-index: 10;

  svg {
    inline-size: auto;
  }
}

.game-winner--table {
  position: relative;

  svg {
    block-size: 1.5rem;
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
  padding: 0.125rem 0.25rem;
}

/* Container: radius controls distance from center */
.token-solarsystem {
  /* For w-36/h-36 + w-8/h-8 -> radius ≈ 6rem for ~0.5rem gap */
  --orbit-radius: 6rem;
}

@media (min-width: 768px) {
  .token-solarsystem {
    /* For w-48/h-48 + w-12/h-12 -> radius ≈ 8rem for ~0.5rem gap */
    --orbit-radius: 9rem;
  }
}

/* Orbiting tokens */
.orbit-token {
  --angle-step: 22deg;
  --scale: 1;
  --offset: 0;

  position: absolute;
  top: calc(50% - 1.5rem);
  left: calc(50% - 1.5rem);

  /* Orbit rotation */
  --orbit-transform: rotate(calc(0deg + var(--pos) * var(--angle-step)))
    translateX(var(--orbit-radius))
    rotate(calc(-0deg + var(--pos) * var(--angle-step) * -1));
  /* --orbit-transform:
    rotate(calc(30deg + var(--offset) * var(--angle-step)))
    translateX(var(--orbit-radius))
    rotate(calc(-30deg + var(--offset) * var(--angle-step) * -1));   */
  transform: var(--orbit-transform) scale(var(--scale));
  transform-origin: center center;

  /* &:nth-child(1) {
    --scale: 1.1;
    --offset: 0;
  }

  &:nth-child(2) {
    --scale: 1;
    --offset: 1;
  }

  &:nth-child(3) {
    --scale: .9;
    --offset: 1.9;
  }

  &:nth-child(4) {
    --scale: .8;
    --offset: 2.7;
  }

  &:nth-child(5) {
    --scale: .7;
    --offset: 3.45;
  }

  &:nth-child(6) {
    --scale: .6;
    --offset: 4.1;
  } */
}
</style>
