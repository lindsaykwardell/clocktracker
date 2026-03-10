<template>
  <ForumAdminTemplate title="Mod Log" :has-access="true">

      <Loading v-if="loading" />
      <p v-else-if="logs.length === 0" class="text-center py-8 text-stone-400">
        No mod actions recorded.
      </p>
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="log in logs"
          :key="log.id"
          class="flex items-start gap-3 p-3 rounded border border-stone-300 dark:border-stone-700/50
                 bg-stone-300/40 dark:bg-stone-900/50 text-sm"
        >
          <div class="flex-1">
            <span class="font-semibold">{{ log.actor.display_name }}</span>
            {{ " " }}
            <span class="text-stone-400">{{ actionLabel(log.action) }}</span>
            {{ " " }}
            <nuxt-link
              v-if="log.target.link"
              :to="log.target.link"
              class="text-primary hover:underline"
            >
              {{ log.target.label }}
            </nuxt-link>
            <span v-else class="text-stone-500">{{ log.target.label }}</span>
            <span v-if="log.details" class="text-stone-400 italic"> &mdash; {{ log.details }}</span>
          </div>
          <div class="text-xs text-stone-500 dark:text-stone-400 shrink-0">
            {{ formatDate(log.created_at) }}
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="total > perPage" class="flex justify-center gap-2 mt-4">
          <Button
            v-if="page > 1"
            @click="page--"
            color="secondary"
            size="sm"
          >
            Previous
          </Button>
          <span class="flex items-center text-sm text-stone-500">
            Page {{ page }}
          </span>
          <Button
            v-if="total > page * perPage"
            @click="page++"
            color="secondary"
            size="sm"
          >
            Next
          </Button>
        </div>
      </div>
  </ForumAdminTemplate>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

type ResolvedTarget = {
  label: string;
  link: string | null;
};

type ModLog = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string | null;
  created_at: string;
  actor: { display_name: string };
  target: ResolvedTarget;
};

const logs = ref<ModLog[]>([]);
const total = ref(0);
const perPage = ref(50);
const page = ref(1);
const loading = ref(true);

const ACTION_LABELS: Record<string, string> = {
  PIN_THREAD: "pinned",
  UNPIN_THREAD: "unpinned",
  LOCK_THREAD: "locked",
  UNLOCK_THREAD: "unlocked",
  DELETE_THREAD: "deleted",
  DELETE_POST: "deleted post in",
  BAN_USER: "banned",
  RESOLVE_REPORT: "resolved report",
};

function actionLabel(action: string) {
  return ACTION_LABELS[action] || action.toLowerCase().replace(/_/g, " ");
}

async function fetchLogs() {
  loading.value = true;
  try {
    const data = await $fetch<{ logs: ModLog[]; total: number; perPage: number }>("/api/forum/mod-log", {
      query: { page: page.value },
    });
    logs.value = data.logs;
    total.value = data.total;
    perPage.value = data.perPage;
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

onMounted(fetchLogs);
watch(page, fetchLogs);

useHead({ title: "Mod Log" });
</script>
