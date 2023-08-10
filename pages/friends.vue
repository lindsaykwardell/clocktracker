<template>
  <AuthenticatedTemplate>
    <template
      v-if="
        friends.friends.status === Status.SUCCESS &&
        friends.requests.status === Status.SUCCESS
      "
    >
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
          <div class="p-2">
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
          </div>
        </UserCard>
      </template>
      <p class="text-center text-2xl my-4 font-dumbledor">Friends</p>
      <UserCard
        v-for="friend in friends.getFriends"
        :username="friend.username"
      >
        <div class="p-2">
          <FriendButton :username="friend.username" :user_id="friend.user_id" />
        </div>
      </UserCard>
    </template>
    <template v-else>
      <div class="w-full h-screen flex justify-center items-center">
        <Loading />
      </div>
    </template>
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
