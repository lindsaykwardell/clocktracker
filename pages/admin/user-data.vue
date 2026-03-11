<template>
  <AdminTemplate title="User Data" :has-access="canExport">
    <!-- Export -->
    <section
      class="mb-8 p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50"
    >
      <h2 class="font-semibold text-lg mb-3">Export User Data</h2>
      <p class="text-sm text-stone-500 dark:text-stone-400 mb-3">
        Download a complete JSON export for a user. Includes games, grimoire data,
        friends, communities, events, forum data, and all referenced entities.
      </p>
      <div class="flex gap-2 items-end">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-stone-500">Username</label>
          <UserSearchInput
            placeholder="Search for a user..."
            @select="exportUsername = $event"
          />
        </div>
        <Button
          color="primary"
          size="sm"
          :disabled="!exportUsername.trim() || exporting"
          @click="exportUser"
        >
          {{ exporting ? "Exporting..." : "Download JSON" }}
        </Button>
      </div>
      <p v-if="exportError" class="text-sm text-red-500 mt-2">{{ exportError }}</p>
      <p v-if="exportSuccess" class="text-sm text-green-500 mt-2">{{ exportSuccess }}</p>
    </section>

    <!-- Import (dev only) -->
    <section
      v-if="isDev"
      class="p-4 rounded border border-stone-300 dark:border-stone-700/50
             bg-stone-300/40 dark:bg-stone-900/50"
    >
      <h2 class="font-semibold text-lg mb-3">Import User Data</h2>
      <p class="text-sm text-stone-500 dark:text-stone-400 mb-3">
        Upload an exported JSON file to import into this database. IDs are
        automatically remapped to avoid conflicts with existing data.
        Only available in local development.
      </p>
      <div class="flex gap-2 items-end">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-stone-500">JSON File</label>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0
                   file:text-sm file:font-medium file:bg-primary file:text-white
                   file:cursor-pointer hover:file:bg-primary/90"
          />
        </div>
        <Button
          color="primary"
          size="sm"
          :disabled="importing"
          @click="importUser"
        >
          {{ importing ? "Importing..." : "Import JSON" }}
        </Button>
      </div>
      <p v-if="importError" class="text-sm text-red-500 mt-2">{{ importError }}</p>
      <p v-if="importSuccess" class="text-sm text-green-500 mt-2">{{ importSuccess }}</p>
    </section>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isDev = import.meta.dev;

const canExport = computed(() => {
  const meVal = me.value;
  if (meVal.status === Status.SUCCESS && meVal.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("EXPORT_USER_DATA");
});

// Export
const exportUsername = ref("");
const exporting = ref(false);
const exportError = ref("");
const exportSuccess = ref("");

async function exportUser() {
  const username = exportUsername.value.trim();
  if (!username) return;

  exporting.value = true;
  exportError.value = "";
  exportSuccess.value = "";

  try {
    const response = await $fetch<Blob>(
      `/api/admin/export-user/${encodeURIComponent(username)}`,
      { responseType: "blob" }
    );

    const url = URL.createObjectURL(response);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clocktracker-${username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    exportSuccess.value = `Downloaded data for @${username}`;
  } catch (err: any) {
    exportError.value =
      err?.data?.statusMessage || err?.message || "Export failed";
  } finally {
    exporting.value = false;
  }
}

// Import
const fileInput = ref<HTMLInputElement | null>(null);
const importing = ref(false);
const importError = ref("");
const importSuccess = ref("");

async function importUser() {
  const file = fileInput.value?.files?.[0];
  if (!file) {
    importError.value = "Please select a JSON file";
    return;
  }

  importing.value = true;
  importError.value = "";
  importSuccess.value = "";

  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const result = await $fetch<{ success: boolean; imported: number }>(
      "/api/admin/import-user",
      {
        method: "POST",
        body: json,
      }
    );

    importSuccess.value = `Imported successfully (${result.imported} rows)`;
    if (fileInput.value) fileInput.value.value = "";
  } catch (err: any) {
    importError.value =
      err?.data?.statusMessage || err?.message || "Import failed";
  } finally {
    importing.value = false;
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});

useHead({ title: "User Data - Admin" });
</script>
