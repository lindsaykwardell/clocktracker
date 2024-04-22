<template>
  <StandardTemplate>
    <div class="max-w-[1000px] w-5/6 py-4 m-auto">
      <div>
        <form @submit.prevent.stop role="search">
          <label>
            <span class="block">Search</span>
            <div class="relative">
              <Input
                v-model="query"
                type="search"
                spellcheck="false"
                placeholder="Type in a user or community name"
              />
              <div
                class="absolute right-2 -top-2 w-16 h-16"
                aria-label="Search"
              >
                <img src="/img/role/investigator.png" />
              </div>
            </div>
          </label>
        </form>
      </div>
      <div class="py-4 flex flex-col gap-4">
        <div v-if="searching" class="flex justify-center gap-1">
          <Spinner />
          Searching...
        </div>
        <template v-else>
          <div class="flex gap-4">
            <Button
              font-size="md"
              @click="showUsers = !showUsers"
              :class="{
                'bg-stone-200 dark:bg-stone-600': showUsers,
                'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                  !showUsers,
              }"
            >
              <h2>
                {{ users.length }} User{{ users.length === 1 ? "" : "s" }}
              </h2>
            </Button>
            <Button
              font-size="md"
              @click="showCommunities = !showCommunities"
              :class="{
                'bg-stone-200 dark:bg-stone-600': showCommunities,
                'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                  !showCommunities,
              }"
            >
              <h2>
                {{ communities.length }} Communit{{
                  communities.length === 1 ? "y" : "ies"
                }}
              </h2>
            </Button>
            <Button
              font-size="md"
              @click="showScripts = !showScripts"
              :class="{
                'bg-stone-200 dark:bg-stone-600': showScripts,
                'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                  !showScripts,
              }"
            >
              <h2>
                {{ scripts.length }} Script{{ scripts.length === 1 ? "" : "s" }}
              </h2>
            </Button>
            <Button
              font-size="md"
              @click="showRoles = !showRoles"
              :class="{
                'bg-stone-200 dark:bg-stone-600': showRoles,
                'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 hover:text-inherit':
                  !showRoles,
              }"
            >
              <h2>
                {{ roles.length }} Role{{ roles.length === 1 ? "" : "s" }}
              </h2>
            </Button>
          </div>
          <template v-if="showUsers">
            <UserCard v-for="user in users" :username="user.username" />
          </template>
          <template v-if="showCommunities">
            <CommunityCard
              v-for="community in communities"
              :community="community"
            />
          </template>
          <template v-if="showRoles">
            <RoleCard v-for="role in roles" :role="role" />
          </template>
          <template v-if="showScripts">
            <ScriptCard v-for="script in scripts" :script="script" />
          </template>
        </template>
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Role } from "@prisma/client";
import { watchDebounced } from "@vueuse/core";

const users = ref<
  {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
  }[]
>([]);
const communities = ref<
  {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    _count: {
      members: number;
      admins: number;
      posts: number;
    };
  }[]
>([]);
const scripts = ref<
  {
    id: number;
    name: string;
    version: string;
    author: string;
    type: string;
    json_url: string;
    pdf_url: string;
    characters_last_updated: string | null;
    _count: {
      games: number;
    };
  }[]
>([]);
const roles = ref<(Role & { _count: { scripts: number; games: number } })[]>(
  []
);
const query = ref("");
const searching = ref(false);

const showUsers = ref(true);
const showCommunities = ref(true);
const showScripts = ref(true);
const showRoles = ref(true);

async function search() {
  searching.value = true;
  users.value = [];
  communities.value = [];
  scripts.value = [];
  roles.value = [];
  const result = await $fetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  users.value = result.users;
  scripts.value = result.scripts;
  communities.value = result.communities;
  if ("roles" in result) {
    roles.value = result.roles;
  } else {
    roles.value = [];
  }

  searching.value = false;
}

watchDebounced(query, search, { debounce: 500 });
</script>
