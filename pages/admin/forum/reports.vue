<template>
  <AdminTemplate title="Reported Posts" :has-access="canViewReports">

      <div class="flex gap-2 mb-4">
        <Button
          :color="!showResolved ? 'primary' : 'secondary'"
          size="sm"
          @click="showResolved = false"
        >
          Open
        </Button>
        <Button
          :color="showResolved ? 'primary' : 'secondary'"
          size="sm"
          @click="showResolved = true"
        >
          Resolved
        </Button>
      </div>

      <Loading v-if="loading" />
      <p v-else-if="reports.length === 0" class="text-center py-8 text-stone-400">
        No {{ showResolved ? "resolved" : "open" }} reports.
      </p>
      <div v-else class="flex flex-col gap-4">
        <ForumReportCard
          v-for="report in reports"
          :key="report.id"
          :report="report"
          @resolve="resolve"
          @deleted="onDeleted"
          @edited="onEdited"
        />
      </div>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
import type { ForumReport } from "~/components/ForumReportCard.vue";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const canViewReports = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("VIEW_REPORTS");
});

const showResolved = ref(false);
const reports = ref<ForumReport[]>([]);
const loading = ref(true);

async function fetchReports() {
  loading.value = true;
  try {
    reports.value = await $fetch<ForumReport[]>("/api/forum/reports", {
      query: { resolved: showResolved.value },
    });
  } catch {
    reports.value = [];
  } finally {
    loading.value = false;
  }
}

async function resolve(reportId: string) {
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

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  if (canViewReports.value) fetchReports();
});

watch(canViewReports, (val) => {
  if (val) fetchReports();
});

watch(showResolved, fetchReports);

useHead({ title: "Reported Posts" });
</script>
