<template>
  <div class="ct-card ct-card--script flex flex-col md:flex-row items-center gap-4"
  >
    <Avatar
      :value="script.logo ?? scriptLogo(script.name)"
      class="border-1 shadow-xl flex-shrink"
      size="lg"
    />                
    <div class="flex-grow flex flex-col gap-2">
      <div class="ct-card__header">
        <h2 class="ct-card__title text-center md:text-start">
          <nuxt-link
            :to="`/scripts/${encodeURIComponent(script.name.replaceAll(' ', '_'))}`"
            class="overlay-link"
          >
            {{ script.name }}
          </nuxt-link>
        </h2>
        <p class="ct-card__subline text-center md:text-start">
          By {{ script.author }}
        </p>
      </div>

      <section class="ct-card__tags">
        <div>
          <Badge color="games" size="sm">
            {{ script._count.games }}
          </Badge>
          <span> Game{{ script._count.games === 1 ? "" : "s" }} Played</span>
        </div>
      </section>
    </div>
  </div>
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
