<template>
  <li 
    class="relative flex gap-3 rounded-lg bg-stone-300/30 dark:bg-stone-900/40"
    :class="{
      'flex-col p-4 pt-6' : variant == 'vertical',
      'items-center p-3 pr-8' : variant == 'horizontal',
      'border dark:border-stone-700/50' : !isFavorite,
      'border border-primary' : isFavorite,
      'is-hidden-card': isConfiguredAsHidden,
    }"
    >
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
      class="absolute"
      :class="{
        'top-1 right-1' : variant == 'vertical',
        'top-2 right-2' : variant == 'horizontal',
      }"
    >
      {{ isFavorite ? "Remove from favorites" : "Add to favorites" }}
    </Button>

    <template v-if="variant == 'vertical'">
      <h3 
        class="font-sorts text-center text-balance text-lg lg:text-xl"
      >
        {{ result.metricLabel }}
      </h3>
    </template>

    <div 
      class="flex flex-col items-center gap-3"
      :class="variant == 'horizontal' ? 'card-token' : ''"
    >
      <Token
        :character="character"
        :size="variant == 'horizontal' ? 'md' : 'lg'"
      />
    </div>

    <div 
      class="flex flex-col"
      :class="variant == 'vertical' ? 'text-center gap-3' : ''"
    >
      <template v-if="variant == 'horizontal'">
        <h3 
          class="font-sorts text-balance lg:text-lg"
        >
          {{ result.metricLabel }}
        </h3>
      </template>

      <p 
        class="text-sm"
        :class="variant == 'vertical' ? 'text-balance' : 'text-pretty'"
      >
        {{ result.sentence }}
      </p>

      <p
        v-if="result.subtitle"
        class="text-xs text-stone-500 dark:text-stone-400"
        :class="variant == 'vertical' ? 'text-balance' : 'text-pretty'"
      >
        {{ result.subtitle }}
      </p>

      <p
        v-if="result.debugGameLinks?.length"
        class="text-xs text-stone-500 dark:text-stone-400"
      >
        Counted games:
        <NuxtLink
          v-for="(gameLink, index) in result.debugGameLinks"
          :key="gameLink.id"
          :to="gameLink.href"
          class="underline"
        >
          {{ index === 0 ? "" : ", " }}link
        </NuxtLink>
      </p>
    </div>

    <div
      v-if="showZeroOverlay && result.count === 0"
      class="absolute inset-0 rounded-lg bg-neutral-300/20 dark:bg-stone-900/50 pointer-events-none"
    />
  </li>
</template>

<script setup lang="ts">
import type { GameRecord } from "~/composables/useGames";
import type { RoleStatCardRecord } from "~/composables/useRoleStatCards";
import {
  buildRoleStatCardResult,
  getRoleStatCardDefinition,
} from "~/composables/useRoleStatCards";

const props = withDefaults(
  defineProps<{
    card: RoleStatCardRecord & {
      preview?: {
        count: number;
        metricLabel: string;
        sentence: string;
        subtitle?: string | null;
        isHiddenLocked?: boolean;
        debugGameLinks?: Array<{
          id: number;
          href: string;
        }>;
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
    variant?: "vertical" | "horizontal";
}>(),
  { 
    variant:"vertical",
  }
);

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

const isConfiguredAsHidden = computed(() => {
  const definition = getRoleStatCardDefinition(props.card.metric_key);
  return !!definition?.hidden;
});

const character = computed(() => {
  if (result.value.isHiddenLocked) {
    return {
      name: "",
      role: {
        id: "",
        name: "",
        token_url: "",
        type: "",
        initial_alignment: "NEUTRAL" as const,
      },
    };
  }

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

</script>

<style>
  .card-token > .token {
    inline-size: 5.5rem;
    block-size: 5.5rem;
  }

  .is-hidden-card {
    background: repeating-linear-gradient(
      -55deg,
      theme(colors.stone.50),
      theme(colors.stone.50) 10px,
      theme(colors.stone.100) 10px,
      theme(colors.stone.100) 20px
    );
  }
</style>
