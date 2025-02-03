<template>
  <StandardTemplate>
    <template v-if="community.status === Status.SUCCESS">
      <div class="dark:bg-stone-950 shadow-lg">
        <div
          class="flex flex-col items-center w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto"
        >
          <div class="flex gap-3 items-center w-full">
            <Avatar
              :value="community.data.icon"
              size="lg"
              class="flex-shrink"
            />
            <div class="flex-grow flex flex-col justify-start gap-3 w-full">
              <div class="flex flex-col items-center md:items-start">
                <h1 class="font-sorts text-1xl lg:text-2xl">
                  {{ community.data.name }}
                </h1>
                <div
                  v-if="community.data.location"
                  class="md:text-lg dark:text-stone-400 flex gap-2 items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                  >
                    <path
                      fill="currentColor"
                      d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2ZM4.02 16.394l1.338.446L7 19.303v1.283a1 1 0 0 0 .293.707L10 24v2.377a11.994 11.994 0 0 1-5.98-9.983ZM16 28a11.968 11.968 0 0 1-2.572-.285L14 26l1.805-4.512a1 1 0 0 0-.097-.926l-1.411-2.117a1 1 0 0 0-.832-.445h-4.93l-1.248-1.873L9.414 14H11v2h2v-2.734l3.868-6.77l-1.736-.992L14.277 7h-2.742L10.45 5.371A11.861 11.861 0 0 1 20 4.7V8a1 1 0 0 0 1 1h1.465a1 1 0 0 0 .832-.445l.877-1.316A12.033 12.033 0 0 1 26.894 11H22.82a1 1 0 0 0-.98.804l-.723 4.47a1 1 0 0 0 .54 1.055L25 19l.685 4.056A11.98 11.98 0 0 1 16 28Z"
                    />
                  </svg>
                  <span>{{ community.data.location }}</span>
                </div>
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
          <div class="flex gap-2 flex-col md:flex-row md:flex-wrap">
            <SocialLink
              v-for="link in community.data.links"
              :href="link"
              class="hover:text-primary dark:hover:text-primary-light transition duration-150 hover:underline"
            >
              {{ link.replace(/https?:\/\//, "").replace(/\/$/, "") }}
            </SocialLink>
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
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-200 dark:hover:bg-stone-700"
              :class="currentTabClass('')"
            >
              Home
            </nuxt-link>
            <nuxt-link
              :to="`/community/${community.data.slug}/events`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-200 dark:hover:bg-stone-700"
              :class="currentTabClass('events')"
            >
              Events
            </nuxt-link>
            <nuxt-link
              :to="`/community/${community.data.slug}/games`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-200 dark:hover:bg-stone-700"
              :class="currentTabClass('games')"
            >
              Games
            </nuxt-link>
            <nuxt-link
              v-if="isModerator"
              :to="`/community/${community.data.slug}/dashboard`"
              class="font-bold md:text-lg whitespace-nowrap border-b-4 py-2 md:py-1 px-2 md:px-3 hover:bg-stone-200 dark:hover:bg-stone-700"
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
