<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <div class="flex justify-end items-center p-4 gap-2">
        <Button
          component="nuxt-link"
          to="/community/create"
          color="primary"
        >
          Create Community
        </Button>
        <Button
          component="nuxt-link"
          to="/search?near_me=true"
        >
          Find Communities Near Me
        </Button>
      </div>
      <div class="w-full lg:w-[800px] m-auto flex flex-col items-center gap-4 p-4 md:p-4 pb-4 lg:pb-8">
        <h1 class="font-sorts text-4xl lg:text-3xl">Communities</h1>
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
import { Status } from "~/composables/useFetchStatus";

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
