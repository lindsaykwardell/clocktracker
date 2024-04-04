<template>
  <FriendsTemplate v-slot="{ requests }" fetchRequests>
    <p class="text-center text-2xl my-4 font-dumbledor">Friends</p>
    <div class="flex flex-col gap-3 justify-center min-h-[12rem]">
      <UserCard
        v-for="request in requests"
        :username="
          request.user_id === user?.id
            ? request.from_user.username
            : request.user.username
        "
        class="w-full"
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
    </div>
  </FriendsTemplate>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
</script>
