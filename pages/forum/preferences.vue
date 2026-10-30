<template>
  <StandardTemplate>
    <div class="max-w-3xl mx-auto p-4 lg:p-8">
      <nuxt-link to="/forum" class="text-sm underline">Back to discussions</nuxt-link>
      <h1 class="font-sorts text-3xl my-4">Muted and blocked users</h1>
      <p class="text-sm mb-4">Muting hides a user's forum content and notifications from you. Blocking also hides your content from them and prevents replies to each other's threads and reactions to each other's posts. These settings apply only to discussions.</p>
      <p v-if="error" role="alert" class="text-red-500 mb-3">{{ error }}</p>
      <Loading v-if="loading" />
      <p v-else-if="!items.length">No muted or blocked users. Use the controls below any post to add one.</p>
      <div v-for="item in items" :key="item.target_id" class="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-stone-300 dark:border-stone-700">
        <span>{{ item.target.display_name }} · {{ item.kind === 'MUTE' ? 'Muted' : 'Blocked' }}</span>
        <Button size="sm" color="secondary" :disabled="busy" @click="remove(item.target_id)">{{ item.kind === 'MUTE' ? 'Unmute' : 'Unblock' }}</Button>
      </div>
    </div>
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
async function remove(targetId: string) {
  busy.value = true;
  error.value = '';
  try { await $fetch('/api/forum/preferences', { method: 'PUT', body: { targetId, kind: null } }); await refresh(); }
  catch { error.value = 'Unable to update this preference.'; }
  finally { busy.value = false; }
}
onMounted(refresh);
useHead({ title: 'Muted and blocked users' });
</script>
