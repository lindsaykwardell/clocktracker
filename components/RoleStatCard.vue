<template>
  <div class="relative p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col gap-3 max-w-xs">
    <div class="absolute top-2 right-2">
      <Button
        v-if="showControls"
        @click="emit('deleteCard', card.id)"
        title="Delete role stat card"
        color="contrast"
        icon="x-lg"
        display="icon-only"
        size="xs"
        circular
      >
        Delete role stat card
      </Button>
    </div>

    <h3 
      class="font-sorts text-center"
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
      {{ result.sentence }}
    </p>

    <p
      v-if="result.subtitle"
      class="text-xs text-center text-stone-500 dark:text-stone-400 text-balance"
    >
      {{ result.subtitle }}
    </p>
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
  showControls?: boolean;
  tokenSize?: "md" | "lg"
}>();

const emit = defineEmits(["deleteCard"]);

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

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
</script>
