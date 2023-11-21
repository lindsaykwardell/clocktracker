<template>
  <StandardTemplate>
    <div class="max-w-[1000px] w-5/6 py-4 m-auto">
      <div>
        <form @submit.prevent.stop role="search">
          <label>
            <span class="block">Search</span>
            <div class="relative">
              <input
                v-model="query"
                type="search"
                spellcheck="false"
                class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
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
            <button
              @click="showUsers = !showUsers"
              class="transition duration-150 px-2 py-1 rounded flex items-center gap-2"
              :class="{
                'bg-stone-600 hover:bg-stone-700': showUsers,
                'bg-stone-700 hover:bg-stone-600 text-stone-400': !showUsers,
              }"
            >
              <h2>
                {{ users.length }} User{{ users.length === 1 ? "" : "s" }}
              </h2>
            </button>
            <button
              @click="showCommunities = !showCommunities"
              class="transition duration-150 px-2 py-1 rounded flex items-center gap-2"
              :class="{
                'bg-stone-600 hover:bg-stone-700': showCommunities,
                'bg-stone-700 hover:bg-stone-600 text-stone-400':
                  !showCommunities,
              }"
            >
              <h2>
                {{ communities.length }} Communit{{
                  communities.length === 1 ? "y" : "ies"
                }}
              </h2>
            </button>
            <button
              @click="showScripts = !showScripts"
              class="transition duration-150 px-2 py-1 rounded flex items-center gap-2"
              :class="{
                'bg-stone-600 hover:bg-stone-700': showScripts,
                'bg-stone-700 hover:bg-stone-600 text-stone-400': !showScripts,
              }"
            >
              <h2>
                {{ scripts.length }} Script{{ scripts.length === 1 ? "" : "s" }}
              </h2>
            </button>
          </div>
          <template v-if="showCommunities">
            <CommunityCard
              v-for="community in communities"
              :community="community"
            />
          </template>
          <template v-if="showScripts">
            <ScriptCard v-for="script in scripts" :script="script" />
          </template>
          <template v-if="showUsers">
            <UserCard
              v-for="user in users"
              
              :username="user.username"
            />
          </template>
        </template>
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
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
const query = ref("");
const searching = ref(false);

const showUsers = ref(true);
const showCommunities = ref(true);
const showScripts = ref(true);

async function search() {
  searching.value = true;
  users.value = [];
  communities.value = [];
  scripts.value = [];
  const result = await $fetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  users.value = result.users;
  scripts.value = result.scripts;
  communities.value = result.communities;

  searching.value = false;
}

watchDebounced(query, search, { debounce: 500 });
</script>
