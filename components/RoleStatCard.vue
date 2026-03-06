<template>
  <div class="relative p-4 pt-6 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-3 max-w-xs">
    <Button
      v-if="showFavoriteControl"
      @click="emit('toggleFavorite')"
      :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
      variant="link"
      color="contrast"
      icon="star"
      :iconColor="isFavorite ? 'primary' : ''"
      display="icon-only"
      size="md"
      class="absolute top-1 right-1"
    >
      {{ isFavorite ? "Remove from favorites" : "Add to favorites" }}
    </Button>

    <h3 
      class="font-sorts text-center text-balance"
      :class="tokenSize == 'md' ? '' : 'text-lg lg:text-xl'"
    >
      {{ titleCase(result.metricLabel) }}
    </h3>

    <div class="flex flex-col items-center gap-3">
      <nuxt-link v-if="roleLink" :to="roleLink">
        <Token
          :character="character"
          :size="tokenSize ?? 'lg'"
        />
      </nuxt-link>
    </div>

    <p class="text-sm text-center text-balance">
      {{ sentenceWithAtLeast }}
    </p>

    <p
      v-if="result.subtitle"
      class="text-xs text-center text-stone-500 dark:text-stone-400 text-balance"
    >
      {{ result.subtitle }}
    </p>

    <div
      v-if="showZeroOverlay && result.count === 0"
      class="absolute inset-0 rounded-lg bg-stone-900/25 dark:bg-black/35 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import type { GameRecord } from "~/composables/useGames";
import type { RoleStatCardRecord } from "~/composables/useRoleStatCards";
import { buildRoleStatCardResult } from "~/composables/useRoleStatCards";

const props = defineProps<{
  card: RoleStatCardRecord & {
    preview?: {
      count: number;
      metricLabel: string;
      sentence: string;
      subtitle?: string | null;
      displayRole?: {
        id: string;
        name: string;
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      } | null;
    };
  };
  games: GameRecord[];
  isMe: boolean;
  username?: string;
  showFavoriteControl?: boolean;
  isFavorite?: boolean;
  showZeroOverlay?: boolean;
  tokenSize?: "md" | "lg";
}>();

const emit = defineEmits(["toggleFavorite"]);

const result = computed(() => {
  if (props.card.preview) return props.card.preview;
  return buildRoleStatCardResult(
    props.card,
    props.games,
    props.isMe,
    props.username
  );
});

const character = computed(() => {
  const role = props.card.role ?? result.value.displayRole;
  if (!role) return null;

  return {
    name: role.name,
    alignment: role.initial_alignment,
    role: {
      id: role.id,
      name: role.name,
      token_url: role.token_url,
      type: role.type,
      initial_alignment: role.initial_alignment,
    },
  };
});

const roleLink = computed(() => {
  const role = props.card.role ?? result.value.displayRole;
  if (!role?.name) return null;
  return `/roles/${role.name.toLowerCase().replace(/ /g, "_")}`;
});

const sentenceWithAtLeast = computed(() => {
  if (result.value.count === 0) {
    if (!shouldUseUnknownForZero.value) {
      return result.value.sentence;
    }

    return replaceStandaloneCount(
      result.value.sentence,
      "0",
      "an unknown number of"
    );
  }

  return withAtLeast(result.value.sentence, result.value.count);
});

const hasEverBeenRole = computed(() => {
  if (!props.username || !props.card.role_id) return false;

  for (const game of props.games) {
    for (const page of game.grimoire) {
      for (const token of page.tokens) {
        if (
          token.player?.username === props.username &&
          token.role_id === props.card.role_id
        ) {
          return true;
        }
      }
    }
  }

  return false;
});

const shouldUseUnknownForZero = computed(() => {
  if (!props.card.role_id) return true;
  if (props.card.storyteller_only) return true;
  return hasEverBeenRole.value;
});

function withAtLeast(sentence: string, count: number) {
  const target = String(count);
  if (!target.length || sentence.includes(`at least ${target}`)) {
    return sentence;
  }

  return replaceStandaloneCount(sentence, target, `at least ${target}`);
}

function replaceStandaloneCount(
  sentence: string,
  target: string,
  replacement: string
) {
  let idx = sentence.lastIndexOf(target);
  while (idx !== -1) {
    const before = idx === 0 ? "" : sentence[idx - 1];
    const after = idx + target.length >= sentence.length ? "" : sentence[idx + target.length];
    const isDigitBoundary = !/\d/.test(before) && !/\d/.test(after);

    if (isDigitBoundary) {
      return `${sentence.slice(0, idx)}${replacement}${sentence.slice(idx + target.length)}`;
    }

    idx = sentence.lastIndexOf(target, idx - 1);
  }

  return sentence;
}

function titleCase(value: string) {
  const lowerWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "in",
    "nor",
    "of",
    "on",
    "or",
    "per",
    "the",
    "to",
    "via",
  ]);

  const words = value.split(/\s+/);

  return words
    .map((word, index) => {
      const cleaned = word.toLowerCase();
      const isEdgeWord = index === 0 || index === words.length - 1;

      if (!isEdgeWord && lowerWords.has(cleaned)) {
        return cleaned;
      }

      return cleaned.replace(/(^|[\-\/])([a-z])/g, (_, prefix, char) => {
        return `${prefix}${char.toUpperCase()}`;
      });
    })
    .join(" ");
}
</script>
