<template>
  <StandardTemplate>
    <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8">
      <div class="max-w-4xl mx-auto mb-4 lg:mb-8">
        <h1 class="font-sorts text-center text-2xl lg:text-3xl mb-3">
          Discussions
        </h1>
        <div class="flex justify-center gap-2">
          <nuxt-link to="/forum/subscribed">
            <Button size="xs" color="secondary" icon="star">Subscribed</Button>
          </nuxt-link>
          <nuxt-link to="/forum/search">
            <Button size="xs" color="secondary" icon="search">Search</Button>
          </nuxt-link>
          <nuxt-link v-if="canAccessAdmin" to="/forum/admin">
            <Button size="xs" color="caution" icon="edit">Admin</Button>
          </nuxt-link>
        </div>
      </div>

      <template v-if="forum.categories.status === Status.SUCCESS">
        <div class="flex flex-col gap-6 max-w-4xl mx-auto">
          <!-- Ungrouped categories -->
          <div
            v-if="forum.categories.data.ungrouped.length"
            class="flex flex-col gap-2"
          >
            <ForumCategoryRow
              v-for="category in forum.categories.data.ungrouped"
              :key="category.id"
              :category="category"
            />
          </div>

          <!-- Grouped categories -->
          <div
            v-for="group in forum.categories.data.groups"
            :key="group.id"
            class="flex flex-col gap-2"
          >
            <h2 class="font-sorts text-lg text-stone-600 dark:text-stone-300">
              {{ group.name }}
            </h2>
            <ForumCategoryRow
              v-for="category in group.categories"
              :key="category.id"
              :category="category"
            />
          </div>

          <p
            v-if="
              forum.categories.data.ungrouped.length === 0 &&
              forum.categories.data.groups.length === 0
            "
            class="text-center py-3 text-stone-400"
          >
            No discussion categories yet.
          </p>
        </div>
      </template>
      <Loading v-else-if="forum.categories.status === Status.LOADING" />
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

const forum = useForum();
const me = useMe();

const MOD_PERMISSIONS = [
  "EDIT_ANY_POST",
  "DELETE_ANY_POST",
  "LOCK_THREAD",
  "PIN_THREAD",
  "BAN_USER",
  "MANAGE_CATEGORIES",
];

const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const canAccessAdmin = computed(() => {
  if (!forumMe.value) return false;
  if (forumMe.value.is_admin) return true;
  return forumMe.value.permissions.some((p) => MOD_PERMISSIONS.includes(p));
});

onMounted(async () => {
  forum.fetchCategories();
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
});

useHead({ title: "Discussions" });
</script>
