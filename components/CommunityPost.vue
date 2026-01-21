<template>
  <div
    class="shadow p-3 rounded bg-stone-200 dark:bg-stone-900 dark:text-stone-300 text-sm"
  >
    <div class="flex items-start">
      <div class="flex flex-grow flex-wrap items-center gap-4 md:h-12">
        <Avatar :value="post.user.avatar" size="xs" />
        <div class="flex flex-col flex-grow">
          <div
            :class="{
              'text-green-600 dark:text-green-500': isUserModerator(
                post.user.user_id
              ),
            }"
          >
            {{ post.user.display_name }}
          </div>
          <div class="text-sm">
            <nuxt-link
              :to="`/@${post.user.username}`"
              class="decoration-stone-400"
            >
              <span class="text-stone-500 dark:text-stone-400">
                {{ post.user.username }}
              </span>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div>
        <button
          v-if="isMe(post.user.user_id) || isModerator"
          @click="deletePost(post.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 512 512"
          >
            <path
              d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
              fill="currentColor"
            />
            <path d="M249 160h14v241h-14z" fill="currentColor" />
            <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
            <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
    <VueMarkdown class="post" :source="post.content" />
    <div
      class="text-sm flex gap-4 px-4 pt-3 text-stone-500 dark:text-stone-400"
    >
      <div class="flex gap-4 md:gap-12 flex-grow">
        <div class="flex gap-3 items-center">
          <button @click="toggleReply">
            <svg width="24" height="24" viewBox="0 0 28 28">
              <path
                fill="currentColor"
                d="M10.03 5.47a.75.75 0 0 1 0 1.06L5.56 11h8.69C20.187 11 25 15.813 25 21.75a.75.75 0 0 1-1.5 0a9.25 9.25 0 0 0-9.25-9.25H5.56l4.47 4.47a.75.75 0 1 1-1.06 1.06l-5.75-5.75a.75.75 0 0 1 0-1.06l5.75-5.75a.75.75 0 0 1 1.06 0Z"
              />
            </svg>
          </button>
          {{ post._count.replies }}
        </div>
      </div>
      <div class="flex gap-2 md:gap-4 flex-shrink items-center">
        <time class="text-stone-500 dark:text-stone-400">{{
          formatDate(post.created_at)
        }}</time>
      </div>
    </div>
    <div v-if="post.replies.length > 0" class="mt-4 ml-12">
      <div
        v-for="reply in post.replies"
        class="shadow rounded my-4 bg-stone-300 dark:bg-stone-800 dark:text-stone-300 text-sm p-2"
      >
        <div class="flex items-start">
          <div class="flex flex-grow flex-wrap items-center gap-4 md:h-12">
            <Avatar :value="reply.user.avatar" size="xs" />
            <div class="flex flex-col flex-grow">
              <div
                :class="{
                  'text-green-600 dark:text-green-500': isUserModerator(
                    reply.user.user_id
                  ),
                }"
              >
                {{ reply.user.display_name }}
              </div>
              <div class="text-sm">
                <nuxt-link
                  :to="`/@${reply.user.username}`"
                  class="decoration-stone-400"
                >
                  <span class="text-stone-500 dark:text-stone-400">
                    {{ reply.user.username }}
                  </span>
                </nuxt-link>
              </div>
            </div>
          </div>
          <div>
            <button
              v-if="isMe(reply.user.user_id) || isModerator"
              @click="deletePost(reply.id)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        <VueMarkdown class="post" :source="reply.content" />
        <div
          class="flex justify-end px-4 gap-2 md:gap-4 flex-shrink items-center"
        >
          <time class="text-stone-500 dark:text-stone-400">
            {{ formatDate(reply.created_at) }}
          </time>
        </div>
      </div>
    </div>
    <label v-if="showReply" class="block pt-4">
      <form @submit.prevent="submitReply">
        <ExpandingTextarea v-model="newReply" />
        <Button type="submit" primary font-size="md" class="px-4 py-2 mt-2">
          Send
        </Button>
      </form>
    </label>
  </div>
</template>

<script setup lang="ts">
import VueMarkdown from "vue-markdown-render";

const user = useSupabaseUser();
const communities = useCommunities();

const props = defineProps<{
  post: CommunityPost;
  community: Partial<Community>;
  isMember?: boolean;
  isModerator?: boolean;
}>();

const emit = defineEmits(["deleted"]);

const newReply = ref("");
const showReply = ref(false);

function formatDate(date: string) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(date));
}

function isUserModerator(user_id: string) {
  return props.community.admins
    ?.map(({ user_id }) => user_id)
    .includes(user_id);
}

function isMe(id: string) {
  return user.value?.sub === id;
}

function toggleReply() {
  if (props.isMember) {
    showReply.value = !showReply.value;
  }
}

async function submitReply() {
  await communities.submitReply(
    props.community.slug!,
    props.post,
    newReply.value
  );

  newReply.value = "";
  showReply.value = false;
}

async function deletePost(post_id: string) {
  if (confirm("Are you sure you want to delete this post?")) {
    await communities.deletePost(props.community.slug!, post_id);
    emit("deleted", post_id);
  }
}
</script>

<style>
.post {
  h1 {
    @apply text-3xl;
  }
  h2 {
    @apply text-2xl;
  }
  h3 {
    @apply text-xl;
  }
  h4 {
    @apply text-lg;
  }
  h5 {
    @apply text-base;
  }
  h6 {
    @apply text-sm;
  }

  ul {
    @apply list-disc list-inside;
  }
  ol {
    @apply list-decimal list-inside;
  }
  li {
    @apply my-1;
  }
  li ul,
  li ol {
    @apply ml-4;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply my-4;
  }

  p,
  ul,
  ol,
  table,
  pre,
  img {
    @apply my-2;
  }

  table {
    @apply w-full;
    th {
      @apply bg-stone-300 font-bold;
    }
    tr {
      @apply border-b border-stone-300;
    }
    tr:nth-child(even) {
      @apply bg-stone-200;
    }
    td {
      @apply p-1;
    }
  }
  a {
    @apply text-blue-600 hover:underline;
  }
  hr {
    @apply my-4 border-stone-300;
  }
}
</style>
