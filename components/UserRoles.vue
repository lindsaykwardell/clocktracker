<template>
  <h2 v-if="!condensed" class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
    Collection
  </h2>
  <div
    v-if="allRolesLoaded"
    class="grid gap-3"
    :class="{
      'lg:grid-cols-6': !condensed,
    }"
  >
    <div
      v-for="roleGroup in allRoles"
      :key="roleGroup.name"
      :class="{
        'col-span-1': roleGroup.name !== 'Townsfolk',
        'lg:col-span-2': roleGroup.name === 'Townsfolk',
      }"
    >
      <template v-if="!condensed">
        <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ roleGroup.name }}
          <span class="text-base">({{ roleGroup.playedCount }}/{{ roleGroup.roles.length }})</span>
        </h3>
      </template>
      <template v-else >
        <h2 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          {{ roleGroup.name }}
        </h2>
      </template>
      
      <ul class="flex flex-wrap justify-center gap-1">
        <li v-for="role in roleGroup.roles" :key="role.id">
          <nuxt-link :to="`/roles/${role.id}`">
            <div class="relative">
              <div
                v-if="!characterIsPlayed(role.id)"
                class="absolute top-0 left-0 bg-neutral-200/75 dark:bg-stone-800/75 rounded-full aspect-square w-full h-full z-10"
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
import naturalOrder from "natural-order";

const roles = useRoles();

const props = defineProps<{
  games: FetchStatus<GameRecord[]>;
  condensed?: boolean;
}>();

const townsfolk = computed(() => {
  return naturalOrder(roles.getRoleByType(RoleType.TOWNSFOLK))
    .orderBy("asc")
    .sort(["name"]);
});

const outsiders = computed(() => {
  return naturalOrder(roles.getRoleByType(RoleType.OUTSIDER))
    .orderBy("asc")
    .sort(["name"]);
});

const minions = computed(() => {
  return naturalOrder(roles.getRoleByType(RoleType.MINION))
    .orderBy("asc")
    .sort(["name"]);
});

const demons = computed(() => {
  return naturalOrder(roles.getRoleByType(RoleType.DEMON))
    .orderBy("asc")
    .sort(["name"]);
});

const travelers = computed(() => {
  return naturalOrder(roles.getRoleByType(RoleType.TRAVELER))
    .orderBy("asc")
    .sort(["name"]);
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

// All played characters (filtered for stats)
const allPlayedCharacters = computed(() => {
  if (props.games.status !== Status.SUCCESS) {
    return [];
  }

  return props.games.data
    .filter((game) => !game.ignore_for_stats)
    .flatMap((game) => game.player_characters)
    .filter((character) => character.name);
});

// Set of played role IDs for quick lookup
const playedRoleIds = computed<Set<string>>(() => {
  const ids = allPlayedCharacters.value
    .map((character) => character.role_id)
    .filter((id): id is string => !!id);

  return new Set(ids);
});

// Role groups + played counts
const allRoles = computed(() => {
  const baseGroups = [
    { name: "Townsfolk", roles: townsfolk.value },
    { name: "Outsiders", roles: outsiders.value },
    { name: "Minions", roles: minions.value },
    { name: "Demons", roles: demons.value },
    { name: "Travelers", roles: travelers.value },
  ];

  return baseGroups.map((group) => {
    const playedCount = group.roles.filter((role) =>
      playedRoleIds.value.has(role.id)
    ).length;

    return {
      ...group,
      playedCount,
    };
  });
});

// Used by the overlay
const characterIsPlayed = (roleId: string) => playedRoleIds.value.has(roleId);

onMounted(() => {
  roles.fetchRoles();
});
</script>
