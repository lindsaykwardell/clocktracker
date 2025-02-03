<template>
  <nuxt-link
    :to="`/scripts/${encodeURIComponent(script.name.replaceAll(' ', '_'))}`"
    class="bg-stone-300 dark:bg-stone-950 hover:bg-stone-200 dark:hover:bg-stone-900 w-full p-2 shadow-lg flex items-center"
  >
    <div class="flex flex-col md:flex-row gap-3 items-top">
      <img
        :src="script.logo ?? scriptLogo(script.name)"
        class="w-36 md:w-48 h-36 md:h-48"
      />
      <div class="flex-grow flex flex-col gap-2">
        <h2 class="font-sorts text-xl lg:text-2xl">
          {{ script.name }}
        </h2>
        <p class="dark:text-stone-200 text-sm lg:text-base">
          By {{ script.author }}
        </p>
        <section class="flex gap-6 text-stone-600">
          <div>
            <span
              class="text-stone-200 bg-blue-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ script._count.games }}
            </span>
            <span> Game{{ script._count.games === 1 ? "" : "s" }} Played</span>
          </div>
        </section>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const { scriptLogo } = useScripts();
defineProps<{
  script: {
    id: number;
    name: string;
    version: string;
    author: string;
    type: string;
    json_url: string;
    pdf_url: string;
    logo: string | null;
    characters_last_updated: string | null;
    _count: {
      games: number;
    };
  };
}>();
</script>
