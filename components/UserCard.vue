<template>
  <nuxt-link
    :to="`/@${player.username}`"
    class="bg-stone-950 hover:bg-stone-900 transition duration-150 shadow-lg"
  >
    <div class="flex items-center w-full p-2 m-auto gap-3">
      <Avatar
        :value="player.avatar || ''"
        class="border-2 shadow-xl flex-shrink"
        size="md"
      />
      <div class="flex flex-col md:flex-row items-center gap-3 w-full">
        <div class="flex-grow flex flex-col">
          <h3 class="font-dumbledor text-xl">
            {{ player.display_name }}
          </h3>
          <div class="text-stone-400">
            {{ player.username }}
            <template v-if="player.pronouns"> | {{ player.pronouns }}</template>
          </div>
          <div class="text-stone-400 flex gap-2 items-center">
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
            {{ player.location }}
          </div>
        </div>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    location: string | null;
  };
}>();
</script>
