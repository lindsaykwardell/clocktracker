<template>
  <FriendsTemplate v-slot="{ friends }" fetchFriends>
    <p class="text-center text-2xl my-4 font-dumbledor">Friends</p>
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
