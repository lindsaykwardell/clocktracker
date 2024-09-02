<template>
  <div
    v-if="allRolesLoaded"
    class="grid gap-3 p-4"
    :class="{
      'lg:grid-cols-6': !condensed,
    }"
  >
    <div
      v-for="roleGroup in allRoles"
      :class="{
        'col-span-1': roleGroup.name !== 'Townsfolk',
        'lg:col-span-2': roleGroup.name === 'Townsfolk',
      }"
    >
      <h3 class="font-dumbledor text-2xl text-center">
        {{ roleGroup.name }}
      </h3>
      <ul class="flex flex-wrap justify-center gap-1">
        <li v-for="role in roleGroup.roles">
          <nuxt-link :to="`/roles/${role.id}`">
            <div class="relative">
              <div
                v-if="!characterIsPlayed(role.id)"
                class="absolute top-0 left-0 bg-stone-800/75 rounded-full aspect-square w-full h-full z-10"
                v-tooltip="`${role.name}`"
              />
              <Token
                :character="{
                  role: role,
                  alignment: role.initial_alignment,
                }"
                size="sm"
                v-tooltip="`${role.name}`"
              />
            </div>
          </nuxt-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const roles = useRoles();

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  condensed?: boolean;
}>();

const townsfolk = computed(() => {
  return roles.getRoleByType(RoleType.TOWNSFOLK);
});

const outsiders = computed(() => {
  return roles.getRoleByType(RoleType.OUTSIDER);
});

const minions = computed(() => {
  return roles.getRoleByType(RoleType.MINION);
});

const demons = computed(() => {
  return roles.getRoleByType(RoleType.DEMON);
});

const travelers = computed(() => {
  return roles.getRoleByType(RoleType.TRAVELER);
});

const allRolesLoaded = computed(() => {
  return (
    townsfolk.value.length &&
    outsiders.value.length &&
    minions.value.length &&
    demons.value.length &&
    travelers.value.length
  );
});

const allRoles = computed(() => {
  return [
    { name: "Townsfolk", roles: townsfolk.value },
    { name: "Outsiders", roles: outsiders.value },
    { name: "Minions", roles: minions.value },
    { name: "Demons", roles: demons.value },
    { name: "Travelers", roles: travelers.value },
  ];
});

const allPlayedCharacters = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return props.games.data
    .filter((game) => !game.ignore_for_stats)
    .flatMap((game) => game.player_characters)
    .filter((character) => character.name);
});

const characterIsPlayed = computed(
  () => (role_id: string) =>
    allPlayedCharacters.value.some((character) => character.role_id === role_id)
);

onMounted(() => {
  roles.fetchRoles();
});
</script>
