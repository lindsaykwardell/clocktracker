<template>
  <div class="flex flex-col relative">
    <div
      class="sticky w-full flex items-center top-0 left-0 z-40 bg-white dark:bg-stone-950 h-[50px] md:gap-6 md:px-6 pl-14"
    >
      <div class="w-2" />
      <div v-if="!expandSearchBar" class="hidden md:block md:flex-grow" />
      <div
        class="relative"
        :class="{
          'flex-grow': expandSearchBar,
          'flex-grow md:flex-grow-0 md:w-[40ch]': !expandSearchBar,
        }"
      >
        <form @submit.prevent.stop="search" role="search">
          <label for="search" class="sr-only">Search</label>
          <Input
            id="search"
            v-model="query"
            type="search"
            spellcheck="false"
            :placeholder="
              customSearchPlaceholder || 'Type in a query, then press enter'
            "
            class="h-[2rem] text-sm"
          />
          <!-- @todo This form should have a submit for WCAG -->
          <div class="absolute right-2 top-[50%] -translate-y-[50%] w-6 h-6">
            <ImageUI image="investigator" />
          </div>
        </form>
      </div>
      <nuxt-link
        v-if="me.status === Status.SUCCESS"
        id="my-profile"
        :to="`/@${me.data.username}`"
        class="flex items-center gap-2 p-2"
      >
        <span class="hidden md:inline dark:text-stone-200">{{
          me.data.display_name
        }}</span>
        <Avatar :value="me.data.avatar" size="xs" aria-hidden="true" />
      </nuxt-link>
      <nuxt-link v-else-if="me.status !== Status.LOADING" to="/login">
        Login
      </nuxt-link>
      <div
        v-if="me.status === Status.LOADING"
        class="flex items-center gap-2 p-2"
      >
        <span class="hidden md:inline dark:text-stone-200">Loading...</span>
        <Avatar value="/img/default.png" size="xs" />
      </div>
    </div>
    <Button
      id="show-navbar"
      @click="showMenu = !showMenu"
      :icon="showMenu ? 'x' : 'menu'"
      iconSize="xl"
      display="icon-only"
      class="fixed top-1 left-1 z-50"
    >
      Open Menu
    </Button> 
    <nav
      class="fixed flex flex-col gap-3 p-2 rounded md:rounded-none rounded-l-none md:pb-0 top-0 bg-stone-200 dark:bg-stone-900 z-40 overflow-hidden transition duration-300 w-screen h-screen max-w-screen md:max-w-[300px]"
      :class="{
        'opacity-100': showMenu,
        'opacity-0 pointer-events-none': !showMenu,
      }"
    >
      <section
        class="h-full pb-3 flex flex-col items-center"
        :class="{
          hidden: !showMenu,
          flex: showMenu,
        }"
      >
        <nuxt-link
          id="clocktracker-icon"
          to="/"
          class="flex items-center gap-4 pb-2"
        >
          <img
            src="/logo-ct-sm.png"
            class="w-[75px] rounded-full"
            alt="ClockTracker"
          />
        </nuxt-link>
        <template v-if="me.status === Status.SUCCESS">
          <YearInReviewLink class="mb-4" id="year-in-review" />
          <NavLink id="dashboard" to="/" icon="innkeeper"> Home </NavLink>
          <NavLink
            id="my-games"
            :to="`/@${me.data.username}?view=games`"
            icon="bureaucrat"
          >
            My Games
          </NavLink>
          <NavLink id="add-game" to="/add-game" icon="mezepheles">
            Add Game
          </NavLink>
          <NavLink
            id="friends"
            to="/friends"
            icon="eviltwin"
            :notificationCount="friends.getRequestCount(me.data.user_id)"
          >
            Friends
          </NavLink>
          <NavLink id="communities" to="/community" icon="cultleader">
            Communities
          </NavLink>
          <!-- <NavLink id="events" to="/events" icon="mutant"> Events </NavLink> -->
          <NavLink id="settings" to="/settings" icon="tinker">
            Settings
          </NavLink>
          <NavLink to="/logout" icon="steward"> Logout </NavLink>
        </template>
        <template v-else>
          <NavLink id="home" to="/" icon="innkeeper"> Home </NavLink>
          <NavLink id="search" to="/search" icon="investigator">
            Search
          </NavLink>
          <NavLink to="/login" icon="steward"> Login </NavLink>
        </template>
        <div class="py-4 md:flex-grow" />
        <div class="flex flex-col gap-4 items-center">
          <div v-if="dark !== null" class="flex gap-2 items-center">
            ☀️
            <Toggle v-model="dark" size="sm" />
            🌙
          </div>
          <div class="flex justify-around gap-1">
            <Socials />
          </div>
        </div>
      </section>
    </nav>
    <main class="flex-grow">
      <ClientOnly>
        <div
          v-if="featureFlags.maintenanceIsScheduled"
          class="bg-orange-400 dark:bg-orange-900 p-2 min-h-[42px]"
        >
          <p class="ml-[42px] md:ml-0">
            On {{ formattedMaintenanceDate }}, ClockTracker will be down for
            scheduled maintenance. Please check Discord for updates.
          </p>
        </div>
      </ClientOnly>
      <div
        @click="showMenu = false"
        class="w-screen h-screen fixed top-0 left-0 z-30 transition duration-300"
        :class="{
          'bg-black/25': showMenu,
          'bg-transparent pointer-events-none': !showMenu,
        }"
      ></div>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { watchDebounced } from "@vueuse/core";
import { Status } from "@/composables/useFetchStatus";

dayjs.extend(utc);
dayjs.extend(timezone);

const props = defineProps<{
  expandSearchBar?: boolean;
  customSearch?: (query: string) => void;
  customSearchPlaceholder?: string;
}>();

const me = useMe();
const friends = useFriends();
const featureFlags = useFeatureFlags();
const router = useRouter();
const route = useRoute();

const showMenu = ref(false);
const query = ref<string>(route.query.query as string | "");

const dark = ref<boolean | null>(null);

const formattedMaintenanceDate = computed(() => {
  if (!featureFlags.maintenanceIsScheduled) return "";

  return Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(featureFlags.maintenanceIsScheduled);
});

function search() {
  if (query.value && !props.customSearch) {
    router.push({ path: "/search", query: { query: query.value } });
  }
}

watchDebounced(
  query,
  () => {
    if (props.customSearch) {
      props.customSearch(query.value);
    }
  },
  { debounce: 500, immediate: true, flush: "post" }
);

watch(dark, () => {
  if (dark.value) {
    useDarkMode();
  } else {
    useLightMode();
  }
});

onMounted(() => {
  dark.value = themeIsDark();
});

</script>
