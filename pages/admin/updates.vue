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

    <section
      v-if="canManageUpdates"
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50 mb-6"
    >
      <form class="flex flex-col gap-3" @submit.prevent="fillForUser(false)">
        <div>
          <h3 class="font-semibold">Fill grimoire events for a user</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Generates events for that user's games that never had them, the
            same way the background fill does. Events are only added, and games
            already saved in the editor are left alone. Runs for up to about
            25 seconds; run it again if games remain. A dry run looks at up to
            300 games without saving anything.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <Input
            v-model="fillUsername"
            placeholder="Username"
            class="flex-1"
          />
          <Button
            type="button"
            color="neutral"
            variant="soft"
            size="sm"
            :disabled="!fillUsername.trim() || filling"
            @click="fillForUser(true)"
          >
            Dry Run
          </Button>
          <Button
            type="submit"
            color="primary"
            size="sm"
            :disabled="!fillUsername.trim() || filling"
          >
            {{ filling ? "Running..." : "Run" }}
          </Button>
        </div>
        <div v-if="fillError" class="text-sm text-red-500">
          {{ fillError }}
        </div>
        <div v-if="fillResult" class="text-sm">
          <p :class="fillResult.remaining > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'">
            {{ fillSummary }}
          </p>
          <details class="mt-1">
            <summary class="cursor-pointer text-stone-500">Details</summary>
            <pre class="mt-2 p-3 rounded bg-stone-900/90 text-stone-100 overflow-auto">{{ JSON.stringify(fillResult, null, 2) }}</pre>
          </details>
        </div>
      </form>
    </section>

    <section
      v-if="canManageUpdates"
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50 mb-6"
    >
      <form class="flex flex-col gap-3" @submit.prevent="catchUpForUser(false)">
        <div>
          <h3 class="font-semibold">Catch up new reminder rules for a user</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Adds the events of reminder rules added after that user's games
            already had events, the same way the background catch-up does.
            Only those rules' events are added; nothing else is changed. Each
            catch-up runs once per game. Runs for up to about 25 seconds; run
            it again if games remain. A dry run looks at up to 300 games
            without saving anything.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <Input
            v-model="catchUpUsername"
            placeholder="Username"
            class="flex-1"
          />
          <Button
            type="button"
            color="neutral"
            variant="soft"
            size="sm"
            :disabled="!catchUpUsername.trim() || catchingUp"
            @click="catchUpForUser(true)"
          >
            Dry Run
          </Button>
          <Button
            type="submit"
            color="primary"
            size="sm"
            :disabled="!catchUpUsername.trim() || catchingUp"
          >
            {{ catchingUp ? "Running..." : "Run" }}
          </Button>
        </div>
        <div v-if="catchUpError" class="text-sm text-red-500">
          {{ catchUpError }}
        </div>
        <div v-if="catchUpResult" class="text-sm">
          <p :class="catchUpResult.remaining > 0 ? 'text-primary' : 'text-green-600 dark:text-green-400'">
            {{ catchUpSummary }}
          </p>
          <details class="mt-1">
            <summary class="cursor-pointer text-stone-500">Details</summary>
            <pre class="mt-2 p-3 rounded bg-stone-900/90 text-stone-100 overflow-auto">{{ JSON.stringify(catchUpResult, null, 2) }}</pre>
          </details>
        </div>
      </form>
    </section>

    <Loading v-if="loading && updates.length === 0" />

    <Alert v-else-if="loadError" color="negative" class="mb-4">
      {{ loadError }}
    </Alert>

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
const loadError = ref("");
const runningById = ref<Record<string, boolean>>({});
const errorsById = ref<Record<string, string>>({});
const messagesById = ref<Record<string, string>>({});
let pollHandle: ReturnType<typeof setInterval> | null = null;

const canManageUpdates = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("MANAGE_APP_TOOLS");
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
  loadError.value = "";
  try {
    updates.value = await $fetch<AppUpdateRow[]>("/api/admin/updates");
    const hasRunning =
      updates.value.some((u) => u.status === "RUNNING") ||
      Object.values(runningById.value).some(Boolean);
    if (hasRunning) ensurePolling();
    else stopPolling();
  } catch (error: any) {
    loadError.value =
      error?.data?.statusMessage || error?.message || "Failed to load updates.";
    if (isInitialLoad) {
      updates.value = [];
    }
    stopPolling();
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

type GrimoireEventsFillResponse = {
  username: string;
  dryRun: boolean;
  examined: number;
  filled: number;
  eventsCreated: number;
  noEvents: number;
  alreadyHadEvents: number;
  seatPagesRepaired?: number;
  seatPagesUnrepaired?: number;
  skippedSeatMovingScript?: number;
  failed: number;
  remaining: number;
  [key: string]: unknown;
};

const fillUsername = ref("");
const filling = ref(false);
const fillError = ref("");
const fillResult = ref<GrimoireEventsFillResponse | null>(null);

const fillSummary = computed(() => {
  const r = fillResult.value;
  if (!r) return "";
  const games = (n: number) => `${n} game${n === 1 ? "" : "s"}`;
  const pages = (n: number) => `${n} page${n === 1 ? "" : "s"}`;
  // Broken seat numbers (a seat twice, one missing): repaired, or left for a person.
  const seats = (would: boolean) => {
    const repaired = r.seatPagesRepaired ?? 0;
    const unrepaired = r.seatPagesUnrepaired ?? 0;
    if (!repaired && !unrepaired) return "";
    return (
      ` Seat numbers: ${pages(repaired)} ${would ? "would be " : ""}repaired` +
      (unrepaired ? `, ${pages(unrepaired)} left as they are (see server log).` : ".")
    );
  };
  // Musical Chairs games get no events, only marked as done.
  const skipped = (would: boolean) => {
    const n = r.skippedSeatMovingScript ?? 0;
    return n ? ` Musical Chairs: ${games(n)} ${would ? "would be " : ""}skipped (no events).` : "";
  };
  if (r.dryRun) {
    return (
      `Dry run for ${r.username}: looked at ${games(r.examined)} of ` +
      `${games(r.remaining)} never generated. ${r.filled} would get ` +
      `${r.eventsCreated} events, ${r.noEvents} have none to add, ` +
      `${r.alreadyHadEvents} already have events.` +
      seats(true) +
      skipped(true)
    );
  }
  const parts = [
    `${r.username}: ${games(r.examined)} processed, ` +
      `${r.eventsCreated} events added to ${games(r.filled)}`,
    `${r.noEvents} had none to add`,
    `${r.alreadyHadEvents} already had events`,
  ];
  if (r.failed) parts.push(`${r.failed} failed (see server log)`);
  return (
    parts.join(", ") +
    ". " +
    (r.remaining > 0 ? `${games(r.remaining)} left; run again.` : "All done.") +
    seats(false) +
    skipped(false)
  );
});

async function fillForUser(dryRun: boolean) {
  const username = fillUsername.value.trim();
  if (!username || filling.value) return;
  filling.value = true;
  fillError.value = "";
  fillResult.value = null;
  try {
    fillResult.value = await $fetch<GrimoireEventsFillResponse>(
      "/api/admin/grimoire-events-fill",
      { method: "POST", body: { username, dryRun } }
    );
  } catch (error: any) {
    fillError.value =
      error?.data?.statusMessage || error?.message || "Fill failed";
  } finally {
    filling.value = false;
  }
}

type GrimoireEventsCatchUpResponse = {
  username: string;
  dryRun: boolean;
  examined: number;
  gamesWithNewEvents: number;
  eventsCreated: number;
  skippedConcurrentSave: number;
  failed: number;
  remaining: number;
  [key: string]: unknown;
};

const catchUpUsername = ref("");
const catchingUp = ref(false);
const catchUpError = ref("");
const catchUpResult = ref<GrimoireEventsCatchUpResponse | null>(null);

const catchUpSummary = computed(() => {
  const r = catchUpResult.value;
  if (!r) return "";
  const games = (n: number) => `${n} game${n === 1 ? "" : "s"}`;
  if (r.dryRun) {
    return (
      `Dry run for ${r.username}: looked at ${games(r.examined)} of ` +
      `${games(r.remaining)} behind. ${r.gamesWithNewEvents} would get ` +
      `${r.eventsCreated} events.`
    );
  }
  const parts = [
    `${r.username}: ${games(r.examined)} caught up, ` +
      `${r.eventsCreated} events added to ${games(r.gamesWithNewEvents)}`,
  ];
  if (r.skippedConcurrentSave) parts.push(`${r.skippedConcurrentSave} saved meanwhile`);
  if (r.failed) parts.push(`${r.failed} failed (see server log)`);
  return (
    parts.join(", ") +
    ". " +
    (r.remaining > 0 ? `${games(r.remaining)} left; run again.` : "All done.")
  );
});

async function catchUpForUser(dryRun: boolean) {
  const username = catchUpUsername.value.trim();
  if (!username || catchingUp.value) return;
  catchingUp.value = true;
  catchUpError.value = "";
  catchUpResult.value = null;
  try {
    catchUpResult.value = await $fetch<GrimoireEventsCatchUpResponse>(
      "/api/admin/grimoire-events-catch-up",
      { method: "POST", body: { username, dryRun } }
    );
  } catch (error: any) {
    catchUpError.value =
      error?.data?.statusMessage || error?.message || "Catch-up failed";
  } finally {
    catchingUp.value = false;
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
