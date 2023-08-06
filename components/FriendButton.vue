<template>
  <button
    @click.prevent="alterFriendshipStatus"
    class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150"
    :class="friendButtonClass"
  >
    <img src="/img/role/empath.png" class="w-8 h-8" />
    <span>{{ friendButtonText }}</span>
  </button>
</template>

<script setup lang="ts">
const friends = useFriends();

const props = defineProps<{
  user_id: string;
  username: string;
}>()

const friendButtonText = computed(() => {
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      return "Unfriend";
    case FriendStatus.REQUEST_SENT:
      return "Cancel";
    case FriendStatus.REQUEST_RECEIVED:
      return "Accept";
    case FriendStatus.NOT_FRIENDS:
      return "Add Friend";
  }
});

const friendButtonClass = computed(() => {
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      return "bg-blue-950 hover:bg-blue-900";
    case FriendStatus.REQUEST_SENT:
      return "bg-blue-950 hover:bg-blue-900";
    case FriendStatus.REQUEST_RECEIVED:
      return "bg-blue-950 hover:bg-blue-900";
    case FriendStatus.NOT_FRIENDS:
      return "bg-blue-950 hover:bg-blue-900";
  }
});

function alterFriendshipStatus() {
  const friendRequest = friends.getFriendRequest(props.user_id);
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      friends.unfriend(props.username);
      break;
    case FriendStatus.REQUEST_SENT:
      friends.cancelRequest(props.user_id);
      break;
    case FriendStatus.REQUEST_RECEIVED:
      if (friendRequest) friends.acceptRequest(friendRequest.id);
      break;
    case FriendStatus.NOT_FRIENDS:
      friends.sendRequest(props.user_id);
      break;
  }
}
</script>
