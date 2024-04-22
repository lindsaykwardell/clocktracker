<template>
  <nuxt-link
    :to="`/community/${community.slug}`"
    class="bg-stone-300 dark:bg-stone-950 hover:bg-stone-200 dark:hover:bg-stone-900 w-full p-2 shadow-lg flex items-center"
  >
    <div class="flex flex-col md:flex-row gap-3 items-top">
      <Avatar :value="community.icon" size="lg" class="m-auto" />
      <div class="flex-grow">
        <h2 class="font-dumbledor text-xl lg:text-2xl">
          {{ community.name }}
        </h2>
        <p class="whitespace-pre-wrap text-left w-full py-4">
          {{ community.description }}
        </p>
        <section class="flex gap-6 text-stone-600">
          <div>
            <span
              class="text-stone-200 bg-blue-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ community._count.members }}
            </span>
            <span> Member{{ community._count.members === 1 ? "" : "s" }} </span>
          </div>
          <div>
            <span
              class="text-stone-200 bg-green-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ community._count.admins }}
            </span>
            <span> Admin{{ community._count.admins === 1 ? "" : "s" }} </span>
          </div>
          <div>
            <span
              class="text-stone-200 bg-purple-800 rounded-full px-2 py-1 text-xs font-bold aspect-square"
            >
              {{ community._count.posts }}
            </span>
            <span> Post{{ community._count.posts === 1 ? "" : "s" }} </span>
          </div>
        </section>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
defineProps<{
  community: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    _count: {
      members: number;
      admins: number;
      posts: number;
    };
  };
}>();
</script>
