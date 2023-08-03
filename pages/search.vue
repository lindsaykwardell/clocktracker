<template>
  <AuthenticatedTemplate>
    <div class="max-w-[1000px] w-5/6 py-4 m-auto">
      <div class="relative">
        <form @submit.prevent.stop="search">
          <input
            v-model="query"
            class="block w-full border border-stone-500 rounded-md p-2 text-lg bg-stone-600"
            placeholder="Search for a player, then press enter"
          />
        </form>
        <button
          @click="search"
          class="absolute right-2 -top-2 w-16 h-16"
          aria-label="Search"
        >
          <img src="/img/role/investigator.png" />
        </button>
      </div>
      <div class="py-4">
        <div v-if="searching" class="flex justify-center gap-1">
          <Spinner />
          Searching...
        </div>
        <UserCard
          v-for="user in users"
          class="w-full flex flex-col md:flex-row my-4"
          :player="user"
        />
      </div>
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
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
const query = ref("");
const searching = ref(false);

async function search() {
  searching.value = true;
  users.value = [];
  const result = await useFetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  if (result.data.value) {
    users.value = result.data.value;
  }

  searching.value = false;
}
</script>
