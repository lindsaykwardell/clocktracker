<template>
  <StandardTemplate>
    <div class="w-full flex flex-col">
      <div class="bg-stone-200 dark:bg-stone-950 shadow-lg">
        <div
          class="flex flex-col items-center w-full m-auto py-4 px-8 gap-4"
        >
          <img src="/logo.png" class="w-24 bg-stone-900 rounded-full" alt="ClockTracker" />
          <h1 class="font-sorts text-2xl lg:text-3xl">Administration</h1>
          <nav
            class="flex flex-wrap justify-center w-100 -mb-4 md:-mx-3 md:w-[calc(100%+1.5rem)] gap-2 md:gap-1 py-2 md:py-0"
          >
            <nuxt-link to="/admin" class="profile-tab" :class="tabClass('/admin')">
              Home
            </nuxt-link>
            <nuxt-link
              v-if="canManageFeatureFlags"
              to="/admin/feature-flags"
              class="profile-tab"
              :class="tabClass('/admin/feature-flags')"
            >
              Feature Flags
            </nuxt-link>
            <nuxt-link
              v-if="canManageCategories"
              to="/admin/forum/categories"
              class="profile-tab"
              :class="tabClass('/admin/forum/categories')"
            >
              Categories
            </nuxt-link>
            <nuxt-link
              v-if="canManageGroups"
              to="/admin/forum/groups"
              class="profile-tab"
              :class="tabClass('/admin/forum/groups')"
            >
              User Groups
            </nuxt-link>
            <nuxt-link
              v-if="canManageBans"
              to="/admin/forum/bans"
              class="profile-tab"
              :class="tabClass('/admin/forum/bans')"
            >
              Bans
            </nuxt-link>
            <nuxt-link
              v-if="canViewReports"
              to="/admin/forum/reports"
              class="profile-tab"
              :class="tabClass('/admin/forum/reports')"
            >
              Reports
            </nuxt-link>
            <nuxt-link
              v-if="canViewModLog"
              to="/admin/forum/mod-log"
              class="profile-tab"
              :class="tabClass('/admin/forum/mod-log')"
            >
              Mod Log
            </nuxt-link>
            <nuxt-link
              v-if="canExportUserData"
              to="/admin/user-data"
              class="profile-tab"
              :class="tabClass('/admin/user-data')"
            >
              User Data
            </nuxt-link>
          </nav>
        </div>
      </div>

      <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto w-full">
        <h2 v-if="title !== 'Administration'" class="font-sorts text-xl lg:text-2xl mb-6">
          {{ title }}
        </h2>

        <template v-if="!hasAccess">
          <p class="text-center py-8 text-stone-400">
            You do not have permission to access this page.
          </p>
        </template>

        <template v-else>
          <slot />
        </template>
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

defineProps<{
  title: string;
  hasAccess: boolean;
}>();

const route = useRoute();
const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

function hasPerm(perm: string) {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes(perm);
}

const canManageCategories = computed(() => hasPerm("MANAGE_CATEGORIES"));
const canManageGroups = computed(() => hasPerm("MANAGE_GROUPS"));
const canManageBans = computed(() => hasPerm("BAN_USER"));
const canManageFeatureFlags = computed(() => hasPerm("MANAGE_FEATURE_FLAGS"));
const canViewReports = computed(() => hasPerm("VIEW_REPORTS"));
const canViewModLog = computed(() => hasPerm("VIEW_MOD_LOG"));
const canExportUserData = computed(() => hasPerm("EXPORT_USER_DATA"));

function tabClass(path: string) {
  return {
    "border-stone-500": route.path === path,
    "border-transparent": route.path !== path,
  };
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});
</script>
