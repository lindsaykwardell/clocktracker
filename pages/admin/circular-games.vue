<template>
  <AdminTemplate title="Circular Games" :has-access="canAccess">
    <Loading v-if="loading" />
    <p v-else-if="pairs.length === 0" class="text-center py-8 text-stone-400">
      No circular parent game references detected.
    </p>
    <div v-else class="flex flex-col gap-4">
      <p class="text-sm text-stone-500 dark:text-stone-400">
        Found {{ pairs.length }} circular reference{{ pairs.length === 1 ? "" : "s" }}.
        Each pair has two games pointing to each other as the parent.
      </p>
      <div
        v-for="(pair, idx) in pairs"
        :key="`${pair.gameA.id}-${pair.gameB.id}`"
        class="p-4 rounded border border-stone-300 dark:border-stone-700/50
               bg-stone-300/40 dark:bg-stone-900/50"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <GameCard label="Game A" :game="pair.gameA" />
          <GameCard label="Game B" :game="pair.gameB" />
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            color="primary"
            size="sm"
            :disabled="fixing === idx"
            @click="fix(idx, 'unlink_a')"
          >
            Make B the parent (unlink A)
          </Button>
          <Button
            color="primary"
            size="sm"
            :disabled="fixing === idx"
            @click="fix(idx, 'unlink_b')"
          >
            Make A the parent (unlink B)
          </Button>
          <Button
            color="negative"
            size="sm"
            :disabled="fixing === idx"
            @click="fix(idx, 'unlink_both')"
          >
            Unlink both
          </Button>
        </div>
        <p v-if="pairError[idx]" class="text-sm text-red-500 mt-2">{{ pairError[idx] }}</p>
      </div>
    </div>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();

const canAccess = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

type GameInfo = {
  id: string;
  date: string;
  script: string;
  user_id: string;
  username: string;
  display_name: string;
  is_storyteller: boolean;
  created_at: string | null;
  child_count: number;
};

type CircularPair = {
  gameA: GameInfo;
  gameB: GameInfo;
};

const loading = ref(true);
const pairs = ref<CircularPair[]>([]);
const fixing = ref<number | null>(null);
const pairError = ref<Record<number, string>>({});

async function fetchPairs() {
  loading.value = true;
  try {
    pairs.value = await $fetch<CircularPair[]>("/api/admin/circular-games");
  } catch {
    pairs.value = [];
  } finally {
    loading.value = false;
  }
}

async function fix(idx: number, action: "unlink_a" | "unlink_b" | "unlink_both") {
  const pair = pairs.value[idx];
  if (!pair) return;

  fixing.value = idx;
  pairError.value[idx] = "";

  try {
    await $fetch("/api/admin/circular-games/fix", {
      method: "POST",
      body: {
        gameAId: pair.gameA.id,
        gameBId: pair.gameB.id,
        action,
      },
    });
    pairs.value.splice(idx, 1);
  } catch (err: any) {
    pairError.value[idx] =
      err?.data?.statusMessage || err?.message || "Failed to fix";
  } finally {
    fixing.value = null;
  }
}

function formatDate(date: string | null) {
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
  }).format(new Date(date));
}

onMounted(() => {
  if (canAccess.value) fetchPairs();
});

watch(canAccess, (val) => {
  if (val) fetchPairs();
});

useHead({ title: "Circular Games - Admin" });

// Inline sub-component
const GameCard = defineComponent({
  props: {
    label: { type: String, required: true },
    game: { type: Object as () => GameInfo, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "flex flex-col gap-1" }, [
        h("h3", { class: "font-semibold text-sm text-stone-500 dark:text-stone-400 uppercase" }, props.label),
        h("div", { class: "flex flex-col gap-0.5 text-sm" }, [
          h("div", {}, [
            h(
              resolveComponent("nuxt-link") as any,
              { to: `/@${props.game.username}`, class: "text-primary hover:underline" },
              () => `${props.game.display_name} (@${props.game.username})`
            ),
          ]),
          h("div", {}, `Script: ${props.game.script || "Unknown"}`),
          h("div", {}, `Date: ${formatDate(props.game.date)}`),
          h("div", {}, `Storyteller: ${props.game.is_storyteller ? "Yes" : "No"}`),
          h("div", {}, `Child games: ${props.game.child_count}`),
          h("div", { class: "text-xs text-stone-400" }, [
            h(
              resolveComponent("nuxt-link") as any,
              { to: `/game/${props.game.id}`, class: "hover:underline" },
              () => props.game.id
            ),
          ]),
        ]),
      ]);
  },
});
</script>
