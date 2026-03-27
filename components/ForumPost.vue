<template>
  <div
    :id="`post-${post.id}`"
    class="p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50"
  >
    <!-- Deleted post -->
    <template v-if="post.deleted">
      <div class="flex items-center gap-2 mb-2">
        <div class="relative shrink-0">
          <Avatar
            :value="
              expanded && post.deleted_author?.avatar
                ? post.deleted_author.avatar
                : '/img/token-bg.webp'
            "
            size="sm"
            class="border-stone-800"
            :background="expanded && !!post.deleted_author"
          />
          <div
            v-if="!expanded"
            class="absolute top-0 left-0 z-10 flex justify-center w-full pointer-events-none"
          >
            <img src="/img/shroud.png" class="w-6 md:w-8" />
          </div>
        </div>
        <div>
          <template v-if="expanded && post.deleted_author">
            <nuxt-link
              :to="`/@${post.deleted_author.username}`"
              class="text-sm font-semibold hover:underline"
              :class="nameColorClass(post.deleted_author.name_color)"
              :style="nameColorStyle(post.deleted_author.name_color)"
            >
              {{ post.deleted_author.display_name }}
            </nuxt-link>
            <span
              v-if="post.deleted_author.badge"
              class="ml-1.5 text-[0.625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              :class="badgeClass(post.deleted_author.badge, post.deleted_author.name_color)"
              :style="badgeStyle(post.deleted_author.badge, post.deleted_author.name_color)"
            >
              {{ badgeLabel(post.deleted_author.badge) }}
            </span>
          </template>
          <span v-else class="text-sm text-stone-400 italic">[deleted]</span>
          <div class="text-xs text-stone-500 dark:text-stone-400">
            {{ formatDate(post.created_at) }}
            <span v-if="expanded" class="text-red-400 ml-1">[deleted]</span>
            <button
              v-if="expanded && post.edited_at"
              type="button"
              class="hover:underline ml-1"
              @click="showEditHistory(post.id)"
            >
              &middot;
              {{ post.edited_by_label ? `edited by ${post.edited_by_label}` : "edited" }}
            </button>
          </div>
        </div>
      </div>
      <template v-if="expanded && post.deleted_body">
        <MarkdownRenderer
          class="post text-sm opacity-60"
          :source="post.deleted_body"
          :options="{ html: false }"
        />
      </template>
      <p v-else class="text-sm text-stone-400 italic">[deleted]</p>
      <button
        v-if="post.deleted_body"
        type="button"
        class="text-xs text-primary hover:underline mt-2 block"
        @click="expanded = !expanded"
      >
        {{ expanded ? "Hide original" : "View original" }}
      </button>
    </template>

    <!-- Normal post -->
    <template v-else>
      <!-- Post actions: inline on desktop, 3-dot menu on mobile -->
      <div
        v-if="isLoggedIn || canEdit || canDelete || showBanAction"
        class="float-right ml-4"
      >
        <!-- Desktop: inline icons -->
        <div class="hidden sm:flex items-center gap-1">
          <Button
            v-if="isLoggedIn && !threadIsLocked"
            variant="link"
            size="sm"
            icon="reply"
            display="icon-only"
            title="Quote"
            @click="$emit('quote', post)"
          >
            Quote
          </Button>
          <Button
            v-if="isLoggedIn && post.author.user_id !== currentUserId"
            variant="link"
            size="sm"
            icon="exclamation-circle"
            display="icon-only"
            title="Report"
            @click="openReportDialog"
          >
            Report
          </Button>
          <Button
            v-if="canEdit"
            variant="link"
            size="sm"
            icon="edit"
            display="icon-only"
            title="Edit"
            @click="startEdit"
          >
            Edit
          </Button>
          <Button
            v-if="canDelete"
            variant="link"
            size="sm"
            color="negative"
            icon="trash"
            display="icon-only"
            title="Delete"
            @click="handleDelete"
          >
            Delete
          </Button>
          <Button
            v-if="showBanAction"
            variant="link"
            size="sm"
            color="caution"
            icon="disabled"
            display="icon-only"
            title="Ban user"
            @click="$emit('ban', post.author.user_id, post.author.display_name)"
          >
            Ban user
          </Button>
        </div>
        <!-- Mobile: 3-dot menu -->
        <Menu as="div" class="relative sm:hidden" v-slot="{ open }">
          <MenuButton class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors">
            <IconUI id="dots" size="sm" />
          </MenuButton>
          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-out"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div v-show="open">
              <MenuItems static class="ct-contextual-links right-0">
                <MenuItem v-if="isLoggedIn && !threadIsLocked">
                  <ButtonSubmenu icon="reply" @click="$emit('quote', post)">
                    Quote
                  </ButtonSubmenu>
                </MenuItem>
                <MenuItem v-if="isLoggedIn && post.author.user_id !== currentUserId">
                  <ButtonSubmenu icon="exclamation-circle" @click="openReportDialog">
                    Report
                  </ButtonSubmenu>
                </MenuItem>
                <MenuItem v-if="canEdit">
                  <ButtonSubmenu icon="edit" @click="startEdit">
                    Edit
                  </ButtonSubmenu>
                </MenuItem>
                <MenuItem v-if="canDelete">
                  <ButtonSubmenu icon="trash" color="negative" @click="handleDelete">
                    Delete
                  </ButtonSubmenu>
                </MenuItem>
                <MenuItem v-if="showBanAction">
                  <ButtonSubmenu
                    icon="disabled"
                    color="caution"
                    @click="$emit('ban', post.author.user_id, post.author.display_name)"
                  >
                    Ban User
                  </ButtonSubmenu>
                </MenuItem>
              </MenuItems>
            </div>
          </transition>
        </Menu>
      </div>

      <!-- Author info -->
      <div class="flex items-center gap-2 mb-2">
        <nuxt-link :to="`/@${post.author.username}`">
          <Avatar
            :value="post.author.avatar"
            size="sm"
            class="border-stone-800"
            background
          />
        </nuxt-link>
        <div>
          <div class="flex items-center gap-1.5">
            <nuxt-link
              :to="`/@${post.author.username}`"
              class="font-semibold hover:underline"
              :class="nameColorClass(post.author.name_color)"
              :style="nameColorStyle(post.author.name_color)"
            >
              {{ post.author.display_name }}
            </nuxt-link>
            <span
              v-if="post.author.badge"
              class="text-[0.625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              :class="badgeClass(post.author.badge, post.author.name_color)"
              :style="badgeStyle(post.author.badge, post.author.name_color)"
            >
              {{ badgeLabel(post.author.badge) }}
            </span>
          </div>
          <div class="text-xs text-stone-500 dark:text-stone-400">
            {{ formatDate(localEditedAt ? post.created_at : post.created_at) }}
            <button
              v-if="localEditedAt"
              type="button"
              class="hover:underline"
              @click="showEditHistory(post.id)"
            >
              &middot;
              {{ post.edited_by_label ? `edited by ${post.edited_by_label}` : "edited" }}
            </button>
          </div>
        </div>
      </div>

      <!-- Edit mode -->
      <template v-if="editing">
        <div class="flex flex-col gap-2">
          <div
            class="flex items-center justify-between text-sm border-b border-stone-300 dark:border-stone-700"
          >
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                :class="
                  editTab === 'write'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                "
                @click="editTab = 'write'"
              >
                Write
              </button>
              <button
                type="button"
                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                :class="
                  editTab === 'preview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                "
                @click="editTab = 'preview'"
              >
                Preview
              </button>
            </div>
            <MarkdownHelp />
          </div>
          <ExpandingTextarea
            v-if="editTab === 'write'"
            v-model="editBody"
            :rows="5"
          />
          <div v-else class="min-h-[7.5rem] p-2">
            <MarkdownRenderer
              v-if="editBody.trim()"
              class="post text-sm"
              :source="editBody"
              :options="{ html: false }"
            />
            <p v-else class="text-sm text-stone-400 italic">Nothing to preview</p>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Button size="sm" color="primary" @click="submitEdit">Save</Button>
              <Button size="sm" color="secondary" @click="cancelEdit">Cancel</Button>
              <Button
                variant="link"
                size="sm"
                :icon="uploadingImage ? 'dots' : 'upload'"
                :icon-spin="uploadingImage"
                :disabled="uploadingImage"
                @click="uploadImage"
              >
                Upload image
              </Button>
              <ForumLinkInsert @insert="editBody += $event" />
            </div>
            <span
              class="text-xs"
              :class="editBody.length > POST_BODY_MAX_LENGTH ? 'text-red-500' : 'text-stone-400'"
            >
              {{ editBody.length.toLocaleString() }} / {{ POST_BODY_MAX_LENGTH.toLocaleString() }}
            </span>
          </div>
        </div>
      </template>

      <!-- Display mode -->
      <template v-else>
        <MarkdownRenderer
          class="post"
          :class="largeText ? 'text-base' : 'text-sm'"
          :source="localBody"
          :options="{ html: false }"
        />
      </template>

      <!-- Link preview cards -->
      <ForumLinkCards :body="localBody" />

      <!-- Reactions -->
      <div class="flex flex-wrap items-center gap-1.5 mt-3">
        <button
          v-for="group in computedReactions"
          :key="group.emoji"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
          :class="
            group.reacted
              ? 'border-primary bg-primary/10 text-stone-800 dark:text-stone-100'
              : 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500'
          "
          :title="group.users.join(', ')"
          @click="handleReaction(group.emoji)"
        >
          <span>{{ group.emoji }}</span>
          <span>{{ group.count }}</span>
        </button>
        <div v-if="isLoggedIn" class="relative emoji-picker-container">
          <button
            type="button"
            class="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-stone-300 dark:border-stone-700 text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-200 transition-colors text-xs"
            title="Add reaction"
            @click="showEmojiPicker = !showEmojiPicker"
          >
            +
          </button>
          <div
            v-if="showEmojiPicker"
            class="absolute z-20 bottom-full mb-2 left-0 p-2 rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-lg flex flex-wrap gap-1 w-56"
          >
            <button
              v-for="emoji in EMOJI_OPTIONS"
              :key="emoji"
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-lg"
              @click="handleReaction(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Report Dialog -->
    <Dialog v-model:visible="showReportDialogVisible" size="sm">
      <template #title>
        <h2 class="font-sorts text-xl">Report Post</h2>
      </template>
      <div class="p-4 flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-stone-400">Why are you reporting this post?</label>
          <ExpandingTextarea v-model="reportReason" :rows="3" />
        </div>
        <div class="flex gap-2">
          <Button
            color="negative"
            :disabled="!reportReason.trim() || reportSubmitting"
            @click="submitReport"
          >
            {{ reportSubmitting ? "Submitting..." : "Submit Report" }}
          </Button>
          <Button color="secondary" @click="showReportDialogVisible = false">Cancel</Button>
        </div>
        <p v-if="reportError" class="text-sm text-red-500">{{ reportError }}</p>
        <p v-if="reportSuccess" class="text-sm text-green-500">Report submitted. Thank you.</p>
      </div>
    </Dialog>

    <!-- Edit History Dialog -->
    <Dialog v-model:visible="showEditHistoryDialog" size="md">
      <template #title>
        <h2 class="font-sorts text-xl">Edit History</h2>
      </template>
      <div class="p-4">
        <Loading v-if="editHistoryLoading" />
        <p v-else-if="editHistoryData.length === 0" class="text-sm text-stone-400">
          No edit history available.
        </p>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="edit in editHistoryData"
            :key="edit.id"
            class="p-3 rounded border border-stone-300/50 dark:border-stone-700/30 bg-stone-200/50 dark:bg-stone-800/50"
          >
            <div class="text-xs text-stone-500 dark:text-stone-400 mb-2">
              Edited by
              <span class="font-semibold">{{ edit.editor.display_name }}</span>
              &middot; {{ formatDate(edit.created_at) }}
            </div>
            <template v-if="edit.previous_body !== null">
              <pre class="text-xs whitespace-pre-wrap text-stone-400">{{ edit.previous_body }}</pre>
            </template>
            <p v-else class="text-xs text-stone-400 italic">
              Edit details hidden &mdash; {{ edit.editor.display_name }} edit
            </p>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import type { ForumPost as ForumPostType, ForumPostReaction } from "~/composables/useForum";

const POST_BODY_MAX_LENGTH = 10_000;

const EMOJI_OPTIONS = [
  "👍", "👎", "❤️", "😂", "😮", "😢", "🎉", "🤔",
  "👏", "🔥", "😈", "💀", "👹", "🩸", "👻", "⚰️",
];

const props = withDefaults(defineProps<{
  post: ForumPostType;
  threadId: string;
  threadIsLocked: boolean;
  currentUserId: string | undefined;
  canEditPost: boolean;
  canDeletePost: boolean;
  showBanAction?: boolean;
  largeText?: boolean;
}>(), {
  showBanAction: false,
  largeText: false,
});

const emit = defineEmits<{
  quote: [post: ForumPostType];
  deleted: [id: string];
  threadDeleted: [];
  ban: [userId: string, displayName: string];
  edited: [postId: string, body: string];
}>();

const user = useUser();
const { pickImages } = useImagePicker();
const forum = useForum();

const isLoggedIn = computed(() => !!user.value);
const canEdit = computed(() => props.canEditPost);
const canDelete = computed(() => props.canDeletePost);

// Local state for body and reactions (works for both thread page and dashboard)
const localBody = ref(props.post.body);
const localEditedAt = ref(props.post.edited_at);
const localReactions = ref<ForumPostReaction[]>([...props.post.reactions]);

// Sync if parent updates the post prop
watch(() => props.post.body, (v) => { localBody.value = v; });
watch(() => props.post.edited_at, (v) => { localEditedAt.value = v; });
watch(() => props.post.reactions, (v) => { localReactions.value = [...v]; });

// Deleted post expansion
const expanded = ref(false);

// --- Formatting helpers ---

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function nameColorClass(color: string | null | undefined): string {
  if (!color) return "";
  if (color === "admin") return "text-red-500 dark:text-red-400";
  if (color === "supporter") return "text-teal-600 dark:text-teal-400";
  return "";
}

function nameColorStyle(color: string | null | undefined): Record<string, string> {
  if (!color || color === "admin" || color === "supporter") return {};
  return { color };
}

function badgeLabel(badge: string): string {
  if (badge === "admin") return "Admin";
  if (badge === "moderator") return "Moderator";
  if (badge === "supporter") return "Supporter";
  return "";
}

function badgeClass(badge: string, nameColor: string | null | undefined): string {
  if (badge === "admin") return "bg-red-500/15 text-red-500 dark:text-red-400";
  if (badge === "supporter") return "bg-teal-500/15 text-teal-600 dark:text-teal-400";
  if (badge === "moderator") {
    if (nameColor && nameColor !== "admin" && nameColor !== "supporter") return "";
    return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
  }
  return "";
}

function badgeStyle(badge: string, nameColor: string | null | undefined): Record<string, string> {
  if (badge === "moderator" && nameColor && nameColor !== "admin" && nameColor !== "supporter") {
    return { color: nameColor, backgroundColor: `${nameColor}26` };
  }
  return {};
}

// --- Reactions ---

function groupReactions(reactions: ForumPostReaction[]) {
  const groups = new Map<string, { emoji: string; count: number; reacted: boolean; users: string[] }>();
  for (const r of reactions) {
    const existing = groups.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.user_id === props.currentUserId) existing.reacted = true;
    } else {
      groups.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        reacted: r.user_id === props.currentUserId,
        users: [],
      });
    }
  }
  return Array.from(groups.values());
}

const computedReactions = computed(() => groupReactions(localReactions.value));

const showEmojiPicker = ref(false);

async function handleReaction(emoji: string) {
  showEmojiPicker.value = false;
  if (!props.currentUserId) return;

  // Optimistic update
  const idx = localReactions.value.findIndex(
    (r) => r.emoji === emoji && r.user_id === props.currentUserId
  );
  if (idx !== -1) {
    localReactions.value.splice(idx, 1);
  } else {
    localReactions.value.push({ emoji, user_id: props.currentUserId! });
  }

  try {
    await $fetch(`/api/forum/posts/${props.post.id}/reactions`, {
      method: "POST",
      body: { emoji },
    });
  } catch (err: any) {
    // Revert on failure
    if (idx !== -1) {
      localReactions.value.push({ emoji, user_id: props.currentUserId! });
    } else {
      const revertIdx = localReactions.value.findIndex(
        (r) => r.emoji === emoji && r.user_id === props.currentUserId
      );
      if (revertIdx !== -1) localReactions.value.splice(revertIdx, 1);
    }
    console.error("Reaction failed", err);
  }
}

function onClickOutsideEmoji(e: MouseEvent) {
  if (showEmojiPicker.value && !(e.target as HTMLElement).closest(".emoji-picker-container")) {
    showEmojiPicker.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutsideEmoji));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutsideEmoji));

// --- Edit ---

const editing = ref(false);
const editBody = ref("");
const editTab = ref<"write" | "preview">("write");
const uploadingImage = ref(false);

function startEdit() {
  editing.value = true;
  editBody.value = localBody.value;
  editTab.value = "write";
}

function cancelEdit() {
  editing.value = false;
  editBody.value = "";
  editTab.value = "write";
}

async function submitEdit() {
  if (!editBody.value.trim()) return;
  try {
    await forum.editPost(props.post.id, editBody.value);
    localBody.value = editBody.value;
    localEditedAt.value = new Date().toISOString();
    emit("edited", props.post.id, editBody.value);
    cancelEdit();
  } catch (err: any) {
    console.error(err);
  }
}

async function uploadImage() {
  const files = await pickImages();
  if (files.length === 0) return;

  uploadingImage.value = true;
  try {
    const formData = new FormData();
    formData.append("file", files[0]);
    const urls = await $fetch<string[]>("/api/storage/game-attachments", {
      method: "POST",
      body: formData,
    });
    editBody.value += `\n![image](${urls[0]})\n`;
  } catch (err: any) {
    console.error("Image upload failed", err);
  } finally {
    uploadingImage.value = false;
  }
}

// --- Delete ---

async function handleDelete() {
  if (!confirm("Are you sure you want to delete this post?")) return;
  try {
    const result = await forum.deletePost(props.threadId, props.post.id);
    if (result.threadDeleted) {
      emit("threadDeleted");
    } else {
      emit("deleted", props.post.id);
    }
  } catch (err: any) {
    console.error(err);
  }
}

// --- Report ---

const showReportDialogVisible = ref(false);
const reportReason = ref("");
const reportError = ref("");
const reportSuccess = ref(false);
const reportSubmitting = ref(false);

function openReportDialog() {
  reportReason.value = "";
  reportError.value = "";
  reportSuccess.value = false;
  showReportDialogVisible.value = true;
}

async function submitReport() {
  if (!reportReason.value.trim()) return;
  reportSubmitting.value = true;
  reportError.value = "";
  try {
    await $fetch(`/api/forum/posts/${props.post.id}/report`, {
      method: "POST",
      body: { reason: reportReason.value },
    });
    reportSuccess.value = true;
    reportReason.value = "";
  } catch (err: any) {
    reportError.value = err?.data?.statusMessage || err?.statusMessage || "Failed to submit report";
  } finally {
    reportSubmitting.value = false;
  }
}

// --- Edit History ---

const showEditHistoryDialog = ref(false);
const editHistoryData = ref<{
  id: string;
  previous_body: string | null;
  created_at: string;
  editor: { display_name: string };
  mod_edit?: boolean;
}[]>([]);
const editHistoryLoading = ref(false);

async function showEditHistory(postId: string) {
  showEditHistoryDialog.value = true;
  editHistoryLoading.value = true;
  editHistoryData.value = [];
  try {
    editHistoryData.value = await $fetch(`/api/forum/posts/${postId}/edits`);
  } catch (err: any) {
    console.error(err);
  } finally {
    editHistoryLoading.value = false;
  }
}
</script>
