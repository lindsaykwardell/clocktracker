<template>
  <div class="bg-stone-950 shadow-lg">
    <div
      class="flex flex-col items-center w-full md:w-3/4 lg:w-2/3 xl:w-1/2 m-auto pt-4"
    >
      <div class="flex flex-col lg:flex-row items-center gap-3 w-full">
        <Avatar
          :value="player.avatar || ''"
          class="border-2 shadow-xl flex-shrink"
          size="lg"
        />
        <div class="flex-grow flex flex-col md:items-start">
          <h3 class="font-dumbledor text-2xl lg:text-3xl">
            {{ player.display_name }}
          </h3>
          <div class="md:text-lg text-stone-400">
            <h4>{{ player.username }}</h4>
            <template v-if="player.pronouns">
              <span>{{ player.pronouns }}</span>
            </template>
          </div>
          <div
            v-if="player.location"
            class="md:text-lg text-stone-400 flex gap-2 items-center"
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
            <span>{{ player.location }}</span>
          </div>
          <div
            v-if="player.kofi_level"
            class="md:text-lg text-stone-400 flex gap-2 items-center"
          >
            <KoFi />
            <span v-if="player.kofi_level === 'ONE_TIME'">Supporter</span>
            <span v-else-if="player.kofi_level === 'SUBSCRIBER'">
              Subscriber
            </span>
          </div>
        </div>
        <FriendButton
          v-if="user && !isUser"
          :username="player.username"
          :user_id="player.user_id"
        />
      </div>
      <hr v-if="player.bio" class="border-stone-100 w-full my-4" />
      <p class="whitespace-pre-wrap text-left w-full p-4">
        {{ player.bio }}
      </p>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser();

const props = defineProps<{
  player: {
    username: string;
    user_id: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
    kofi_level: string | null;
  };
}>();

const isUser = computed(() => user.value?.id === props.player.user_id);
</script>
