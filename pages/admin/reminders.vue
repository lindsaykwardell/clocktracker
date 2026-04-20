<template>
  <AdminTemplate title="Reminder Types" :has-access="canManageReminders">
    <template v-if="loading">
      <Loading />
    </template>

    <template v-else>
      <section
        class="mb-6 p-4 rounded border border-stone-300 dark:border-stone-700/50
               bg-stone-300/40 dark:bg-stone-900/50"
      >
        <h2 class="font-semibold text-lg mb-2">Role Reminder Type Management</h2>
        <p class="text-sm text-stone-500 dark:text-stone-400">
          Update reminder definitions used in the role reminder dialog.
          This only edits <code>RoleReminder.type</code>, not per-game reminder tokens.
        </p>
      </section>

      <section
        class="mb-6 p-4 rounded border border-stone-300 dark:border-stone-700/50
               bg-stone-300/40 dark:bg-stone-900/50"
      >
        <div class="grid gap-3 md:grid-cols-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-stone-500">Search role/reminder</label>
            <Input v-model="search" placeholder="e.g. acrobat, dead, changed" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-stone-500">Type</label>
            <select
              v-model="typeFilter"
              class="h-10 px-3 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
            >
              <option value="">All types</option>
              <option v-for="type in reminderTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div class="flex items-end justify-end">
            <Button
              color="primary"
              size="sm"
              :disabled="savingAll || changedIds.length === 0"
              @click="saveAll"
            >
              {{ savingAll ? "Saving..." : `Save Changed (${changedIds.length})` }}
            </Button>
          </div>
        </div>
        <div class="mt-3">
          <Alert v-if="saveSuccessMessage" color="positive">
            {{ saveSuccessMessage }}
          </Alert>
          <Alert v-if="saveErrorMessage" color="negative">
            {{ saveErrorMessage }}
          </Alert>
        </div>
      </section>

      <section
        class="rounded border border-stone-300 dark:border-stone-700/50
               bg-stone-300/40 dark:bg-stone-900/50 overflow-hidden"
      >
        <p v-if="loadError" class="px-3 py-3 text-sm text-red-500">
          {{ loadError }}
        </p>
        <div v-if="filteredRows.length === 0" class="px-3 py-8 text-center text-stone-500">
          No reminders found.
        </div>
        <div v-else class="flex flex-col">
          <div class="px-3 py-2 text-xs text-stone-500 border-b border-stone-300/70 dark:border-stone-700/70">
            Showing roles {{ startRoleIndex + 1 }}-{{ endRoleIndex }} of {{ totalRoleGroups }}
          </div>
          <div
            v-for="group in paginatedGroups"
            :key="group.key"
            class="border-t border-stone-300/70 dark:border-stone-700/70 first:border-t-0"
          >
            <div class="px-3 py-2 bg-stone-300 dark:bg-stone-800">
              <div class="font-semibold">
                {{ group.role_name }}
                <span v-if="group.role_custom" class="text-xs text-stone-500">(Custom)</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="text-left text-xs">
                  <tr class="bg-stone-200 dark:bg-stone-900 border-t border-stone-300/60 dark:border-stone-700/60">
                    <th class="px-3 py-2 whitespace-nowrap">Reminder</th>
                    <th class="px-3 py-2 whitespace-nowrap text-right">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in group.rows"
                    :key="row.id"
                    class="bg-stone-50 dark:bg-stone-950 border-t border-stone-300/60 dark:border-stone-700/60"
                  >
                    <td class="px-3 py-2 w-64">{{ row.reminder }}</td>
                    <td class="px-3 py-2">
                      <div class="flex flex-wrap justify-end gap-8">
                        <div
                          v-for="type in reminderTypes"
                          :key="`${row.id}-${type}`"
                          class="inline-flex items-center gap-1.5"
                        >
                          <input
                            v-model="draftTypeById[row.id]"
                            :id="`${row.id}-${type}`"
                            :name="`type-${row.id}`"
                            :value="type"
                            type="radio"
                            class="sr-only"
                          />
                          <label 
                            :for="`${row.id}-${type}`"         
                          >
                            {{ type }}
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div
            class="flex items-center justify-between gap-3 px-3 py-3 border-t border-stone-300/70 dark:border-stone-700/70"
          >
            <div class="text-xs text-stone-500">
              Page {{ currentPage }} / {{ totalPages }}
            </div>
            <div class="flex items-center gap-2">
              <Button
                color="primary"
                size="sm"
                :disabled="currentPage <= 1"
                @click="currentPage -= 1"
              >
                Prev
              </Button>
              <Button
                color="primary"
                size="sm"
                :disabled="currentPage >= totalPages"
                @click="currentPage += 1"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

type ReminderType = "OFFICIAL" | "TRACKING" | "IMPORTED" | "LEGACY" | "CUSTOM";

type ReminderRow = {
  id: number;
  role_id: string;
  role_name: string;
  role_type: string;
  role_custom?: boolean;
  reminder: string;
  type: ReminderType;
};

const reminderTypes: ReminderType[] = ["OFFICIAL", "TRACKING", "IMPORTED", "LEGACY", "CUSTOM"];

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const canManageReminders = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("EXPORT_USER_DATA");
});

const loading = ref(true);
const loadError = ref("");
const rows = ref<ReminderRow[]>([]);
const search = ref("");
const typeFilter = ref<ReminderType | "">("");
const draftTypeById = ref<Record<number, ReminderType>>({});
const savingById = ref<Record<number, boolean>>({});
const savingAll = ref(false);
const currentPage = ref(1);
const pageSize = 25;
const saveSuccessMessage = ref("");
const saveErrorMessage = ref("");

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (typeFilter.value && row.type !== typeFilter.value) return false;
    if (!q) return true;
    return (
      row.role_name.toLowerCase().includes(q) ||
      row.reminder.toLowerCase().includes(q) ||
      row.role_id.toLowerCase().includes(q)
    );
  });
});

const groupedRows = computed(() => {
  type ReminderGroup = {
    key: string;
    role_name: string;
    role_type: string;
    role_custom: boolean;
    rows: ReminderRow[];
  };

  const groups = new Map<string, ReminderGroup>();

  for (const row of filteredRows.value) {
    const key = `${row.role_id}|${row.role_name}|${row.role_type}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        role_name: row.role_name,
        role_type: row.role_type,
        role_custom: !!row.role_custom,
        rows: [],
      });
    }

    groups.get(key)!.rows.push(row);
  }

  return Array.from(groups.values());
});

const totalRoleGroups = computed(() => groupedRows.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalRoleGroups.value / pageSize))
);
const startRoleIndex = computed(() => (currentPage.value - 1) * pageSize);
const endRoleIndex = computed(() =>
  Math.min(startRoleIndex.value + pageSize, totalRoleGroups.value)
);
const paginatedGroups = computed(() =>
  groupedRows.value.slice(startRoleIndex.value, endRoleIndex.value)
);

const changedIds = computed(() =>
  rows.value
    .filter((row) => draftTypeById.value[row.id] && draftTypeById.value[row.id] !== row.type)
    .map((row) => row.id)
);

async function fetchRows() {
  loading.value = true;
  loadError.value = "";
  try {
    const result = await $fetch<ReminderRow[]>("/api/admin/reminders");
    rows.value = result;
    draftTypeById.value = Object.fromEntries(result.map((row) => [row.id, row.type]));
  } catch (err: any) {
    rows.value = [];
    loadError.value = err?.data?.statusMessage || err?.message || "Failed to load reminders.";
  } finally {
    loading.value = false;
  }
}

async function saveRow(id: number) {
  const row = rows.value.find((r) => r.id === id);
  const nextType = draftTypeById.value[id];
  if (!row || !nextType || row.type === nextType) return;

  savingById.value[id] = true;
  try {
    const updated = await $fetch<{ id: number; type: ReminderType }>(`/api/admin/reminders/${id}`, {
      method: "PUT",
      body: { type: nextType },
    });
    row.type = updated.type;
    draftTypeById.value[id] = updated.type;
    return true;
  } catch {
    return false;
  } finally {
    savingById.value[id] = false;
  }
}

async function saveAll() {
  const ids = changedIds.value;
  if (ids.length === 0) return;
  saveSuccessMessage.value = "";
  saveErrorMessage.value = "";
  savingAll.value = true;
  try {
    let successCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      const ok = await saveRow(id);
      if (ok) successCount += 1;
      else failedCount += 1;
    }

    if (successCount > 0 && failedCount === 0) {
      saveSuccessMessage.value = `Saved ${successCount} reminder change${successCount === 1 ? "" : "s"} successfully.`;
    } else if (successCount > 0 && failedCount > 0) {
      saveSuccessMessage.value = `Saved ${successCount} reminder change${successCount === 1 ? "" : "s"}.`;
      saveErrorMessage.value = `${failedCount} reminder update${failedCount === 1 ? "" : "s"} failed.`;
    } else if (failedCount > 0) {
      saveErrorMessage.value = `${failedCount} reminder update${failedCount === 1 ? "" : "s"} failed.`;
    }
  } finally {
    savingAll.value = false;
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  await fetchRows();
});

watch([search, typeFilter], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages;
  }
});

useHead({ title: "Reminder Types - Admin" });
</script>

<style scoped>
  input[type=radio] + label {
    @apply px-2 py-1 bg-stone-200 dark:bg-stone-800 rounded-md hover:cursor-pointer;
  }

  input[type=radio]:checked + label {
    @apply border border-primary bg-primary/20;
  }
</style>
