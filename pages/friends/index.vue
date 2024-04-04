<template>
  <FriendsTemplate v-slot="{ friends }" fetchFriends>
    <div class="flex flex-col gap-3 justify-center">
      <UserCard
        v-for="friend in friends"
        :username="friend.username"
        class="w-full"
      >
      </UserCard>
    </div>
  </FriendsTemplate>
</template>
