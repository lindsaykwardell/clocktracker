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
      <div class="py-4">
        <div v-if="searching" class="flex justify-center gap-1">
          <Spinner />
          Searching...
        </div>
        <CommunityCard
          v-for="community in communities"
          :community="community"
          class="bg-stone-900"
        />
        <UserCard
          v-for="user in users"
          class="w-full flex flex-col md:flex-row my-4"
          :username="user.username"
        />
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
const query = ref("");
const searching = ref(false);

async function search() {
  searching.value = true;
  users.value = [];
  communities.value = [];
  const result = await $fetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  users.value = result.users;
  communities.value = result.communities;

  searching.value = false;
}

watchDebounced(query, search, { debounce: 500 });
</script>
