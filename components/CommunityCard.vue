<template>
  <div class="ct-card ct-card--role flex flex-col md:flex-row items-center md:items-top gap-4">
    <Avatar :value="community.icon" size="lg" />

    <div class="flex-grow flex flex-col items-center md:items-start gap-2">
      <div class="ct-card__header">
        <h2 class="ct-card__title text-center md:text-start">
          <nuxt-link
            :to="`/community/${community.slug}`"
            class="overlay-link"
          >
            {{ community.name }}
          </nuxt-link>
        </h2>
      </div>
      
      <div
        v-if="community.location"
        class="dark:text-stone-400 flex gap-2 items-center"
      >
        <IconUI id="location" />
        <span class="sr-only">Location: </span><span>{{ community.location }}</span>
      </div>

      <p class="whitespace-pre-wrap text-center md:text-start w-full max-w-[80ch]">
        {{ community.description }}
      </p>

      <section class="ct-card__tags">
        <div>
          <Badge color="games" size="sm">
            {{ community._count.members }} 
          </Badge>
          Member{{ community._count.members === 1 ? "" : "s" }}
        </div>
        <div>
          <Badge color="admins" size="sm">
            {{ community._count.admins }} 
          </Badge>
          Admin{{ community._count.admins === 1 ? "" : "s" }}
        </div>
        <div>
          <Badge color="scripts" size="sm">
            {{ community._count.posts }} 
          </Badge>
          Post{{ community._count.posts === 1 ? "" : "s" }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  community: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    location: string | null;
    _count: {
      members: number;
      admins: number;
      posts: number;
    };
  };
}>();
</script>
