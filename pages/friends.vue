<template>
  <AuthenticatedTemplate>
    <template v-if="friends.getFriendRequests.length > 0">
      <p class="text-center text-2xl my-4 font-dumbledor">Friend Requests</p>
      <UserCard
        v-for="request in friends.getFriendRequests"
        :username="
          request.user_id === user?.id
            ? request.from_user.username
            : request.user.username
        "
      >
        <FriendButton
          :username="
            request.user_id === user?.id
              ? request.from_user.username
              : request.user.username
          "
          :user_id="
            request.user_id === user?.id
              ? request.from_user.user_id
              : request.user.user_id
          "
        />
      </UserCard>
    </template>
    <p class="text-center text-2xl my-4 font-dumbledor">Friends</p>
    <div class="flex flex-wrap gap-4 w-full">
      <UserCard
        v-for="friend in friends.getFriends"
        :username="friend.username"
        class="w-full md:w-1/2"
      >
        <FriendButton :username="friend.username" :user_id="friend.user_id"
      /></UserCard>
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const friends = useFriends();
const user = useSupabaseUser();

onMounted(() => {
  friends.fetchFriends();
  friends.fetchRequests();
});
</script>
