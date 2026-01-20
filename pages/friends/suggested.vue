<template>
  <FriendsTemplate v-slot="{ suggested }" fetchSuggested>
    <div class="flex flex-col gap-3 justify-center">
      <UserCard
        v-for="friend in suggested"
        :username="friend.username"
        class="w-full"
      >
        <template #extra>
          <template v-if="friend.frequency > 0">
            <div class="flex gap-2 items-center">
              <IconUI id="person-heart" />
              <span
                >{{ friend.frequency }} mutual friend{{
                  friend.frequency === 1 ? "" : "s"
                }}</span
              >
            </div>
          </template>
          <template v-else>
            <div class="flex gap-2 items-center">
              <IconUI id="stars" />
              <span>Recently Joined</span>
            </div>
          </template>
        </template>
        <div class="p-2">
          <FriendButton :username="friend.username" :user_id="friend.user_id" />
        </div>
      </UserCard>
    </div>
  </FriendsTemplate>
</template>
