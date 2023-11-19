<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      <div class="w-[800px] m-auto flex gap-4">
        <template v-for="community in myCommunities">
          <nuxt-link
            :to="`/community/${community.slug}`"
            class="bg-stone-900 w-full p-2"
          >
            <div class="flex gap-3 items-center">
              <Avatar :value="community.icon" size="lg" class="community-icon" />
              <div>
                <h3 class="font-dumbledor text-2xl lg:text-3xl">
                  {{ community.name }}
                </h3>
                <p class="whitespace-pre-wrap text-left w-full py-4">
                  {{ community.description }}
                </p>
                <section class="flex gap-6 text-stone-600">
                  <div>
                    <span
                      class="text-stone-200 bg-blue-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
                    >
                      {{ community._count.members }}
                    </span>
                    <span>
                      Member{{ community._count.members === 1 ? "" : "s" }}
                    </span>
                  </div>
                  <div>
                    <span
                      class="text-stone-200 bg-green-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
                    >
                      {{ community._count.admins }}
                    </span>
                    <span>
                      Admin{{ community._count.admins === 1 ? "" : "s" }}
                    </span>
                  </div>
                  <div>
                    <span
                      class="text-stone-200 bg-purple-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
                    >
                      {{ community._count.posts }}
                    </span>
                    <span>
                      Post{{ community._count.posts === 1 ? "" : "s" }}
                    </span>
                  </div>
                </section>
              </div>
            </div>
          </nuxt-link>
        </template>
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
