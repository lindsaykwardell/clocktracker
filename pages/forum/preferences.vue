<template>
  <StandardTemplate>
    <div class="max-w-3xl mx-auto p-4 lg:p-8">
      <nuxt-link to="/forum" class="text-sm underline">Back to discussions</nuxt-link>
      <h1 class="font-sorts text-3xl my-4">Muted users</h1>
      <p class="text-sm mb-4">Muted content stays in discussions behind a “View muted content” control. Notifications from muted users are silenced. Muting does not restrict anyone’s ability to reply or react.</p>
      <p v-if="error" role="alert" class="text-red-500 mb-3">{{ error }}</p>
      <Loading v-if="loading" />
      <p v-else-if="!items.length">No muted users. Use the post actions menu to mute someone.</p>
      <div v-for="item in items" :key="item.target_id" class="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-stone-300 dark:border-stone-700">
        <span>{{ item.target.display_name }} · Muted</span>
        <Button size="sm" color="secondary" :disabled="busy" @click="remove(item)">Unmute</Button>
      </div>
    </div>
    <Dialog v-model:visible="showResult" size="sm">
      <template #title><h2 class="font-sorts text-xl">Preference updated</h2></template>
      <div class="p-4 flex flex-col gap-4">
        <p role="status">{{ resultMessage }}</p>
        <Button color="secondary" @click="showResult = false">Done</Button>
      </div>
    </Dialog>
  </StandardTemplate>
</template>
<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
const items = ref<any[]>([]);
const error = ref('');
const loading = ref(true);
const busy = ref(false);
async function refresh() {
  try { items.value = await $fetch('/api/forum/preferences'); }
  catch { error.value = 'Unable to load user preferences.'; }
  finally { loading.value = false; }
}
const showResult = ref(false);
const resultMessage = ref("");
const { muted } = useForumMutes();
async function remove(item: { target_id: string; kind: string; target: { display_name: string } }) {
  const targetId = item.target_id;
  busy.value = true;
  error.value = '';
  try { await $fetch('/api/forum/preferences', { method: 'PUT', body: { targetId, kind: null } }); muted.value[targetId] = false;
    resultMessage.value = `${item.target.display_name} has been unmuted.`;
    showResult.value = true;
    await refresh(); }
  catch { error.value = 'Unable to update this preference.'; }
  finally { busy.value = false; }
}
onMounted(refresh);
useHead({ title: 'Muted users' });
</script>
