<template>
  <AdminTemplate title="Moderation Queue" :has-access="allowed">
    <p class="mb-4 text-sm text-stone-500">Review held contributions before they become visible. Published content stays unchanged while edits await review.</p>
    <div class="flex flex-wrap gap-2 mb-4">
      <Button size="sm" :color="!reviewed ? 'primary' : 'secondary'" @click="reviewed = false">Pending</Button>
      <Button size="sm" :color="reviewed ? 'primary' : 'secondary'" @click="reviewed = true">Reviewed</Button>
      <nuxt-link to="/admin/forum/reports"><Button size="sm" color="secondary">Reported posts</Button></nuxt-link>
    </div>
    <p v-if="error" role="alert" class="text-red-500 mb-4">{{ error }}</p>
    <Loading v-if="loading" />
    <p v-else-if="items.length === 0" class="py-8 text-center text-stone-500">{{ reviewed ? 'No reviewed contributions.' : 'Nothing awaiting review.' }}</p>
    <div class="flex flex-col gap-4">
      <article v-for="item in items" :key="item.id" class="p-4 border border-stone-300 dark:border-stone-700 rounded min-w-0">
        <div class="flex flex-wrap justify-between gap-2 text-sm">
          <strong>{{ item.author.display_name }} · {{ labels[item.kind] }}</strong>
          <span>{{ item.status }} · {{ new Date(item.created_at).toLocaleString() }}</span>
        </div>
        <p class="text-sm text-stone-500 mt-1">{{ item.thread.category.name }} · {{ item.reason }}</p>
        <h3 v-if="item.title" class="font-sorts text-xl mt-3 break-words">{{ item.title }}</h3>
        <pre class="whitespace-pre-wrap break-words font-sans text-sm my-3">{{ item.body }}</pre>
        <details v-if="item.base_body || item.base_title" class="mb-3 text-sm">
          <summary>Version when submitted</summary>
          <pre class="whitespace-pre-wrap break-words font-sans mt-2">{{ item.base_title || item.base_body }}</pre>
        </details>
        <p v-if="item.review_reason" class="text-sm">Decision: {{ item.review_reason }}</p>
        <template v-if="item.status === 'PENDING'">
          <label :for="`reason-${item.id}`" class="block text-sm mb-1">Reason shown to the author</label>
          <textarea :id="`reason-${item.id}`" v-model="reasons[item.id]" maxlength="1000" rows="2" class="w-full p-2 rounded border border-stone-400 bg-white dark:bg-stone-900" />
          <div class="flex gap-2 mt-2">
            <Button size="sm" color="primary" :disabled="busy || !reasons[item.id]?.trim()" @click="review(item.id, 'approve')">Approve</Button>
            <Button size="sm" color="negative" :disabled="busy || !reasons[item.id]?.trim()" @click="review(item.id, 'reject')">Reject</Button>
          </div>
        </template>
      </article>
    </div>
    <p v-if="items.length === 100" class="mt-4 text-sm">Showing the oldest 100 matching contributions. Review pending items to reveal the next batch.</p>
  </AdminTemplate>
</template>
<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
const allowed = ref(false);
const reviewed = ref(false);
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const items = ref<any[]>([]);
const reasons = reactive<Record<string, string>>({});
const labels: Record<string, string> = { THREAD: 'New thread', POST: 'Reply', EDIT_POST: 'Post edit', EDIT_TITLE: 'Title edit' };
async function refresh() {
  loading.value = true;
  error.value = '';
  try { items.value = await $fetch('/api/forum/moderation', { query: { status: reviewed.value ? 'reviewed' : 'pending' } }); }
  catch (err: any) { error.value = err?.data?.statusMessage || 'Unable to load moderation queue.'; }
  finally { loading.value = false; }
}
async function review(id: string, action: string) {
  busy.value = true;
  error.value = '';
  try {
    await $fetch(`/api/forum/moderation/${id}/review`, { method: 'POST', body: { action, reason: reasons[id] } });
    await refresh();
  } catch (err: any) { error.value = err?.data?.statusMessage || 'Unable to save decision.'; }
  finally { busy.value = false; }
}
onMounted(async () => {
  try {
    const me = await $fetch('/api/forum/me');
    allowed.value = me.is_admin || (me.permissions.includes('VIEW_REPORTS') && me.permissions.includes('EDIT_ANY_POST'));
    if (allowed.value) await refresh();
  } catch { error.value = 'Unable to check moderation access.'; }
  finally { loading.value = false; }
});
watch(reviewed, refresh);
useHead({ title: 'Moderation Queue' });
</script>
