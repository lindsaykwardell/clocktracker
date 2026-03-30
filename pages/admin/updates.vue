<template>
  <AdminTemplate title="Updates" :has-access="canManageUpdates">
    <section
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50 mb-6"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="font-semibold text-lg">Application Updates</h2>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Run one-off batched data updates safely (dry run, resume, force rerun).
          </p>
        </div>
        <Button
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="loading || refreshing"
          @click="fetchUpdates"
        >
          {{ refreshing ? "Refreshing..." : "Refresh" }}
        </Button>
      </div>
    </section>

    <Loading v-if="loading && updates.length === 0" />

    <div v-else-if="updates.length === 0" class="text-center py-8 text-stone-500">
      No updates registered.
    </div>

    <div v-else class="flex flex-col gap-4">
      <section
        v-for="update in updates"
        :key="update.id"
        class="p-4 rounded border border-stone-300 dark:border-stone-700/50
               bg-stone-300/40 dark:bg-stone-900/50"
      >
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <h3 class="font-semibold">{{ update.id }}</h3>
            <p class="text-sm text-stone-500 dark:text-stone-400">
              {{ update.description }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2 text-sm">
            <Badge :color="statusColor(update.status)">
              {{ update.status }}
            </Badge>
            <span v-if="update.started_at" class="text-stone-500">
              Started: {{ formatDate(update.started_at) }}
            </span>
            <span v-if="update.finished_at" class="text-stone-500">
              Finished: {{ formatDate(update.finished_at) }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              color="neutral"
              variant="soft"
              size="sm"
              :disabled="!!runningById[update.id]"
              @click="runUpdate(update.id, { dryRun: true })"
            >
              Dry Run
            </Button>
            <Button
              color="primary"
              size="sm"
              :disabled="!!runningById[update.id]"
              @click="runUpdate(update.id)"
            >
              Run
            </Button>
            <Button
              color="caution"
              variant="soft"
              size="sm"
              :disabled="!!runningById[update.id]"
              @click="runUpdate(update.id, { force: true })"
            >
              Force Rerun
            </Button>
          </div>

          <div v-if="runningById[update.id] || update.status === 'RUNNING'" class="text-sm text-primary">
            {{ runningLabel(update) }}
          </div>

          <div v-if="errorsById[update.id]" class="text-sm text-red-500">
            {{ errorsById[update.id] }}
          </div>

          <div v-if="messagesById[update.id]" class="text-sm text-green-600 dark:text-green-400">
            {{ messagesById[update.id] }}
          </div>

          <div v-if="update.error" class="text-sm text-red-500">
            Last error: {{ update.error }}
          </div>

          <details v-if="update.stats" class="text-sm">
            <summary class="cursor-pointer text-stone-500">Stats</summary>
            <pre class="mt-2 p-3 rounded bg-stone-900/90 text-stone-100 overflow-auto">{{ JSON.stringify(update.stats, null, 2) }}</pre>
          </details>
        </div>
      </section>
    </div>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

type AppUpdateRow = {
  id: string;
  description: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  cursor: string | null;
  stats: Record<string, unknown> | null;
  error: string | null;
};

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const updates = ref<AppUpdateRow[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const runningById = ref<Record<string, boolean>>({});
const errorsById = ref<Record<string, string>>({});
const messagesById = ref<Record<string, string>>({});
let pollHandle: ReturnType<typeof setInterval> | null = null;

const canManageUpdates = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("EXPORT_USER_DATA");
});

function statusColor(status: string) {
  if (status === "SUCCESS") return "positive";
  if (status === "FAILED") return "negative";
  if (status === "RUNNING") return "caution";
  return "neutral";
}

function formatDate(input: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(input));
}

function runningLabel(update: AppUpdateRow) {
  const stats = update.stats || {};
  const processed = Number(stats.processed ?? 0);
  const total = Number(stats.total_to_process ?? 0);
  if (total > 0) return `Running... (${processed} of ${total})`;
  if (processed > 0) return `Running... (${processed} processed)`;
  return "Running...";
}

function ensurePolling() {
  if (pollHandle) return;
  pollHandle = setInterval(() => {
    fetchUpdates().catch(() => {});
  }, 2000);
}

function stopPolling() {
  if (!pollHandle) return;
  clearInterval(pollHandle);
  pollHandle = null;
}

async function fetchUpdates() {
  if (!canManageUpdates.value) return;
  const isInitialLoad = updates.value.length === 0;
  if (isInitialLoad) loading.value = true;
  else refreshing.value = true;
  try {
    updates.value = await $fetch<AppUpdateRow[]>("/api/admin/updates");
    const hasRunning =
      updates.value.some((u) => u.status === "RUNNING") ||
      Object.values(runningById.value).some(Boolean);
    if (hasRunning) ensurePolling();
    else stopPolling();
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
}

async function runUpdate(
  id: string,
  options?: { dryRun?: boolean; force?: boolean }
) {
  runningById.value[id] = true;
  ensurePolling();
  errorsById.value[id] = "";
  messagesById.value[id] = "";
  try {
    const result = await $fetch<{ message: string }>("/api/admin/updates/run", {
      method: "POST",
      body: {
        id,
        dryRun: !!options?.dryRun,
        force: !!options?.force,
      },
    });
    messagesById.value[id] = result.message || "Update executed";
    await fetchUpdates();
  } catch (error: any) {
    errorsById.value[id] =
      error?.data?.statusMessage || error?.message || "Update failed";
    await fetchUpdates();
  } finally {
    runningById.value[id] = false;
    const anyRunning = Object.values(runningById.value).some(Boolean);
    if (!anyRunning && !updates.value.some((u) => u.status === "RUNNING")) {
      stopPolling();
    }
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}

  await fetchUpdates();
});

onBeforeUnmount(() => {
  stopPolling();
});

useHead({ title: "Updates - Admin" });
</script>
