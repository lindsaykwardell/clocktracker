<template>
  <StandardTemplate>
    <template
      v-if="
        friends.friends.status === Status.SUCCESS &&
        friends.requests.status === Status.SUCCESS
      "
    >
      <template v-if="friends.getFriendRequests.length > 0">
        <p class="text-center text-2xl my-4 font-dumbledor">Friend Requests</p>
        <div class="flex flex-wrap gap-3 justify-center">
          <FriendCard
            v-for="request in friends.getFriendRequests"
            :username="
              request.user_id === user?.id
                ? request.from_user.username
                : request.user.username
            "
            class="w-full sm:w-1/2 md:w-[325px]"
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
          </FriendCard>
        </div>
      </template>
      <template v-if="friends.getFriendRecommendations.length > 0">
        <p class="text-center text-2xl my-4 font-dumbledor">
          Suggested Friends
        </p>
        <div class="flex flex-wrap gap-3 justify-center">
          <FriendCard
            v-for="recommended in friends.getFriendRecommendations"
            :username="recommended.username"
            class="w-full sm:w-1/2 md:w-[325px]"
          >
            <div class="p-2">
              <FriendButton
                :username="recommended.username"
                :user_id="recommended.user_id"
              />
            </div>
          </FriendCard>
        </div>
      </template>
      <p class="text-center text-2xl my-4 font-dumbledor">Friends</p>
      <div class="flex flex-wrap gap-3 justify-center">
        <FriendCard
          v-for="friend in friends.getFriends"
          :username="friend.username"
          class="w-full sm:w-1/2 md:w-[325px]"
        >
          <div class="p-2">
            <FriendButton
              :username="friend.username"
              :user_id="friend.user_id"
            />
          </div>
        </FriendCard>
      </div>
    </template>
    <template v-else>
      <div class="w-full h-screen flex justify-center items-center">
        <Loading />
      </div>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
const friends = useFriends();
const user = useSupabaseUser();

onMounted(() => {
  friends.fetchFriends();
  friends.fetchRequests();
  friends.fetchRecommended();
});
</script>
