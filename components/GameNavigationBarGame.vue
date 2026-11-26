<template>
  <!-- What one side of the Newer/Older navigation shows about the game it
       goes to: the script and the character (in its team's colour, as in
       the game header) in the title font, and the date. Only the script gets
       cut off when it's too long.

       variant "bar" (below the game card):
         from sm:   Newer | Pies Baking as Imp      (mirrored for Older)
                          | Oct 25, 2026
         phones:    Pies Baking
                    Newer
       variant "floating" (beside the card, under its "‹ Newer" row):
         a line, then the script and character (wrapping) and the date.

       Without a game only the direction shows, unless reserveSpace keeps
       the game's height (while the navigation loads). -->
  <span v-if="variant === 'floating'" class="flex flex-col gap-0.5 min-w-0 w-full border-t border-stone-300 dark:border-stone-700 pt-2">
    <template v-if="game">
      <span class="font-sorts text-base leading-5 break-words">
        {{ game.script || "Unknown Script" }}<template v-if="game.character">
          as <span :class="alignmentClass">{{ game.character }}</span>
        </template>
      </span>
      <span class="text-xs leading-4 tabular-nums text-stone-600 dark:text-stone-400">
        {{ formattedDate }}
      </span>
    </template>
  </span>

  <span v-else class="flex min-w-0 max-w-full">
    <!-- From sm. On phones it's still there for screen readers. -->
    <span
      class="sr-only sm:not-sr-only sm:flex items-center gap-2 min-w-0 max-w-full"
      :class="{ 'flex-row-reverse': end }"
    >
      <span class="font-semibold shrink-0">{{ label }}</span>
      <span
        v-if="game || reserveSpace"
        class="flex flex-col min-w-0 border-stone-300 dark:border-stone-700"
        :class="[
          // sm: padding, because sm:not-sr-only resets padding as well.
          end ? 'items-end text-right border-r sm:pr-3' : 'items-start border-l sm:pl-3',
          { invisible: !game },
        ]"
      >
        <span class="flex font-sorts text-base leading-5 min-w-0 max-w-full">
          <template v-if="game">
            <span class="truncate">{{ game.script || "Unknown Script" }}</span>
            <!-- A non-breaking space before "as": not-sr-only resets
                 white-space, which would drop a plain leading one. -->
            <span v-if="game.character" class="shrink-0">
              {{ " as " }}<span :class="alignmentClass">{{ game.character }}</span>
            </span>
          </template>
          <template v-else>&nbsp;</template>
        </span>
        <span class="text-xs leading-4 tabular-nums text-stone-600 dark:text-stone-400">
          <template v-if="game">{{ formattedDate }}</template>
          <template v-else>&nbsp;</template>
        </span>
      </span>
    </span>

    <!-- Phones: the script, with the direction small under it. -->
    <span
      class="sm:hidden flex flex-col min-w-0 max-w-full"
      :class="end ? 'items-end text-right' : 'items-start'"
      aria-hidden="true"
    >
      <span
        v-if="game || reserveSpace"
        class="font-sorts text-base leading-5 truncate max-w-full"
        :class="{ invisible: !game }"
      >
        {{ game ? game.script || "Unknown Script" : " " }}
      </span>
      <span class="text-xs leading-4" :class="{ 'font-semibold': !game }">{{ label }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import type { GameNavigationEntry } from "~/shared/gameNavigation";

const props = withDefaults(
  defineProps<{
    game: GameNavigationEntry | null;
    /** Older, Newer, Previous or Next. */
    label: string;
    /** The right-hand side: mirrored. */
    end?: boolean;
    /** Keep the game's height without a game (while the navigation loads). */
    reserveSpace?: boolean;
    variant?: "bar" | "floating";
  }>(),
  { variant: "bar" }
);

const alignmentClass = computed(() => ({
  "text-blue-800 dark:text-blue-400": props.game?.alignment === "GOOD",
  "text-red-800 dark:text-red-400": props.game?.alignment === "EVIL",
}));

const formattedDate = computed(() =>
  props.game
    ? new Intl.DateTimeFormat(import.meta.client ? navigator.language : undefined, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(new Date(props.game.date))
    : ""
);
</script>
