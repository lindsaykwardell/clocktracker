<template>
  <div
    class="p-4 rounded border border-stone-300 dark:border-stone-700/50
           bg-stone-300/40 dark:bg-stone-900/50"
  >
    <div class="flex items-start justify-between gap-4 mb-1">
      <div class="flex flex-wrap gap-x-3 text-xs text-stone-600 dark:text-stone-400">
        <span>
          Reported by
          <span class="font-semibold">{{ report.reporter.display_name }}</span>
        </span>
        <span>{{ formatDate(report.created_at) }}</span>
      </div>
      <div v-if="report.resolved" class="shrink-0 text-xs text-stone-600 text-right dark:text-stone-400">
        Resolved by {{ report.resolver?.display_name }}
        <br />
        {{ formatDate(report.resolved_at) }}
      </div>
    </div>
    <p class="font-semibold mb-3">{{ report.reason }}</p>

    <div
      class="p-3 rounded border border-stone-300 dark:border-stone-700/60
             bg-stone-50 dark:bg-stone-800/60"
    >
      <div class="flex items-center gap-2 mb-1">
        <nuxt-link
          :to="`/@${report.post.author.username}`"
          class="text-sm font-semibold hover:underline"
        >
          {{ report.post.author.display_name }}
        </nuxt-link>
        <span v-if="report.post.deleted_at" class="text-xs text-red-700 dark:text-red-400">[deleted]</span>
      </div>

      <!-- Edit mode -->
      <template v-if="editing">
        <div class="flex flex-col gap-2 mt-2">
          <ExpandingTextarea v-model="editBody" :rows="5" />
          <div v-if="!report.resolved" class="flex flex-col gap-1">
            <label :for="`edit-note-${report.id}`" class="text-sm text-stone-600 dark:text-stone-400">
              Note for the mod log (optional)
            </label>
            <Input :id="`edit-note-${report.id}`" v-model="editNote" font-size="sm" :maxlength="500" />
          </div>
          <div class="flex gap-2">
            <Button size="sm" color="primary" @click="submitEdit">Save</Button>
            <Button size="sm" color="secondary" @click="cancelEdit">Cancel</Button>
          </div>
        </div>
      </template>
      <!-- Display mode -->
      <template v-else>
        <div
          class="text-sm max-w-prose"
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
          class="text-xs text-primary dark:text-purple-400 hover:underline mt-1 block"
          @click="expanded = !expanded"
        >
          {{ expanded ? "Show less" : "View more" }}
        </button>
      </template>

      <nuxt-link
        :to="postLink"
        class="text-xs text-primary dark:text-purple-400 hover:underline mt-2 block"
      >
        {{ report.post.thread.title }} &rarr;
      </nuxt-link>
    </div>

    <!-- Actions: each one settles the report, so it leaves the open list -->
    <div class="flex items-center flex-wrap gap-2 mt-3">
      <Button
        v-if="!report.resolved"
        size="sm"
        variant="soft"
        icon="check-circle"
        :disabled="busy"
        @click="dismiss"
      >
        Dismiss report
      </Button>

      <Button
        v-if="!report.post.deleted_at"
        size="sm"
        variant="soft"
        icon="edit"
        :disabled="busy || editing"
        @click="startEdit"
      >
        Edit post
      </Button>

      <!-- Split button: delete is the usual removal; the arrow adds a ban -->
      <div v-if="!report.post.deleted_at" class="relative flex gap-px">
        <Button
          size="sm"
          variant="soft"
          color="negative"
          icon="trash"
          class="!rounded-r-none"
          :disabled="busy"
          @click="handleDelete"
        >
          Delete post
        </Button>
        <Menu v-if="report.post.author.user_id" as="div" class="flex">
          <MenuButton as="template">
            <Button
              size="sm"
              variant="soft"
              color="negative"
              icon="chevron-down"
              display="icon-only"
              class="!rounded-l-none"
              :disabled="busy"
            >
              More ways to remove this post
            </Button>
          </MenuButton>
          <MenuItems class="ct-contextual-links top-full mt-1 !z-30 focus:outline-none">
            <MenuItem>
              <ButtonSubmenu color="negative" icon="disabled" @click="openBanDialog(true)">
                Delete and ban {{ report.post.author.display_name }}…
              </ButtonSubmenu>
            </MenuItem>
            <MenuItem>
              <ButtonSubmenu icon="disabled" @click="openBanDialog(false)">
                Ban {{ report.post.author.display_name }} without deleting…
              </ButtonSubmenu>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
      <Button
        v-else-if="report.post.author.user_id"
        size="sm"
        variant="soft"
        color="negative"
        icon="disabled"
        :disabled="busy"
        @click="openBanDialog(false)"
      >
        Ban {{ report.post.author.display_name }}…
      </Button>
    </div>
    <p v-if="actionNote" class="text-sm text-stone-600 dark:text-stone-400 mt-2" role="status">
      {{ actionNote }}
    </p>
    <p v-if="actionError" class="text-sm text-red-700 dark:text-red-400 mt-2" role="alert">
      {{ actionError }}
    </p>

    <!-- Delete Dialog -->
    <Dialog v-model:visible="showDeleteDialog" size="sm">
      <template #title>
        <h2 class="font-sorts text-xl">Delete this post?</h2>
      </template>
      <div class="p-4 flex flex-col gap-4">
        <p v-if="!report.resolved" class="text-sm text-stone-300">
          The post is removed from the thread and this report is closed.
        </p>
        <div class="flex flex-col gap-1">
          <label :for="`delete-note-${report.id}`" class="text-sm text-stone-300">Note for the mod log (optional)</label>
          <Input :id="`delete-note-${report.id}`" v-model="deleteNote" class="text-stone-900 dark:text-white" :maxlength="500" />
        </div>
        <div class="flex gap-2">
          <Button color="negative" :disabled="busy" @click="confirmDelete">Delete post</Button>
          <Button color="secondary" @click="showDeleteDialog = false">Cancel</Button>
        </div>
        <p v-if="deleteError" class="text-sm text-red-400" role="alert">{{ deleteError }}</p>
      </div>
    </Dialog>

    <!-- Ban Dialog -->
    <Dialog v-model:visible="showBanDialog" size="sm">
      <template #title>
        <h2 class="font-sorts text-xl">
          {{ banDeletesPost ? "Delete post and ban" : "Ban" }} {{ report.post.author.display_name }}
        </h2>
      </template>
      <div class="p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label :for="`ban-reason-${report.id}`" class="text-sm text-stone-300">Reason (optional)</label>
          <Input :id="`ban-reason-${report.id}`" v-model="banReason" class="text-stone-900 dark:text-white" placeholder="Reason for ban" />
        </div>
        <div class="flex flex-col gap-1">
          <label :for="`ban-duration-${report.id}`" class="text-sm text-stone-300">Duration</label>
          <Input :id="`ban-duration-${report.id}`" v-model="banDuration" class="text-stone-900 dark:text-white" mode="select">
            <option value="">Permanent</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </Input>
        </div>
        <div class="flex gap-2">
          <Button color="negative" :disabled="busy" @click="submitBan">
            {{ banDeletesPost ? "Delete and ban" : "Confirm ban" }}
          </Button>
          <Button color="secondary" @click="showBanDialog = false">Cancel</Button>
        </div>
        <p v-if="banError" class="text-sm text-red-400" role="alert">{{ banError }}</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

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
  resolved: [reportId: string];
  deleted: [reportId: string];
  edited: [reportId: string, newBody: string];
}>();

const expanded = ref(false);
const editing = ref(false);
const editBody = ref("");
const editNote = ref("");
const busy = ref(false);
const actionNote = ref("");
const actionError = ref("");

// Delete state
const showDeleteDialog = ref(false);
const deleteNote = ref("");
const deleteError = ref("");

// Ban state
const showBanDialog = ref(false);
const banDeletesPost = ref(false);
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
  editNote.value = "";
}

function errorMessage(err: any, fallback: string) {
  return err?.data?.statusMessage || err?.statusMessage || fallback;
}

// Marks the report as settled, unless it already was (the Resolved list).
// The outcome and note end up in the mod log.
async function settleReport(outcome: "dismissed" | "edited" | "banned", note?: string) {
  if (props.report.resolved) return;
  await $fetch(`/api/forum/reports/${props.report.id}/resolve`, {
    method: "POST",
    body: { outcome, note: note || undefined },
  });
  emit("resolved", props.report.id);
}

async function runAction(action: () => Promise<void>, fallback: string) {
  busy.value = true;
  actionNote.value = "";
  actionError.value = "";
  try {
    await action();
  } catch (err: any) {
    actionError.value = errorMessage(err, fallback);
  } finally {
    busy.value = false;
  }
}

function dismiss() {
  return runAction(() => settleReport("dismissed"), "Couldn't dismiss the report.");
}

function submitEdit() {
  if (!editBody.value.trim()) return;
  const newBody = editBody.value.trim();
  const note = editNote.value;
  return runAction(async () => {
    const result = await $fetch<{ pending?: boolean; body?: string }>(`/api/forum/posts/${props.report.post.id}`, {
      method: "PUT",
      body: { body: newBody },
    });
    cancelEdit();
    // A held edit hasn't changed the post yet, so the report stays open.
    if (result?.pending) {
      actionNote.value =
        "Your edit is waiting in the moderation queue. The post is unchanged and this report stays open until the edit is approved.";
      return;
    }
    emit("edited", props.report.id, result?.body ?? newBody);
    await settleReport("edited", note);
  }, "Couldn't save the edit.");
}

// An open report is closed by the same request, as one mod log entry.
async function deletePost(note?: string) {
  const closesReport = !props.report.resolved;
  await $fetch(`/api/forum/posts/${props.report.post.id}`, {
    method: "DELETE",
    body: closesReport ? { report_id: props.report.id, note: note || undefined } : undefined,
  });
  emit("deleted", props.report.id);
  if (closesReport) emit("resolved", props.report.id);
}

function handleDelete() {
  deleteNote.value = "";
  deleteError.value = "";
  showDeleteDialog.value = true;
}

async function confirmDelete() {
  deleteError.value = "";
  busy.value = true;
  try {
    await deletePost(deleteNote.value);
    showDeleteDialog.value = false;
  } catch (err: any) {
    deleteError.value = errorMessage(err, "Couldn't delete the post.");
  } finally {
    busy.value = false;
  }
}

function openBanDialog(deletePost: boolean) {
  banDeletesPost.value = deletePost;
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

  busy.value = true;
  let banned = false;
  try {
    await $fetch("/api/forum/bans", {
      method: "POST",
      body: {
        user_id: props.report.post.author.user_id,
        reason: banReason.value || undefined,
        expires_at,
      },
    });
    banned = true;
    // The ban reason is already on the ban's own log entry.
    if (banDeletesPost.value) await deletePost();
    else await settleReport("banned");
    showBanDialog.value = false;
  } catch (err: any) {
    const message = errorMessage(err, "Something went wrong.");
    banError.value = banned
      ? `${props.report.post.author.display_name} is banned, but the rest didn't go through: ${message}`
      : errorMessage(err, "Failed to ban user");
  } finally {
    busy.value = false;
  }
}
</script>
