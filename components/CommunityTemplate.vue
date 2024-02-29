<template>
  <StandardTemplate>
    <template v-if="community.status === Status.SUCCESS">
      <div class="bg-stone-950 shadow-lg">
        <div
          class="flex flex-col items-center w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto"
        >
          <div class="flex gap-3 items-center w-full">
            <Avatar
              :value="community.data.icon"
              size="lg"
              class="border-stone-800 flex-shrink community-icon"
            />
            <div class="flex-grow flex flex-col justify-start gap-3 w-full">
              <div class="flex flex-col items-center md:items-start">
                <h1 class="font-dumbledor text-1xl lg:text-2xl">
                  {{ community.data.name }}
                </h1>
              </div>
              <button
                v-if="user && !isBanned"
                @click="isMember ? leave() : join()"
                class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 hover:bg-blue-900"
                :class="{
                  'bg-blue-950': !isMember,
                  'border border-blue-950 text-blue-700 hover:text-white':
                    isMember,
                }"
              >
                <template v-if="isMember"> Leave Community </template>
                <template v-else-if="isPending">Requested</template>
                <template v-else-if="isNotAllowed">Request to Join</template>
                <template v-else> Join Community </template>
              </button>
            </div>
          </div>
          <hr class="border-stone-100 w-full my-4" />
          <p class="whitespace-pre-wrap text-left w-full py-4">
            {{ community.data.description }}
          </p>
          <nav
            v-if="!isNotAllowed"
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
              :to="`/community/${community.data.slug}/events`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('events')"
            >
              Events
            </nuxt-link>
            <nuxt-link
              v-if="isModerator"
              :to="`/community/${community.data.slug}/dashboard`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-700"
              :class="currentTabClass('dashboard')"
            >
              Moderator Dashboard
            </nuxt-link>
          </nav>
        </div>
        <slot
          name="header"
          :community="community"
          :isMember="isMember"
          :isModerator="isModerator"
          :isBanned="isBanned"
          :isNotAllowed="isNotAllowed"
          :isPending="isPending"
        />
      </div>
      <div v-if="isBanned">
        <p class="text-center py-3 text-stone-400">
          You have been banned from this community.
        </p>
      </div>
      <div v-else-if="isNotAllowed">
        <p class="text-center py-3 text-stone-400">
          This community is private. You must join to view it.
        </p>
      </div>
      <slot
        v-else-if="!props.moderatorOnly || isModerator"
        :community="community"
        :isMember="isMember"
        :isModerator="isModerator"
        :isBanned="isBanned"
        :isNotAllowed="isNotAllowed"
        :isPending="isPending"
      />
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-screen">
        <Loading />
      </div>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const communities = useCommunities();
const user = useSupabaseUser();

const props = defineProps<{
  moderatorOnly?: boolean;
}>();

const community = computed(() => communities.getCommunity(slug));
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const isModerator = computed(() =>
  communities.isModerator(slug, user.value?.id)
);
const isBanned = computed(() => communities.isBanned(slug, user.value?.id));
const isPending = computed(() => communities.isPending(slug, user.value?.id));
const isNotAllowed = computed(() => {
  if (community.value.status !== Status.SUCCESS) return true;

  if (community.value.data.is_private === false) return false;

  return !isMember.value && !isBanned.value && community.value.data.is_private;
});

function currentTabClass(tab: string) {
  const formattedTab = `/community/${slug}${tab ? "/" + tab : ""}`;
  return {
    "border-stone-500": route.path === formattedTab,
    "border-transparent": route.path !== formattedTab,
  };
}

function leave() {
  if (confirm("Are you sure you want to leave this community?")) {
    communities.leaveCommunity(slug);
  }
}

function join() {
  communities.joinCommunity(slug);
}

onMounted(() => {
  communities.fetchCommunity(slug);
});
</script>

<style>
.community-icon {
  background-image: url("/img/token-bg.png");
  background-size: cover;
  background-position: center;
}
</style>
