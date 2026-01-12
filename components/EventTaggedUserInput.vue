<template>
  <div class="w-[300px] text-left flex gap-2">
    <template v-if="showAddPlayer">
      <!-- @todo Update button -->
      <Button @click="showAddPlayer = false" size="small" tertiary> ✕ </Button>
      <TaggedUserInput
        :users="addableUsers"
        v-model:value="addPlayer"
        renderListOnTop
        @optionSelected="playerSelected"
      />
    </template>
    <template v-else>
      <Button @click="showAddPlayer = true" size="small" icon="person-plus">
        Add Player
      </Button>
    </template>
  </div>
</template>

<script setup lang="ts">
import naturalOrder from "natural-order";
const communities = useCommunities();
const friends = useFriends();

const props = defineProps<{
  slug?: string;
  waitlistId?: number;
  alreadyRegisteredUserIds?: string[];
}>();

const emit = defineEmits(["addPlayer"]);

const showAddPlayer = ref(false);
const addPlayer = ref("");

const addableUsers = computed(() => {
  if (props.slug) {
    const community = communities.getCommunity(props.slug);
    if (community.status !== Status.SUCCESS) {
      return [];
    }

    return naturalOrder(
      community.data.members.map((m) => ({
        id: m.user_id,
        username: m.username,
        display_name: m.display_name,
        user_id: m.user_id,
        avatar: m.avatar,
      }))
    )
      .orderBy("asc")
      .sort(["display_name", "username"])
      .filter((m) => !props.alreadyRegisteredUserIds?.includes(m.user_id));
  } else {
    return naturalOrder([
      ...friends.getCommunityMembers.map((m) => ({
        username: m.username,
        display_name: m.display_name,
        user_id: m.user_id,
        avatar: m.avatar,
      })),
      ...friends.getFriends.map((f) => ({
        username: f.username,
        display_name: f.display_name,
        user_id: f.user_id,
        avatar: f.avatar,
      })),
    ])
      .orderBy("asc")
      .sort(["display_name", "username"])
      .filter(
        (m, i, a) =>
          a.findIndex((_m) => m.user_id === _m.user_id) === i &&
          !props.alreadyRegisteredUserIds?.includes(m.user_id)
      );
  }
});

function playerSelected() {
  // Find the user in the list or create a new one
  const user = addableUsers.value.find(
    (user) => user.username === addPlayer.value
  ) ?? { display_name: addPlayer.value };

  emit("addPlayer", { user, waitlistId: props.waitlistId });

  addPlayer.value = "";
  showAddPlayer.value = false;
}
</script>
