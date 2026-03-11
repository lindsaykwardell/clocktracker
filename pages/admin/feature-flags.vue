<template>
  <AdminTemplate title="Feature Flags" :has-access="isAdmin">
      <template v-if="loading">
        <Loading />
      </template>

      <template v-else>
        <!-- Create new flag -->
        <form
          class="mb-8 p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50"
          @submit.prevent="createFlag"
        >
          <h2 class="font-semibold text-lg mb-3">Create New Flag</h2>
          <div class="flex flex-col sm:flex-row gap-3">
            <Input
              v-model="newFlagName"
              placeholder="Flag name (e.g. new-feature)"
              class="flex-1"
            />
            <Input
              v-model="newFlagDescription"
              placeholder="Description"
              class="flex-1"
            />
            <Button
              type="submit"
              :disabled="!newFlagName.trim() || creating"
              primary
            >
              {{ creating ? "Creating..." : "Create" }}
            </Button>
          </div>
        </form>

        <div class="flex flex-col gap-6">
          <div
            v-for="flag in sortedFlags"
            :key="flag.id"
            class="p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50"
          >
            <div class="flex items-center justify-between mb-3">
              <div>
                <h2 class="font-semibold text-lg">{{ flag.name }}</h2>
                <p class="text-sm text-stone-500 dark:text-stone-400">
                  {{ flag.description }}
                </p>
              </div>
              <button
                type="button"
                class="text-red-400 hover:text-red-300 ml-4 shrink-0"
                title="Delete flag"
                @click="deleteFlag(flag.id)"
              >
                <IconUI id="trash" size="sm" />
              </button>
            </div>

            <!-- Toggles -->
            <div class="flex flex-wrap gap-6 mb-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <Toggle
                  :model-value="flag.active"
                  size="sm"
                  @update:model-value="toggleActive(flag.id, $event)"
                />
                <span class="text-sm">Active globally</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <Toggle
                  :model-value="flag.enabled_for_supporters"
                  size="sm"
                  @update:model-value="toggleSupporters(flag.id, $event)"
                />
                <span class="text-sm">Enabled for supporters</span>
              </label>
            </div>

            <!-- Effective date -->
            <div class="flex items-center gap-3 mb-4">
              <label class="text-sm shrink-0">Effective date</label>
              <input
                type="date"
                :value="flag.effective_date ? flag.effective_date.slice(0, 10) : ''"
                class="px-2 py-1 text-sm rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                @change="updateEffectiveDate(flag.id, ($event.target as HTMLInputElement).value)"
              />
              <button
                v-if="flag.effective_date"
                type="button"
                class="text-xs text-red-400 hover:text-red-300"
                @click="updateEffectiveDate(flag.id, '')"
              >
                Clear
              </button>
              <span class="text-xs text-stone-400">
                {{ flag.effective_date ? 'Flag won\'t activate until this date' : 'No date restriction' }}
              </span>
            </div>

            <!-- Rollout percentage -->
            <div class="flex items-center gap-3 mb-4">
              <label class="text-sm shrink-0">Rollout</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  v-for="pct in [0, 10, 25, 50, 75, 100]"
                  :key="pct"
                  class="px-2 py-0.5 text-xs rounded transition-colors"
                  :class="flag.rollout_percentage === pct
                    ? 'bg-primary text-white'
                    : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700'"
                  @click="updateRollout(flag.id, String(pct))"
                >
                  {{ pct }}%
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 text-xs rounded transition-colors"
                  :class="flag.rollout_percentage == null
                    ? 'bg-primary text-white'
                    : 'bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700'"
                  @click="updateRollout(flag.id, '')"
                >
                  Off
                </button>
              </div>
            </div>

            <!-- Enabled users -->
            <div class="mb-3">
              <h3 class="text-sm font-medium text-stone-400 mb-2">
                Enabled for {{ flag.active_for.length }} user{{ flag.active_for.length === 1 ? '' : 's' }}
              </h3>
              <div v-if="flag.active_for.length" class="flex flex-wrap gap-2 mb-2">
                <div
                  v-for="u in flag.active_for"
                  :key="u.user_id"
                  class="flex items-center gap-2 px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-sm"
                >
                  <Avatar :value="u.avatar" size="xs" class="border-stone-800" background />
                  <span>{{ u.display_name }}</span>
                  <span class="text-stone-400">@{{ u.username }}</span>
                  <button
                    type="button"
                    class="text-red-400 hover:text-red-300 ml-1"
                    title="Remove"
                    @click="removeUser(flag.id, u.user_id)"
                  >
                    <IconUI id="x" size="xs" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Add user -->
            <div class="relative">
              <Input
                v-model="searchQueries[flag.id]"
                placeholder="Search users by name or username..."
                @input="onSearchInput(flag.id)"
              />
              <div
                v-if="searchResults[flag.id]?.length"
                class="absolute z-10 mt-1 w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg max-h-48 overflow-y-auto"
              >
                <button
                  v-for="u in searchResults[flag.id]"
                  :key="u.user_id"
                  type="button"
                  class="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  @click="addUser(flag.id, u)"
                >
                  <Avatar :value="u.avatar" size="xs" class="border-stone-800" background />
                  <span>{{ u.display_name }}</span>
                  <span class="text-stone-400">@{{ u.username }}</span>
                </button>
              </div>
            </div>
          </div>

          <p
            v-if="sortedFlags.length === 0"
            class="text-center py-8 text-stone-400"
          >
            No feature flags found.
          </p>
        </div>
      </template>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

type FlagUser = {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
};

type Flag = {
  id: number;
  name: string;
  description: string;
  active: boolean;
  enabled_for_supporters: boolean;
  rollout_percentage: number | null;
  effective_date: string | null;
  active_for: FlagUser[];
};

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdmin = computed(() => {
  if (me.value.status === Status.SUCCESS && me.value.data.is_admin) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("MANAGE_FEATURE_FLAGS");
});

const flags = ref<Flag[]>([]);
const sortedFlags = computed(() =>
  [...flags.value].sort((a, b) => a.name.localeCompare(b.name))
);
const loading = ref(true);
const searchQueries = ref<Record<number, string>>({});
const searchResults = ref<Record<number, FlagUser[]>>({});
const searchTimers = ref<Record<number, ReturnType<typeof setTimeout>>>({});

const newFlagName = ref("");
const newFlagDescription = ref("");
const creating = ref(false);

async function fetchFlags() {
  loading.value = true;
  try {
    flags.value = await $fetch<Flag[]>("/api/admin/feature-flags");
  } catch {
    flags.value = [];
  }
  loading.value = false;
}

async function createFlag() {
  const name = newFlagName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    const flag = await $fetch<Flag>("/api/admin/feature-flags", {
      method: "POST",
      body: { name, description: newFlagDescription.value.trim() },
    });
    flags.value.push(flag);
    newFlagName.value = "";
    newFlagDescription.value = "";
  } catch (err: any) {
    console.error("Failed to create flag", err);
  }
  creating.value = false;
}

async function deleteFlag(flagId: number) {
  if (!confirm("Delete this feature flag?")) return;
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}`, { method: "DELETE" });
    flags.value = flags.value.filter((f) => f.id !== flagId);
  } catch (err: any) {
    console.error("Failed to delete flag", err);
  }
}

async function toggleActive(flagId: number, value: boolean) {
  const flag = flags.value.find((f) => f.id === flagId);
  if (flag) flag.active = value;
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}`, {
      method: "PUT",
      body: { active: value },
    });
  } catch (err: any) {
    if (flag) flag.active = !value;
    console.error("Failed to toggle active", err);
  }
}

async function toggleSupporters(flagId: number, value: boolean) {
  const flag = flags.value.find((f) => f.id === flagId);
  if (flag) flag.enabled_for_supporters = value;
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}`, {
      method: "PUT",
      body: { enabled_for_supporters: value },
    });
  } catch (err: any) {
    if (flag) flag.enabled_for_supporters = !value;
    console.error("Failed to toggle supporters", err);
  }
}

async function updateEffectiveDate(flagId: number, value: string) {
  const flag = flags.value.find((f) => f.id === flagId);
  if (!flag) return;

  const prev = flag.effective_date;
  const newVal = value ? new Date(value + "T00:00:00Z").toISOString() : null;
  flag.effective_date = newVal;
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}`, {
      method: "PUT",
      body: { effective_date: newVal },
    });
  } catch (err: any) {
    flag.effective_date = prev;
    console.error("Failed to update effective date", err);
  }
}

async function updateRollout(flagId: number, rawValue: string) {
  const flag = flags.value.find((f) => f.id === flagId);
  if (!flag) return;

  const value = rawValue.trim() === "" ? null : Math.max(0, Math.min(100, Math.round(Number(rawValue))));
  const prev = flag.rollout_percentage;
  flag.rollout_percentage = value;
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}`, {
      method: "PUT",
      body: { rollout_percentage: value },
    });
  } catch (err: any) {
    flag.rollout_percentage = prev;
    console.error("Failed to update rollout", err);
  }
}

function onSearchInput(flagId: number) {
  clearTimeout(searchTimers.value[flagId]);
  const q = searchQueries.value[flagId]?.trim() || "";

  if (q.length < 2) {
    searchResults.value[flagId] = [];
    return;
  }

  searchTimers.value[flagId] = setTimeout(async () => {
    try {
      const results = await $fetch<FlagUser[]>(
        "/api/admin/feature-flags/users",
        { params: { q } }
      );
      // Filter out users already enabled for this flag
      const flag = flags.value.find((f) => f.id === flagId);
      const existing = new Set(flag?.active_for.map((u) => u.user_id) || []);
      searchResults.value[flagId] = results.filter(
        (u) => !existing.has(u.user_id)
      );
    } catch {
      searchResults.value[flagId] = [];
    }
  }, 300);
}

async function addUser(flagId: number, user: FlagUser) {
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}/users`, {
      method: "POST",
      body: { user_id: user.user_id },
    });
    const flag = flags.value.find((f) => f.id === flagId);
    if (flag) {
      flag.active_for.push(user);
    }
    searchQueries.value[flagId] = "";
    searchResults.value[flagId] = [];
  } catch (err: any) {
    console.error("Failed to add user", err);
  }
}

async function removeUser(flagId: number, userId: string) {
  try {
    await $fetch(`/api/admin/feature-flags/${flagId}/users`, {
      method: "DELETE",
      body: { user_id: userId },
    });
    const flag = flags.value.find((f) => f.id === flagId);
    if (flag) {
      flag.active_for = flag.active_for.filter((u) => u.user_id !== userId);
    }
  } catch (err: any) {
    console.error("Failed to remove user", err);
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  if (isAdmin.value) fetchFlags();
});

watch(isAdmin, (val) => {
  if (val) fetchFlags();
});

useHead({ title: "Feature Flags" });
</script>
