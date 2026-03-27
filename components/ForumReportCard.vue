<template>
  <div
    class="p-4 rounded border border-stone-300 dark:border-stone-700/50
           bg-stone-300/40 dark:bg-stone-900/50"
  >
    <div class="flex items-start justify-between gap-4 mb-2">
      <div class="text-xs text-stone-500 dark:text-stone-400">
        Reported by
        <span class="font-semibold">{{ report.reporter.display_name }}</span>
        &middot; {{ formatDate(report.created_at) }}
      </div>
      <div v-if="report.resolved" class="shrink-0 text-xs text-stone-400 text-right">
        Resolved by {{ report.resolver?.display_name }}
        <br />
        {{ formatDate(report.resolved_at) }}
      </div>
    </div>
    <p class="text-sm mb-3">{{ report.reason }}</p>

    <div
      class="p-3 rounded border border-stone-300/50 dark:border-stone-700/30
             bg-stone-200/50 dark:bg-stone-800/50"
    >
      <div class="flex items-center gap-2 mb-1">
        <nuxt-link
          :to="`/@${report.post.author.username}`"
          class="text-sm font-semibold hover:underline"
        >
          {{ report.post.author.display_name }}
        </nuxt-link>
        <span v-if="report.post.deleted_at" class="text-xs text-red-400">[deleted]</span>
      </div>

      <!-- Edit mode -->
      <template v-if="editing">
        <div class="flex flex-col gap-2 mt-2">
          <ExpandingTextarea v-model="editBody" :rows="5" />
          <div class="flex gap-2">
            <Button size="sm" color="primary" @click="submitEdit">Save</Button>
            <Button size="sm" color="secondary" @click="cancelEdit">Cancel</Button>
          </div>
        </div>
      </template>
      <!-- Display mode -->
      <template v-else>
        <div
          class="text-sm text-stone-400"
          :class="{ 'line-clamp-3': !expanded }"
        >
          <MarkdownRenderer
            class="post text-sm"
            :source="report.post.body"
            :options="{ html: false }"
          />
        </div>
        <button
          v-if="report.post.body.length > 200"
          type="button"
          class="text-xs text-primary hover:underline mt-1 block"
          @click="expanded = !expanded"
        >
          {{ expanded ? "Show less" : "View more" }}
        </button>
      </template>

      <nuxt-link
        :to="postLink"
        class="text-xs text-primary hover:underline mt-2 block"
      >
        {{ report.post.thread.title }} &rarr;
      </nuxt-link>
    </div>

    <!-- Actions -->
    <div class="flex items-center flex-wrap gap-2 mt-3">
      <template v-if="!report.resolved">
        <Button size="sm" color="primary" @click="$emit('resolve', report.id)">
          Resolve
        </Button>
      </template>

      <template v-if="!report.post.deleted_at">
        <Button
          size="sm"
          color="secondary"
          icon="edit"
          @click="startEdit"
        >
          Edit
        </Button>
        <Button
          size="sm"
          color="negative"
          icon="trash"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>

      <Button
        v-if="report.post.author.user_id"
        size="sm"
        color="caution"
        icon="disabled"
        @click="openBanDialog"
      >
        Ban {{ report.post.author.display_name }}
      </Button>
    </div>

    <!-- Ban Dialog -->
    <Dialog v-model:visible="showBanDialog" size="sm">
      <template #title>
        <h2 class="font-sorts text-xl">Ban {{ report.post.author.display_name }}</h2>
      </template>
      <div class="p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-stone-400">Reason (optional)</label>
          <Input v-model="banReason" placeholder="Reason for ban" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-stone-400">Duration</label>
          <select
            v-model="banDuration"
            class="w-full rounded border border-stone-300 dark:border-stone-700
                   bg-white dark:bg-stone-900 px-2 py-1 text-sm"
          >
            <option value="">Permanent</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </div>
        <div class="flex gap-2">
          <Button color="negative" @click="submitBan">Confirm Ban</Button>
          <Button color="secondary" @click="showBanDialog = false">Cancel</Button>
        </div>
        <p v-if="banError" class="text-sm text-red-500">{{ banError }}</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">

export type ForumReport = {
  id: string;
  reason: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  reporter: { display_name: string; username: string };
  resolver: { display_name: string; username: string } | null;
  post: {
    id: string;
    body: string;
    deleted_at: string | null;
    page: number;
    author: { user_id: string; display_name: string; username: string };
    thread: {
      id: string;
      title: string;
      category: { slug: string };
    };
  };
};

const props = defineProps<{
  report: ForumReport;
}>();

const emit = defineEmits<{
  resolve: [reportId: string];
  deleted: [reportId: string];
  edited: [reportId: string, newBody: string];
}>();

const expanded = ref(false);
const editing = ref(false);
const editBody = ref("");

// Ban state
const showBanDialog = ref(false);
const banReason = ref("");
const banDuration = ref("");
const banError = ref("");

const postLink = computed(() => {
  const { slug } = props.report.post.thread.category;
  const threadId = props.report.post.thread.id;
  const page = props.report.post.page;
  const postId = props.report.post.id;
  return `/forum/${slug}/${threadId}?page=${page}#post-${postId}`;
});

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function startEdit() {
  editing.value = true;
  editBody.value = props.report.post.body;
}

function cancelEdit() {
  editing.value = false;
  editBody.value = "";
}

async function submitEdit() {
  if (!editBody.value.trim()) return;
  try {
    await $fetch(`/api/forum/posts/${props.report.post.id}`, {
      method: "PUT",
      body: { body: editBody.value },
    });
    emit("edited", props.report.id, editBody.value);
    cancelEdit();
  } catch (err: any) {
    console.error(err);
  }
}

async function handleDelete() {
  if (!confirm("Are you sure you want to delete this post?")) return;
  try {
    await $fetch(`/api/forum/posts/${props.report.post.id}`, { method: "DELETE" });
    emit("deleted", props.report.id);
  } catch (err: any) {
    console.error(err);
  }
}

function openBanDialog() {
  banReason.value = "";
  banDuration.value = "";
  banError.value = "";
  showBanDialog.value = true;
}

async function submitBan() {
  banError.value = "";

  let expires_at: string | undefined;
  if (banDuration.value) {
    const durations: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    expires_at = new Date(Date.now() + durations[banDuration.value]).toISOString();
  }

  try {
    await $fetch("/api/forum/bans", {
      method: "POST",
      body: {
        user_id: props.report.post.author.user_id,
        reason: banReason.value || undefined,
        expires_at,
      },
    });
    showBanDialog.value = false;
  } catch (err: any) {
    banError.value =
      err?.data?.statusMessage || err?.statusMessage || "Failed to ban user";
  }
}
</script>
