<template>
  <div id="topbar">
    <Button
      id="sidebar-toggle"
      @click="toggleSidebar"
      icon="menu-open"
      :class="showMenu ? '' : 'rotate'"
      iconSize="lg"
      display="icon-only"
      title="Expand sidebar"
      color="contrast"
    >
      Expand Menu
    </Button> 
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
          color="light"
        />
        <!-- @todo This form should have a submit for WCAG -->
        <div class="absolute right-2 top-[50%] -translate-y-[50%] w-6 h-6">
          <ImageUI image="investigator" />
        </div>
      </form>
    </div>
    <div v-if="!expandSearchBar" class="hidden md:block md:flex-grow" />
    <div class="min-w-[40px]">
      <Button
        v-if="dark !== null"
        id="theme-toggle"
        @click="toggleTheme"
        :icon="dark ? 'sun' : 'moon'"
        :active="dark"
        iconSize="lg"
        display="icon-only"
        :title="`Switch to ${dark ? 'light theme' : 'dark'} theme`"
        color="contrast"
      >
        Switch theme
      </Button> 
    </div>
  </div>
</template>


<script setup lang="ts">
  import { watchDebounced } from "@vueuse/core";

  const props = defineProps<{
    expandSearchBar?: boolean;
    customSearch?: (query: string) => void;
    customSearchPlaceholder?: string;
  }>();

  const { showMenu, toggleSidebar } = useSidebarState();
  const dark = ref<boolean | null>(null);
  const router = useRouter();
  const route = useRoute();
  const query = ref<string>(route.query.query as string | "");

  watch(dark, () => {
    if (dark.value) {
      useDarkMode();
    } else {
      useLightMode();
    }
  });

  const toggleTheme = () => {
    if (dark.value === null) {
      dark.value = themeIsDark();
    }

    dark.value = !dark.value;
  };

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

  onMounted(() => {
    dark.value = themeIsDark();
  });
</script>

<style>
  #topbar {
    @apply sticky top-0 left-0 z-40;
    @apply flex items-center gap-1;
    @apply w-full h-[50px];
    @apply md:gap-6 px-1;
    @apply bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800/50;
  }

  #sidebar-toggle {
    svg {
      transition: rotate 150ms ease;
    }

    &.rotate svg {
      rotate: 180deg;
    }
  }
</style>

