<template>
  <nuxt-link
    v-if="player.status === Status.SUCCESS"
    :to="`/@${player.data.username}`"
    class="bg-stone-950 hover:bg-stone-900 transition duration-150 shadow-lg flex flex-col justify-center items-center"
  >
    <div class="flex flex-col items-center w-full p-2 m-auto gap-3">
      <Avatar
        :value="player.data.avatar || ''"
        class="border-2 shadow-xl flex-shrink"
        size="md"
      />
      <div class="flex flex-col md:flex-row items-center gap-3 w-full">
        <div class="flex-grow flex flex-col">
          <h3 class="font-dumbledor text-xl">
            {{ player.data.display_name }}
          </h3>
          <div class="text-stone-400 flex">
            <span>{{ player.data.username }}</span>
            <span v-if="player.data.pronouns">
              &nbsp;({{ player.data.pronouns }})
            </span>
          </div>
        </div>
      </div>
    </div>
    <div>
      <slot />
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
const users = useUsers();

const props = defineProps<{
  username: string;
}>();

const player = computed(() => {
  return users.getUser(props.username);
});

onMounted(() => {
  if (player.value.status !== Status.SUCCESS) {
    users.fetchUser(props.username);
  }
});
</script>
