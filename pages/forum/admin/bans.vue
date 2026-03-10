<template>
  <ForumAdminTemplate title="Banned Users" :has-access="canManageBans">
        <div class="flex flex-col gap-2">
          <div
            v-for="ban in bans"
            :key="ban.id"
            class="p-4 rounded border border-stone-300 dark:border-stone-700/50
                   bg-stone-300/40 dark:bg-stone-900/50 flex items-center justify-between"
          >
            <div>
              <span class="font-semibold">{{ ban.user.display_name }}</span>
              <span class="text-sm text-stone-500 ml-1">@{{ ban.user.username }}</span>
              <Badge v-if="ban.category" size="sm" color="caution" class="ml-2">
                {{ ban.category.name }}
              </Badge>
              <Badge v-else size="sm" color="negative" class="ml-2">Global</Badge>
              <p v-if="ban.reason" class="text-sm text-stone-500 dark:text-stone-400 mt-1">
                {{ ban.reason }}
              </p>
              <p v-if="ban.expires_at" class="text-xs text-stone-400 mt-1">
                Expires: {{ new Date(ban.expires_at).toLocaleDateString() }}
              </p>
            </div>
            <Button size="xs" color="secondary" @click="removeBan(ban.id)">Unban</Button>
          </div>
          <p v-if="bans.length === 0" class="text-center py-3 text-stone-400">
            No active bans.
          </p>
        </div>
  </ForumAdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const canManageBans = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("BAN_USER");
});

const bans = ref<any[]>([]);

async function fetchBans() {
  try {
    bans.value = await $fetch("/api/forum/bans");
  } catch {
    bans.value = [];
  }
}

async function removeBan(banId: string) {
  try {
    await $fetch(`/api/forum/bans/${banId}`, { method: "DELETE" });
    await fetchBans();
  } catch (err: any) {
    console.error(err);
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  if (canManageBans.value) await fetchBans();
});

watch(canManageBans, async (val) => {
  if (val) await fetchBans();
});

useHead({ title: "Banned Users - Admin" });
</script>
