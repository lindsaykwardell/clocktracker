<template>
  <div
    class="ct-card ct-card--user flex flex-col md:flex-row items-center gap-4"
  >
    <Avatar
      :value="player.avatar || ''"
      class="border shadow-xl flex-shrink"
      size="md"
    />

    <div class="flex-grow flex flex-col gap-2">
      <div class="flex-grow flex flex-col items-center md:items-start gap-2">
        <div class="ct-card__header">
          <h3 class="ct-card__title text-center md:text-start">
            <nuxt-link
              :to="`/@${username}`"
              class="overlay-link"
            >
              {{ player.display_name }}
            </nuxt-link>  
          </h3>
          <p class="ct-card__subline text-center md:text-start">
            @{{ player.username }}
            <template v-if="player.pronouns">
              <span> - {{ player.pronouns }}</span>
            </template>
          </p>
        </div>

        <div
          v-if="player.location"
          class="flex items-center gap-2 md:text-lg dark:text-stone-400"
        >
          <IconUI id="location" />
          <span class="sr-only">Location: </span><span>{{ player.location }}</span>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-2 dark:text-stone-400 ">
          <slot name="extra" />
        </div>
      </div>
    </div>

    <div class="flex-none" v-if="player.status === Status.SUCCESS">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const users = useUsers();

const props = defineProps<{
  username: string;
}>();

const player = computed(() => {
  const user = users.getUser(props.username);

  if (user.status !== Status.SUCCESS) {
    return {
      status: user.status,
      avatar: "/img/default.png",
      display_name: props.username,
      username: props.username,
      pronouns: null,
      location: null,
    };
  }

  return { ...user.data, status: user.status };
});

onMounted(() => {
  if (player.value.status !== Status.SUCCESS) {
    users.fetchUser(props.username);
  }
});
</script>
