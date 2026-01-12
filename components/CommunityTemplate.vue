<template>
  <StandardTemplate>
    <div class="w-full flex flex-col gap-8">
      <template v-if="community.status === Status.SUCCESS">
        <div class="bg-stone-200 dark:bg-stone-950 shadow-lg">
          <div
            class="flex flex-col items-center w-full lg:w-2/3 m-auto pt-4 px-8 lg:px-0 gap-4"
          >
            <div class="flex flex-col md:flex-row gap-4 md:gap-2 lg:gap-3 xl:gap-4 items-center w-full">
              <Avatar
                :value="community.data.icon"
                size="lg"
                class="flex-shrink"
              />
              <div class="flex-grow flex flex-col justify-start gap-3 w-full">
                <div class="flex flex-col items-center md:items-start gap-2">
                  <h1 class="font-sorts text-2xl xl:text-3xl text-center md:text-start">
                    {{ community.data.name }}
                  </h1>
                  <div
                    v-if="community.data.location"
                    class="md:text-lg dark:text-stone-400 flex gap-2 items-center justify-center md:justify-start"
                  >
                    <IconUI id="globe" />
                    <span class="sr-only">Location: </span><span>{{ community.data.location }}</span>
                  </div>
                  <div class="flex gap-2 flex-wrap justify-center md:justify-start">
                    <SocialLink
                      v-for="link in community.data.links"
                      :href="link"
                      class="hover:text-primary dark:hover:text-primary-light transition duration-150 hover:underline"
                    >
                      {{ link.replace(/https?:\/\//, "").replace(/\/$/, "") }}
                    </SocialLink>
                  </div>
                </div>
              </div>
              <Button
                v-if="user && !isBanned"
                @click="isMember ? leave() : join()"
                :color="isMember ? 'negative' : isPending ? 'caution' : 'positive'"
              >
                <template v-if="isMember"> Leave Community </template>
                <template v-else-if="isPending">Requested</template>
                <template v-else-if="isNotAllowed">Request to Join</template>
                <template v-else> Join Community </template>
              </Button>
            </div>
            <div class="flex flex-col gap-1 w-full">
              <h2 class="text-xs text-stone-600 text-center md:text-start uppercase">
                Moderators
              </h2>
              <div
                v-if="moderators.length"
                class="flex flex-wrap justify-center md:justify-start gap-[0.125rem]"
              >
                <nuxt-link
                  v-for="moderator in moderators"
                  :key="moderator.user_id"
                  :to="`/@${moderator.username}`"
                >
                  <Avatar
                    :value="moderator.avatar || ''"
                    size="xs"
                    class="flex-shrink bg-stone-300 dark:bg-stone-950"
                    v-tooltip="moderator.display_name || moderator.username"
                    background
                  />
                </nuxt-link>
              </div>
            </div>
            <hr class="border-stone-100 w-full" />
            <p class="whitespace-pre-wrap w-full text-center md:text-start text-balance">
              {{ community.data.description }}
            </p>
            <nav
              v-if="!isNotAllowed"
              class="flex flex-wrap justify-center md:justify-start w-100 md:-mx-3 md:w-[calc(100%+1.5rem)] gap-2 md:gap-1 py-2 md:py-0"
            >
              <nuxt-link
                :to="`/community/${community.data.slug}`"
                class="font-bold leading-none md:text-lg whitespace-nowrap rounded md:rounded-none bg-stone-100 md:bg-transparent border-2 md:border-x-0 md:border-t-0 md:border-b-4 py-2 md:py-1 px-3 hover:bg-stone-300 dark:hover:bg-stone-700"
                :class="currentTabClass('')"
              >
                Home
              </nuxt-link>
              <nuxt-link
                :to="`/community/${community.data.slug}/events`"
                class="font-bold leading-none md:text-lg whitespace-nowrap rounded md:rounded-none bg-stone-100 md:bg-transparent border-2 md:border-x-0 md:border-t-0 md:border-b-4 py-2 md:py-1 px-3 hover:bg-stone-300 dark:hover:bg-stone-700"
                :class="currentTabClass('events')"
              >
                Events
              </nuxt-link>
              <nuxt-link
                :to="`/community/${community.data.slug}/games`"
                class="font-bold leading-none md:text-lg whitespace-nowrap rounded md:rounded-none bg-stone-100 md:bg-transparent border-2 md:border-x-0 md:border-t-0 md:border-b-4 py-2 md:py-1 px-3 hover:bg-stone-300 dark:hover:bg-stone-700"
                :class="currentTabClass('games')"
              >
                Games
              </nuxt-link>
              <nuxt-link
                :to="`/community/${community.data.slug}/stats`"
                class="font-bold leading-none md:text-lg whitespace-nowrap rounded md:rounded-none bg-stone-100 md:bg-transparent border-2 md:border-x-0 md:border-t-0 md:border-b-4 py-2 md:py-1 px-3 hover:bg-stone-300 dark:hover:bg-stone-700"
                :class="currentTabClass('stats')"
              >
                Stats
              </nuxt-link>
              <nuxt-link
                v-if="isModerator"
                :to="`/community/${community.data.slug}/dashboard`"
                class="font-bold leading-none md:text-lg whitespace-nowrap rounded md:rounded-none bg-stone-100 md:bg-transparent border-2 md:border-x-0 md:border-t-0 md:border-b-4 py-2 md:py-1 px-3 hover:bg-stone-300 dark:hover:bg-stone-700"
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
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const communities = useCommunities();
const user = useSupabaseUser();
import { Status } from "@/composables/useFetchStatus";

const props = defineProps<{
  moderatorOnly?: boolean;
  slug?: string;
}>();

const slug = (route.params.slug || props.slug) as string;

const community = computed(() => communities.getCommunity(slug));
const isMember = computed(() => communities.isMember(slug, user.value?.id));
const isModerator = computed(() =>
  communities.isModerator(slug, user.value?.id)
);
const isBanned = computed(() => communities.isBanned(slug, user.value?.id));
const isPending = computed(() => communities.isPending(slug, user.value?.id));
const moderators = computed(() => {
  if (community.value.status !== Status.SUCCESS) return [];

  const adminIds = new Set(
    community.value.data.admins.map((admin) => admin.user_id)
  );

  return community.value.data.members.filter((member) =>
    adminIds.has(member.user_id)
  );
});
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

watch(community, () => {
  if (
    community.value.status === Status.SUCCESS &&
    props.moderatorOnly &&
    !isModerator.value
  ) {
    router.push(`/community/${slug}`);
  }
});

onMounted(() => {
  communities.fetchCommunity(slug);
});
</script>
