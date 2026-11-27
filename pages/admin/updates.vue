<template>
  <AdminTemplate title="Updates" :has-access="canManageUpdates">
    <section
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50 mb-6"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="font-semibold text-lg">Background jobs</h2>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Jobs that update older data a batch at a time, every five minutes.
            Each one is switched off, to a dry run or on with its environment
            variable; a dry run only writes to the server log.
          </p>
        </div>
        <Button
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="loading || refreshing"
          @click="fetchStatus"
        >
          {{ refreshing ? "Refreshing..." : "Refresh" }}
        </Button>
      </div>

      <Loading v-if="loading && !status" class="mt-4" />

      <Alert v-else-if="loadError" color="negative" class="mt-4">
        {{ loadError }}
      </Alert>

      <template v-else-if="status">
        <Alert v-if="status.staging" color="caution" class="mt-4">
          This is staging, where background jobs never run, whatever their
          setting. Use the tools below to try them on one user's games.
        </Alert>

        <div class="mt-4 flex flex-col divide-y divide-stone-300/70 dark:divide-stone-700/70">
          <div
            v-for="job in status.jobs"
            :key="job.id"
            class="py-3 first:pt-0 last:pb-0 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div class="flex flex-col gap-0.5">
              <h3 class="font-semibold">{{ jobLabels[job.id]?.title ?? job.id }}</h3>
              <p class="text-sm text-stone-600 dark:text-stone-400">
                {{ jobLabels[job.id]?.description }}
              </p>
              <p class="text-xs text-stone-600 dark:text-stone-400">
                Setting: <code>{{ job.setting }}</code>
              </p>
            </div>
            <div class="flex flex-col gap-1 sm:items-end shrink-0">
              <div class="flex flex-wrap gap-2 items-center">
                <Badge v-if="job.running" color="primary" size="sm">Running</Badge>
                <Badge :color="modeColor(job.mode)" size="sm">
                  {{ modeLabel(job.mode) }}
                </Badge>
              </div>
              <span
                class="text-sm"
                :class="job.remaining > 0 ? '' : 'text-green-700 dark:text-green-400'"
              >
                {{ remainingLabel(job) }}
              </span>
              <span v-if="job.waitingForFill" class="text-xs text-stone-600 dark:text-stone-400">
                Starts when the events fill is done
              </span>
            </div>
          </div>
        </div>
      </template>
    </section>

    <section
      v-if="canManageUpdates"
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50 mb-6"
    >
      <form class="flex flex-col gap-3" @submit.prevent="fillForUser(false)">
        <div>
          <h3 class="font-semibold">Fill grimoire events for a user</h3>
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Generates events for that user's games that never had them, the
            same way the background fill does. Events are only added, and games
            already saved in the editor are left alone. Runs for up to about
            25 seconds; run it again if games remain. A dry run looks at up to
            300 games without saving anything.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <AdminUserSearch
            v-model="fillUsername"
            placeholder="Search users by name or username..."
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
        <div v-if="fillError" class="text-sm text-red-700 dark:text-red-400">
          {{ fillError }}
        </div>
        <div v-if="fillResult" class="text-sm">
          <p :class="fillResult.remaining > 0 ? 'text-primary' : 'text-green-700 dark:text-green-400'">
            {{ fillSummary }}
          </p>
          <details class="mt-1">
            <summary class="cursor-pointer text-stone-600 dark:text-stone-400">Details</summary>
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
          <p class="text-sm text-stone-600 dark:text-stone-400">
            Adds the events of reminder rules added after that user's games
            already had events, the same way the background catch-up does.
            Only those rules' events are added; nothing else is changed. Each
            catch-up runs once per game. Runs for up to about 25 seconds; run
            it again if games remain. A dry run looks at up to 300 games
            without saving anything.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <AdminUserSearch
            v-model="catchUpUsername"
            placeholder="Search users by name or username..."
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
        <div v-if="catchUpError" class="text-sm text-red-700 dark:text-red-400">
          {{ catchUpError }}
        </div>
        <div v-if="catchUpResult" class="text-sm">
          <p :class="catchUpResult.remaining > 0 ? 'text-primary' : 'text-green-700 dark:text-green-400'">
            {{ catchUpSummary }}
          </p>
          <details class="mt-1">
            <summary class="cursor-pointer text-stone-600 dark:text-stone-400">Details</summary>
            <pre class="mt-2 p-3 rounded bg-stone-900/90 text-stone-100 overflow-auto">{{ JSON.stringify(catchUpResult, null, 2) }}</pre>
          </details>
        </div>
      </form>
    </section>

  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

type JobMode = "off" | "dry-run" | "on";

type BackgroundJob = {
  id: string;
  setting: string;
  mode: JobMode;
  remaining: number;
  unit: "games" | "reminders";
  running: boolean;
  waitingForFill?: boolean;
};

type BackgroundJobsStatus = {
  staging: boolean;
  jobs: BackgroundJob[];
};

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const status = ref<BackgroundJobsStatus | null>(null);
const loading = ref(false);
const refreshing = ref(false);
const loadError = ref("");

const canManageUpdates = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("MANAGE_APP_TOOLS");
});

const jobLabels: Record<string, { title: string; description: string }> = {
  grimoire_events_fill: {
    title: "Grimoire events fill",
    description: "Generates events for games recorded before grimoire events existed.",
  },
  grimoire_events_catch_up: {
    title: "Reminder rule catch-up",
    description: "Adds the events of reminder rules added after a game already had events.",
  },
  reminder_links_fill: {
    title: "Reminder links",
    description: "Links reminders saved before the reminder catalogue existed to their catalogue entry.",
  },
};

function modeLabel(mode: JobMode) {
  if (mode === "on") return "On";
  if (mode === "dry-run") return "Dry run";
  return "Off";
}

function modeColor(mode: JobMode) {
  if (mode === "on") return "positive";
  if (mode === "dry-run") return "caution";
  return "neutral";
}

function remainingLabel(job: BackgroundJob) {
  if (job.remaining === 0) return `No ${job.unit} left`;
  const count = new Intl.NumberFormat(navigator.language).format(job.remaining);
  const unit = job.remaining === 1 ? job.unit.slice(0, -1) : job.unit;
  return `${count} ${unit} left`;
}

async function fetchStatus() {
  if (!canManageUpdates.value) return;
  if (status.value) refreshing.value = true;
  else loading.value = true;
  loadError.value = "";
  try {
    status.value = await $fetch<BackgroundJobsStatus>("/api/admin/background-jobs");
  } catch (error: any) {
    loadError.value =
      error?.data?.statusMessage || error?.message || "Failed to load the background jobs.";
  } finally {
    loading.value = false;
    refreshing.value = false;
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
    if (!dryRun) fetchStatus();
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
    if (!dryRun) fetchStatus();
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

  await fetchStatus();
});

useHead({ title: "Updates - Admin" });
</script>
