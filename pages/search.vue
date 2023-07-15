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
        <img
          src="/img/role/investigator.png"
          class="absolute right-2 -top-2 w-16 h-16"
        />
      </div>
      <UserCard
        v-for="user in users"
        class="w-full flex flex-col md:flex-row"
        :player="user"
      />
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

async function search() {
  const result = await useFetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  if (result.data.value) {
    users.value = result.data.value;
  }
}
</script>
