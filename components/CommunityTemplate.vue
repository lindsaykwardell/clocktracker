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
              class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 hover:bg-blue-900"
              :class="{
                'bg-blue-950': !isMember,
                'border border-blue-950 text-blue-700 hover:text-white':
                  isMember,
              }"
            >
              <template v-if="isMember"> Leave Community </template>
              <template v-else> Join Community </template>
            </button>
          </div>
          <hr class="border-stone-100 w-full my-4" />
          <p class="whitespace-pre-wrap text-left w-full py-4">
            {{ community.data.description }}
          </p>
          <div
            v-if="isModerator"
            class="flex justify-start w-screen md:w-full gap-1 h-12"
          >
            <nuxt-link
              :to="`/community/${community.data.slug}`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('')"
            >
              Home
            </nuxt-link>
            <nuxt-link
              :to="`/community/${community.data.slug}/dashboard`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('mod-dashboard')"
            >
              Moderator Dashboard
            </nuxt-link>
          </div>
        </div>
        <div class="flex flex-wrap w-11/12 m-auto pb-2">
          <nuxt-link
            v-for="member in community.data.members"
            :to="`/@${member.username}`"
          >
            <Avatar
              :value="member.avatar"
              :size="community.data.members.length > 50 ? 'xs' : 'sm'"
              class="border-stone-800"
            />
          </nuxt-link>
        </div>
      </div>
      <slot
        :community="community"
        :isMember="isMember"
        :isModerator="isModerator"
      />
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-screen">
        <Loading />
      </div>
    </template>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const user = useSupabaseUser();

const community = computed(() => communities.getCommunity(slug));
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const isModerator = computed(() =>
  communities.isModerator(slug, user.value?.id)
);

function currentTabClass(tab: string) {
  return {
    "border-stone-500":
      route.path === `/community/${slug}${tab ? "/" + tab : ""}`,
    "border-transparent": route.path !== `/community/${slug}/${tab}`,
  };
}

onMounted(() => {
  communities.fetchCommunity(slug);
});
</script>
