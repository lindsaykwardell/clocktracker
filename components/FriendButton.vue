<template>
  <div class="flex flex-col gap-2">
    <Button
      @click.prevent="alterFriendshipStatus"
      :color="friendButtonColor"
      :class="friendButtonClass"
    >
      <img src="/img/ui/empath.webp" class="w-6 h-6" />
      <span :aria-label="friendButtonText"></span>
    </Button>
    <Button
      v-if="
        friends.getFriendStatus(props.user_id) === FriendStatus.REQUEST_RECEIVED
      "
      @click.prevent="rejectFriendship"
      color="negative"
    >
      <img src="/img/ui/empath.webp" class="w-6 h-6" />
      Reject Request
    </Button>
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
      return "friends";
    case FriendStatus.REQUEST_SENT:
      return "request-sent";
    case FriendStatus.REQUEST_RECEIVED:
      return "request-received";
    case FriendStatus.NOT_FRIENDS:
      return "not-friends";
  }
});

const friendButtonColor = computed(() => {
  switch (friends.getFriendStatus(props.user_id)) {
    case FriendStatus.FRIENDS:
      return "negative";
    case FriendStatus.REQUEST_SENT:
      return "caution";
    case FriendStatus.REQUEST_RECEIVED:
      return "positive";
    case FriendStatus.NOT_FRIENDS:
      return "primary";
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
  content: "Cancel Request";
}

div button.request-received:first-child span:before {
  content: "Accept Request";
}

div button.friends:first-child span:before {
  content: "Friends";
}

div button.friends:first-child:hover span:before {
  content: "Unfriend";
}
</style>
