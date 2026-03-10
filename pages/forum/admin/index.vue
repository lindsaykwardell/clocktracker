<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
      <nuxt-link
        to="/forum"
        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
      >
        &larr; Discussions
      </nuxt-link>
      <h1 class="font-sorts text-2xl lg:text-3xl mt-2 mb-6">
        Discussions Administration
      </h1>

      <template v-if="!canAccessAdmin">
        <p class="text-center py-8 text-stone-400">
          You do not have permission to access this page.
        </p>
      </template>

      <template v-else>
        <!-- Navigation -->
        <div class="flex flex-wrap gap-2 mb-8">
          <nuxt-link v-if="isAdminUser" to="/forum/admin/categories">
            <Button color="secondary" size="sm" icon="grid">Categories</Button>
          </nuxt-link>
          <nuxt-link v-if="isAdminUser" to="/forum/admin/groups">
            <Button color="secondary" size="sm" icon="players">User Groups</Button>
          </nuxt-link>
          <nuxt-link v-if="canManageBans" to="/forum/admin/bans">
            <Button color="secondary" size="sm" icon="disabled">Banned Users</Button>
          </nuxt-link>
          <nuxt-link to="/forum/admin/reports">
            <Button color="secondary" size="sm" icon="exclamation-circle">All Reports</Button>
          </nuxt-link>
          <nuxt-link to="/forum/admin/mod-log">
            <Button color="secondary" size="sm" icon="book">Full Mod Log</Button>
          </nuxt-link>
        </div>

        <div class="flex flex-col gap-8">
          <!-- Open Reports -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-sorts text-xl">Open Reports</h2>
              <nuxt-link to="/forum/admin/reports" class="text-sm text-primary hover:underline">
                View all &rarr;
              </nuxt-link>
            </div>

            <Loading v-if="reportsLoading" />
            <p v-else-if="reports.length === 0" class="text-center py-4 text-stone-400">
              No open reports.
            </p>
            <div v-else class="flex flex-col gap-3">
              <ForumReportCard
                v-for="report in reports"
                :key="report.id"
                :report="report"
                @resolve="resolveReport"
                @deleted="onDeleted"
                @edited="onEdited"
              />
            </div>
          </section>

          <!-- Recent Mod Actions -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-sorts text-xl">Recent Mod Actions</h2>
              <nuxt-link to="/forum/admin/mod-log" class="text-sm text-primary hover:underline">
                View all &rarr;
              </nuxt-link>
            </div>

            <Loading v-if="logsLoading" />
            <p v-else-if="logs.length === 0" class="text-center py-4 text-stone-400">
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
            </div>
          </section>
        </div>
      </template>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
import type { ForumReport } from "~/components/ForumReportCard.vue";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const MOD_PERMISSIONS = [
  "EDIT_ANY_POST", "DELETE_ANY_POST", "LOCK_THREAD",
  "PIN_THREAD", "BAN_USER", "MANAGE_CATEGORIES",
];

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const canAccessAdmin = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.some((p) => MOD_PERMISSIONS.includes(p));
});

const canManageBans = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("BAN_USER");
});

// Reports
const reports = ref<ForumReport[]>([]);
const reportsLoading = ref(true);

async function fetchReports() {
  reportsLoading.value = true;
  try {
    reports.value = await $fetch<ForumReport[]>("/api/forum/reports", {
      query: { resolved: false },
    });
  } catch {
    reports.value = [];
  } finally {
    reportsLoading.value = false;
  }
}

async function resolveReport(reportId: string) {
  try {
    await $fetch(`/api/forum/reports/${reportId}/resolve`, { method: "POST" });
    reports.value = reports.value.filter((r) => r.id !== reportId);
  } catch (err: any) {
    console.error(err);
  }
}

function onDeleted(reportId: string) {
  const report = reports.value.find((r) => r.id === reportId);
  if (report) {
    report.post.deleted_at = new Date().toISOString();
    report.post.body = "[deleted]";
  }
}

function onEdited(reportId: string, newBody: string) {
  const report = reports.value.find((r) => r.id === reportId);
  if (report) {
    report.post.body = newBody;
  }
}

// Mod Log
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
const logsLoading = ref(true);

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
  logsLoading.value = true;
  try {
    const data = await $fetch<{ logs: ModLog[]; total: number }>("/api/forum/mod-log", {
      query: { page: 1 },
    });
    logs.value = data.logs.slice(0, 10);
  } catch {
    logs.value = [];
  } finally {
    logsLoading.value = false;
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}

  if (canAccessAdmin.value) {
    await Promise.all([fetchReports(), fetchLogs()]);
  }
});

watch(canAccessAdmin, async (val) => {
  if (val) await Promise.all([fetchReports(), fetchLogs()]);
});

useHead({ title: "Discussions Admin" });
</script>
