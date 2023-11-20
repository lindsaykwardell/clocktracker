<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <div class="flex justify-end items-center p-4">
        <nuxt-link
          to="/community/create"
          class="bg-blue-700 hover:bg-blue-800 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        >
          Create Community
        </nuxt-link>
      </div>
      <div class="w-full lg:w-[800px] m-auto flex flex-col items-center gap-4">
        <h1 class="font-dumbledor text-4xl lg:text-3xl">Communities</h1>
        <CommunityCard
          v-for="community in myCommunities"
          :community="community"
        />
      </div>
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-screen">
        <Loading />
      </div>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { FetchStatus } from "~/composables/useFetchStatus";
import { User } from "~/composables/useUsers";

definePageMeta({
  middleware: "auth",
});

const users = useUsers();
const user = useSupabaseUser();

const me = computed(() => {
  if (user.value) {
    return users.getUserById(user.value.id);
  } else {
    return { status: Status.IDLE } as FetchStatus<User>;
  }
});

const myCommunities = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return me.value.data.communities;
  } else {
    return [];
  }
});
</script>
