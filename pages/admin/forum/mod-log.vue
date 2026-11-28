<template>
  <AdminTemplate title="Mod Log" :has-access="canViewModLog">

      <Loading v-if="loading" />
      <p v-else-if="logs.length === 0" class="text-center py-8 text-stone-600 dark:text-stone-400">
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
            <span class="text-stone-600 dark:text-stone-400">{{ actionLabel(log.action) }}</span>
            {{ " " }}
            <nuxt-link
              v-if="log.target.link"
              :to="log.target.link"
              class="text-primary hover:underline"
            >
              {{ log.target.label }}
            </nuxt-link>
            <span v-else class="text-stone-600 dark:text-stone-400">{{ log.target.label }}</span>
            <span v-if="log.details" class="text-stone-600 italic dark:text-stone-400"> &mdash; {{ log.details }}</span>
          </div>
          <div class="text-xs text-stone-600 dark:text-stone-400 shrink-0">
            {{ formatDate(log.created_at) }}
          </div>
        </div>

        <!-- Pagination -->
        <Pager
          v-if="total > perPage"
          v-model:page="page"
          :total-pages="Math.ceil(total / perPage)"
          class="mt-4"
        />
      </div>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const canViewModLog = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("VIEW_MOD_LOG");
});

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
  RESOLVE_REPORT_DISMISSED: "resolved report (Dismissed)",
  RESOLVE_REPORT_EDITED: "resolved report (Post edited)",
  RESOLVE_REPORT_DELETED: "resolved report (Post deleted)",
  RESOLVE_REPORT_BANNED: "resolved report (User banned)",
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

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  if (canViewModLog.value) fetchLogs();
});

watch(canViewModLog, (val) => {
  if (val) fetchLogs();
});

watch(page, fetchLogs);

useHead({ title: "Mod Log" });
</script>
