<template>
  <StandardTemplate>
    <div class="max-w-3xl mx-auto p-4 lg:p-8">
      <nuxt-link to="/forum" class="text-sm underline">Back to discussions</nuxt-link>
      <h1 class="font-sorts text-3xl my-4">Your submissions</h1>
      <p v-if="route.query.submitted === '1'" role="status" class="mb-4 rounded border border-purple-400 p-3">
        <strong>Submitted for review.</strong> Your contribution will be published after moderator approval. The decision will appear here, and a push notification will be sent if you have push enabled.
      </p>
      <nuxt-link v-if="route.query.decision" to="/forum/submissions" class="block mb-4 underline">View all submissions</nuxt-link>
      <p class="mb-4 text-sm text-stone-500">Pending contributions are visible only to you and moderators. Edits leave the published version unchanged until approved.</p>
      <p v-if="error" role="alert" class="text-red-500">{{ error }}</p>
      <Loading v-if="loading" />
      <p v-else-if="!items.length">No contributions have needed review yet.</p>
      <article v-for="item in items" :key="item.id" :id="`submission-${item.id}`" class="border border-stone-300 dark:border-stone-700 rounded p-4 mb-4">
        <strong>{{ labels[item.status] }}</strong>
        <span class="ml-2 text-sm text-stone-500">{{ new Date(item.created_at).toLocaleString() }}</span>
        <h2 v-if="item.title" class="font-sorts text-xl mt-2 break-words">{{ item.title }}</h2>
        <pre class="whitespace-pre-wrap break-words font-sans my-3 text-sm">{{ item.body }}</pre>
        <p class="text-sm">{{ item.status === 'PENDING' ? item.reason : item.review_reason }}</p>
        <Button v-if="item.status === 'PUBLISHED'" size="sm" color="secondary" class="mt-3" @click="viewPublished(item.id)">View published contribution</Button>
      </article>
    </div>
  </StandardTemplate>
</template>
<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
const items = ref<any[]>([]);
const route = useRoute();
const error = ref('');
const loading = ref(true);
const labels: Record<string, string> = { PENDING: 'Awaiting review', PUBLISHED: 'Approved', REJECTED: 'Not published' };
async function viewPublished(id: string) {
  try {
    const result = await $fetch(`/api/forum/submissions/${id}/location`);
    await navigateTo(result.url);
  } catch { error.value = 'This contribution is no longer available to view.'; }
}
async function loadSubmissions() {
  loading.value = true;
  error.value = '';
  try {
    items.value = await $fetch('/api/forum/submissions', { query: { decision: route.query.decision || undefined } });
    loading.value = false;
    await nextTick();
    const ids = items.value.filter(item => item.status !== 'PENDING' && !item.decision_seen_at).map(item => item.id);
    if (ids.length) await $fetch('/api/forum/submissions/read', { method: 'POST', body: { ids } });
  }
  catch { error.value = 'Unable to load submissions. Please try again.'; }
  finally { loading.value = false; }
}
onMounted(loadSubmissions);
watch(() => route.query.decision, loadSubmissions);
useHead({ title: 'Your submissions' });
</script>
