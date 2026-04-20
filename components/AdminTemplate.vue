<template>
  <StandardTemplate>
    <div class="w-full flex flex-col">
      <div class="bg-stone-200 dark:bg-stone-950 shadow-lg">
        <div class="flex flex-col items-center w-full m-auto py-4 px-8 gap-4">
          <img src="/logo.png" class="w-24 bg-stone-900 rounded-full" alt="ClockTracker" />
          <h1 class="font-sorts text-2xl lg:text-3xl">Administration</h1>
          <nav
            class="flex flex-wrap justify-center w-100 -mb-4 md:-mx-3 md:w-[calc(100%+1.5rem)] gap-2 md:gap-1 py-2 md:py-0"
          >
            <nuxt-link
              v-for="group in visibleGroups"
              :key="group.key"
              :to="group.defaultTo"
              class="profile-tab"
              :class="{
                'border-stone-500': activeGroupKey === group.key,
                'border-transparent': activeGroupKey !== group.key,
              }"
            >
              {{ group.label }}
            </nuxt-link>
          </nav>
        </div>
      </div>

      <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 mx-auto w-full">
        <div class="flex flex-col md:flex-row gap-4">
          <aside class="w-full md:w-[280px] md:min-w-[280px] pt-14">
            <ul class="w-full bg-stone-200 dark:bg-stone-700 rounded overflow-hidden">
              <li
                v-for="item in activeGroupItems"
                :key="item.to"
                class="w-full border-b border-stone-300 dark:border-stone-800"
              >
                <nuxt-link
                  :to="item.to"
                  class="admin-nav-link"
                  active-class="border-primary dark:border-dark-primary"
                >
                  {{ item.label }}
                </nuxt-link>
              </li>
            </ul>
          </aside>

          <section class="flex-grow px-20">
            <h2 v-if="title !== 'Administration'" class="font-sorts text-xl lg:text-2xl text-center mb-6">
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
          </section>
        </div>
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

const me = useMe();
const route = useRoute();
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

type GroupKey = "home" | "app" | "discussions" | "tools";
type NavItem = { label: string; to: string };

const groupItems = computed<Record<GroupKey, NavItem[]>>(() => ({
  home: [{ label: "Home", to: "/admin" }],
  app: canManageFeatureFlags.value
    ? [{ label: "Feature Flags", to: "/admin/feature-flags" }]
    : [],
  discussions: [
    canManageCategories.value
      ? { label: "Categories", to: "/admin/forum/categories" }
      : null,
    canManageGroups.value ? { label: "User Groups", to: "/admin/forum/groups" } : null,
    canManageBans.value ? { label: "Bans", to: "/admin/forum/bans" } : null,
    canViewReports.value ? { label: "Reports", to: "/admin/forum/reports" } : null,
    canViewModLog.value ? { label: "Mod Log", to: "/admin/forum/mod-log" } : null,
  ].filter((item): item is NavItem => !!item),
  tools: [
    canExportUserData.value ? { label: "User Data", to: "/admin/user-data" } : null,
    canExportUserData.value ? { label: "Updates", to: "/admin/updates" } : null,
    canExportUserData.value ? { label: "Reminders", to: "/admin/reminders" } : null,
    isAdminUser.value ? { label: "Circular Games", to: "/admin/circular-games" } : null,
  ].filter((item): item is NavItem => !!item),
}));

const groupLabels: Record<GroupKey, string> = {
  home: "Home",
  app: "App",
  discussions: "Discussions",
  tools: "Tools",
};

const activeGroupKey = computed<GroupKey>(() => {
  const path = route.path;
  if (path.startsWith("/admin/forum/")) return "discussions";
  if (path.startsWith("/admin/feature-flags")) return "app";
  if (
    path.startsWith("/admin/user-data") ||
    path.startsWith("/admin/updates") ||
    path.startsWith("/admin/reminders") ||
    path.startsWith("/admin/circular-games")
  ) {
    return "tools";
  }
  return "home";
});

const activeGroupItems = computed(() => groupItems.value[activeGroupKey.value]);
const visibleGroups = computed(() =>
  (Object.keys(groupItems.value) as GroupKey[])
    .filter((key) => groupItems.value[key].length > 0)
    .map((key) => ({
      key,
      label: groupLabels[key],
      defaultTo: groupItems.value[key][0].to,
    }))
);

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});
</script>

<style scoped>
.admin-nav-link {
  @apply block w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150;
}

li > a:not(.router-link-exact-active,:hover) {
  border-color: theme(colors.stone.300);

  &:where(.dark, .dark *) {
    border-color: theme(colors.stone.900);
  }
}
</style>
