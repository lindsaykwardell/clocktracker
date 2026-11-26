<template>
  <!-- Newer and Older go through the games the games overview showed, with
       its filters and order. Without that list, your own games go by date.
       It sits below the game card, so another game's script isn't read
       before this one's title. Where there's room beside the card, the two
       sides float there instead (fixed, vertically centred), and the bar
       below only keeps the count. -->
  <nav
    v-if="shown"
    ref="navEl"
    aria-label="Other games"
    class="w-full lg:w-4/5 m-auto mt-8 mb-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 text-sm"
  >
    <component
      :is="navigation?.previous ? NuxtLink : 'span'"
      v-if="!floating"
      :to="navigation?.previous ? `/game/${navigation.previous.id}` : undefined"
      :aria-hidden="navigation?.previous ? undefined : 'true'"
      class="side justify-self-start"
      :class="navigation?.previous ? 'side-link' : 'side-disabled'"
      @pointerenter="prefetch(navigation?.previous)"
      @focus="prefetch(navigation?.previous)"
    >
      <IconUI id="chevron-left" size="sm" />
      <GameNavigationBarGame
        :game="navigation?.previous ?? null"
        :label="labels.previous"
        :reserveSpace="!navigation"
      />
    </component>
    <span v-else aria-hidden="true" />

    <NuxtLink
      v-if="navigation"
      :to="navigation.backTo"
      class="count-link text-center"
    >
      <!-- Says what it counts, also when it's on its own (with the sides
           floating beside the card). Where it goes is only for screen
           readers. -->
      <span class="sr-only">{{ navigation.label }}, </span>
      Game <span class="tabular-nums">{{ navigation.position }}</span> of
      <span class="tabular-nums">{{ navigation.total }}</span>
      <!-- The space inside the text: Vue drops one at the start of a
           template. -->{{ navigation.suffix ? ` ${navigation.suffix}` : "" }}
    </NuxtLink>
    <span v-else aria-hidden="true" />

    <component
      :is="navigation?.next ? NuxtLink : 'span'"
      v-if="!floating"
      :to="navigation?.next ? `/game/${navigation.next.id}` : undefined"
      :aria-hidden="navigation?.next ? undefined : 'true'"
      class="side justify-self-end flex-row-reverse text-right"
      :class="navigation?.next ? 'side-link' : 'side-disabled'"
      @pointerenter="prefetch(navigation?.next)"
      @focus="prefetch(navigation?.next)"
    >
      <IconUI id="chevron-right" size="sm" />
      <GameNavigationBarGame
        :game="navigation?.next ?? null"
        :label="labels.next"
        :reserveSpace="!navigation"
        end
      />
    </component>
    <span v-else aria-hidden="true" />
  </nav>

  <!-- The floating sides; at the start or end of the list that side is left
       out. -->
  <template v-if="floating && navigation">
    <NuxtLink
      v-if="navigation.previous"
      :to="`/game/${navigation.previous.id}`"
      class="floating-side side-link items-start text-left"
      :style="{ left: `${floating.left}px`, width: `${floating.width}px` }"
      @pointerenter="prefetch(navigation.previous)"
      @focus="prefetch(navigation.previous)"
    >
      <span class="flex items-center gap-1 font-semibold">
        <IconUI id="chevron-left" size="sm" />
        {{ labels.previous }}
      </span>
      <GameNavigationBarGame
        :game="navigation.previous"
        :label="labels.previous"
        variant="floating"
      />
    </NuxtLink>
    <NuxtLink
      v-if="navigation.next"
      :to="`/game/${navigation.next.id}`"
      class="floating-side side-link items-end text-right"
      :style="{ left: `${floating.right}px`, width: `${floating.width}px` }"
      @pointerenter="prefetch(navigation.next)"
      @focus="prefetch(navigation.next)"
    >
      <span class="flex items-center gap-1 font-semibold">
        {{ labels.next }}
        <IconUI id="chevron-right" size="sm" />
      </span>
      <GameNavigationBarGame
        :game="navigation.next"
        :label="labels.next"
        variant="floating"
        end
      />
    </NuxtLink>
  </template>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
import { GAME_NAVIGATION_LIST_LIFETIME_MS } from "~/composables/useGameNavigation";
import type { GameNavigationEntry } from "~/shared/gameNavigation";

const NuxtLink = resolveComponent("NuxtLink");

const props = defineProps<{
  gameId: string;
  /** Whether it's the viewer's own game, so it can fall back to their games by date. */
  ownGame: boolean;
  username: string;
}>();

type Navigation = {
  position: number;
  total: number;
  previous: GameNavigationEntry | null;
  next: GameNavigationEntry | null;
  backTo: string;
  /** Shown after "Game 12 of 48". */
  suffix: string | null;
  /** Where the count goes, for screen readers. */
  label: string;
  dateOrder: "asc" | "desc" | null;
};

const games = useGames();
const list = useGameNavigationList();

const fromList = computed((): Navigation | null => {
  const current = list.value;
  // Lists saved before they had a time, or saved too long ago, don't count.
  if (!current?.savedAt) return null;
  if (Date.now() - current.savedAt > GAME_NAVIGATION_LIST_LIFETIME_MS) return null;
  const index = current.games.findIndex((game) => game.id === props.gameId);
  if (index === -1) return null;
  return {
    position: index + 1,
    total: current.games.length,
    previous: current.games[index - 1] ?? null,
    next: current.games[index + 1] ?? null,
    backTo: current.backTo,
    suffix: current.filtered ? "filtered games" : null,
    label: "Back to the games list",
    dateOrder: current.dateOrder ?? null,
  };
});

type Neighbors = {
  position: number;
  total: number;
  previous: GameNavigationEntry | null;
  next: GameNavigationEntry | null;
};

const byDate = ref<Neighbors | null>(null);
const byDateLoading = ref(false);

const navigation = computed((): Navigation | null => {
  if (fromList.value) return fromList.value;
  if (!byDate.value) return null;
  return {
    ...byDate.value,
    backTo: `/@${props.username}?view=games`,
    suffix: "by date",
    label: "Back to your games",
    dateOrder: "desc",
  };
});

const shown = computed(
  () =>
    (navigation.value && navigation.value.total > 1) ||
    byDateLoading.value
);

// In date order the buttons say which way in time they go: with the newest
// first, the game before this one in the list is a newer game.
const labels = computed(() => {
  // While loading, the by-date list is newest first.
  const order = navigation.value ? navigation.value.dateOrder : "desc";
  if (order === "desc") return { previous: "Newer", next: "Older" };
  if (order === "asc") return { previous: "Older", next: "Newer" };
  return { previous: "Previous", next: "Next" };
});

let requested = false;
async function loadByDate() {
  if (requested || fromList.value || !props.ownGame) return;
  requested = true;
  byDateLoading.value = true;
  try {
    byDate.value =
      (await $fetch<Neighbors | null>(`/api/games/${props.gameId}/neighbors`)) ??
      null;
  } catch {
    byDate.value = null;
  } finally {
    byDateLoading.value = false;
  }
}

// Watched: whether it's your game can only be known once you're signed in.
onMounted(() => watch(() => props.ownGame, loadByDate, { immediate: true }));

// Floating: where the space beside the card (the bar has the card's width
// and place) is wide enough, the sides sit in the middle of it. Measured
// again when the page or the sidebar changes size.
const FLOATING_MIN_SPACE = 150;
const FLOATING_MAX_WIDTH = 200;
const navEl = ref<HTMLElement | null>(null);
const floating = ref<{ left: number; right: number; width: number } | null>(
  null
);

function measureFloating() {
  const nav = navEl.value;
  const parent = nav?.parentElement;
  if (!nav || !parent) {
    floating.value = null;
    return;
  }
  const outer = parent.getBoundingClientRect();
  const inner = nav.getBoundingClientRect();
  const space = inner.left - outer.left;
  if (space < FLOATING_MIN_SPACE) {
    floating.value = null;
    return;
  }
  const width = Math.min(space - 32, FLOATING_MAX_WIDTH);
  floating.value = {
    left: Math.round(outer.left + (space - width) / 2),
    right: Math.round(inner.right + (outer.right - inner.right - width) / 2),
    width: Math.round(width),
  };
}

let resizeObserver: ResizeObserver | null = null;
watch(navEl, (nav) => {
  resizeObserver?.disconnect();
  if (nav?.parentElement && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measureFloating());
    resizeObserver.observe(nav.parentElement);
  }
  measureFloating();
});
onMounted(() => window.addEventListener("resize", measureFloating));
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", measureFloating);
});

// Starts loading the game behind a button before it's clicked, unless it's
// already loaded (as it is when you came from the overview).
function prefetch(game: GameNavigationEntry | null | undefined) {
  if (!game) return;
  if (games.getGame(game.id).status === Status.IDLE) {
    games.fetchGame(game.id);
  }
}
</script>

<style scoped>
.side {
  @apply flex items-center gap-2 min-w-0 max-w-full rounded px-2 py-2 sm:py-1;
}

.side-link,
.count-link {
  @apply rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-dark-primary;
}

.side-link {
  @apply text-stone-700 dark:text-stone-300 hover:text-black dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800;
}

.side-disabled {
  @apply text-stone-400 dark:text-stone-600 cursor-default;
}

.floating-side {
  @apply fixed top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2 p-3 text-sm;
}

.count-link {
  @apply inline-block px-2 py-2 sm:py-1 text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white underline-offset-2 hover:underline;
}
</style>
