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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 16 16"
              >
                <path
                  fill="#888888"
                  d="M8.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m2.4 7.506c.11.542-.348.994-.9.994H2c-.553 0-1.01-.452-.902-.994a5.002 5.002 0 0 1 9.803 0M14.002 12h-1.59a2.556 2.556 0 0 0-.04-.29a6.476 6.476 0 0 0-1.167-2.603a3.002 3.002 0 0 1 3.633 1.911c.18.522-.283.982-.836.982M12 8a2 2 0 1 0 0-4a2 2 0 0 0 0 4"
                />
              </svg>
              <span
                >{{ friend.frequency }} mutual friend{{
                  friend.frequency === 1 ? "" : "s"
                }}</span
              >
            </div>
          </template>
          <template v-else>
            <div class="flex gap-2 items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#888888"
                  d="M18 11h-2q-.425 0-.712-.288T15 10q0-.425.288-.712T16 9h2V7q0-.425.288-.712T19 6q.425 0 .713.288T20 7v2h2q.425 0 .713.288T23 10q0 .425-.288.713T22 11h-2v2q0 .425-.288.713T19 14q-.425 0-.712-.288T18 13zm-9 1q-1.65 0-2.825-1.175T5 8q0-1.65 1.175-2.825T9 4q1.65 0 2.825 1.175T13 8q0 1.65-1.175 2.825T9 12m-8 6v-.8q0-.85.438-1.562T2.6 14.55q1.55-.775 3.15-1.162T9 13q1.65 0 3.25.388t3.15 1.162q.725.375 1.163 1.088T17 17.2v.8q0 .825-.587 1.413T15 20H3q-.825 0-1.412-.587T1 18"
                />
              </svg>
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
