<template>
  <AuthenticatedTemplate>
    <template v-if="community.status === Status.SUCCESS">
      <div class="bg-stone-950 shadow-lg">
        <div
          class="flex flex-col items-center p-2 w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto"
        >
          <div class="flex flex-col items-center gap-3 w-full">
            <div class="flex-grow flex flex-col items-center md:items-start">
              <h3 class="font-dumbledor text-2xl lg:text-3xl">
                {{ community.data.name }}
              </h3>
            </div>
            <button
              class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 bg-blue-950 hover:bg-blue-900"
            >
              Join Community
            </button>
          </div>
          <hr class="border-stone-100 w-full my-4" />
          <p class="whitespace-pre-wrap text-left w-full py-4">
            {{ community.data.description }}
          </p>
          <slot />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    </template>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const communities = useCommunities();

const community = computed(() =>
  communities.getCommunity(route.params.slug as string)
);

onMounted(() => {
  communities.fetchCommunity(route.params.slug as string);
})
</script>
