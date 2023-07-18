<template>
  <AuthenticatedTemplate>
    <div>
      <h1 class="font-dumbledor text-2xl text-center">Notifications</h1>
      <div v-for="notification in notifications.notifications">
        <div
          class="bg-stone-950 hover:bg-stone-900 transition duration-150 shadow-lg"
        >
          <div class="flex items-center w-full p-2 m-auto gap-3">
            <Avatar
              :value="notification.from_user.avatar || ''"
              class="border-2 shadow-xl flex-shrink"
              size="sm"
            />
            <div class="flex flex-col md:flex-row items-center gap-3 w-full">
              <div class="flex-grow flex flex-col">
                <div class="text-stone-400">
                  <a :href="`/@${notification.from_user.username}`">
                    {{ notification.message }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const notifications = useNotifications();
const user = useSupabaseUser();

onMounted(async () => {
  await notifications.markAsRead();
  await notifications.fetchNotifications(user);
});
</script>
