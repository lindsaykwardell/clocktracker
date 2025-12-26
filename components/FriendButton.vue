<template>
  <div class="flex flex-col gap-2">
    <button
      @click.prevent="alterFriendshipStatus"
      class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150"
      :class="friendButtonClass"
    >
      <img src="/img/role/48x48/empath.webp" class="w-8 h-8" />
      <span :aria-label="friendButtonText"></span>
    </button>
    <button
      v-if="
        friends.getFriendStatus(props.user_id) === FriendStatus.REQUEST_RECEIVED
      "
      @click.prevent="rejectFriendship"
      class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 border border-red-900 hover:border-red-950 hover:bg-red-950"
    >
      <img src="/img/role/48x48/empath.webp" class="w-8 h-8" />
      <span>Delete</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

const friends = useFriends();

const props = defineProps<{
  user_id: string;
  username: string;
}>();

onMounted(async () => {
  if (friends.friends.status === Status.IDLE) {
    await friends.fetchFriends();
  }
  if (friends.requests.status === Status.IDLE) {
    await friends.fetchRequests();
  }
});

const friendButtonText = computed(() => {
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      return "Friends";
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
      return "friends bg-green-950 hover:bg-transparent border border-transparent hover:border-red-950 text-white hover:text-black dark:hover:text-white";
    case FriendStatus.REQUEST_SENT:
      return "request-sent border border-purple-500 dark:border-purple-800 hover:bg-purple-600 dark:hover:bg-purple-900";
    case FriendStatus.REQUEST_RECEIVED:
      return "request-received border border-purple-500 dark:border-purple-800 hover:bg-purple-600 dark:hover:bg-purple-900";
    case FriendStatus.NOT_FRIENDS:
      return "not-friends bg-purple-500 dark:bg-purple-800 hover:bg-purple-600 dark:hover:bg-purple-900-dark";
  }
});

function alterFriendshipStatus() {
  const friendRequest = friends.getFriendRequest(props.user_id);
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      if (confirm(`Are you sure you want to unfriend ${props.username}?`)) {
        friends.unfriend(props.username);
      }
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

function rejectFriendship() {
  friends.cancelRequest(props.user_id);
}
</script>

<style scoped>
div button.not-friends:first-child span:before {
  content: "Add Friend";
}

div button.request-sent:first-child span:before {
  content: "Cancel";
}

div button.request-received:first-child span:before {
  content: "Accept";
}

div button.friends:first-child span:before {
  content: "Friends";
}

div button.friends:first-child:hover span:before {
  content: "Unfriend";
}
</style>
