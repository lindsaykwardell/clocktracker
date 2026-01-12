<template>
  <div
    class="p-4 flex flex-col gap-8 rounded border dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40"
  >
    <div class="flex gap-4 items-start">
      <Avatar :value="post.user.avatar" size="xs" background />
      <div class="flex flex-grow flex-wrap items-center gap-4">
        <div class="flex flex-col flex-grow text-sm">
          <div class="flex flex-row flex-wrap gap-x-1 md:gap-x-2">
            <span class="font-semibold"
              :class="{
                'text-green-600 dark:text-green-500': isUserModerator(
                  post.user.user_id
                ),
              }"
            >
              {{ post.user.display_name }}
            </span>
            <nuxt-link
              :to="`/@${post.user.username}`"
              class="decoration-stone-400 text-stone-500 dark:text-stone-400"
            >
              (@{{ post.user.username }})
            </nuxt-link>
          </div>
          <time class="text-stone-500 dark:text-stone-400">
            {{ formatDate(post.created_at) }}
          </time>
        </div>
        
        <div class="w-full">
          <VueMarkdown class="post text-sm max-w-[80ch]" :source="post.content" />
        </div>
  
        <div class="flex gap-4 items-center text-stone-600 dark:text-stone-400">
          <span class="flex gap-2 items-center leading-none">
            <IconUI id="reply" />
            <span class="sr-only">Reply count:</span>{{ post._count.replies }}
          </span>
          <Button @click="toggleReply" size="small" icon="reply">
            Reply
          </Button>
        </div>
      </div>
      <Button
        v-if="isMe(post.user.user_id) || isModerator"
        icon="x"
        color="contrast"
        display="icon-only"
        circular
        @click="deletePost(post.id)"
      >
        Delete post by {{post.user.display_name}}
      </Button>
    </div>

    <div v-if="post.replies.length > 0" class="flex flex-col gap-6 md:gap-8 ml-10 md:ml-12">
      <div
        v-for="reply in post.replies"
        class="reply flex gap-4 items-start"
      >
        <Avatar :value="reply.user.avatar" size="xs" background />
        <div class="flex flex-grow flex-wrap items-center gap-2">
          <div class="flex flex-col flex-grow text-sm">
            <div class="flex flex-row flex-wrap gap-x-1 md:gap-x-2">
              <span
                class="font-semibold"
                :class="{
                  'text-green-600 dark:text-green-500': isUserModerator(
                    reply.user.user_id
                  ),
                }"
              >
                {{ reply.user.display_name }}
              </span>
              <nuxt-link
                :to="`/@${reply.user.username}`"
                class="decoration-stone-400 text-stone-500 dark:text-stone-400"
              >
                (@{{ reply.user.username }})
              </nuxt-link>
            </div>
            <time class="text-stone-500 dark:text-stone-400">
              {{ formatDate(reply.created_at) }}
            </time>
          </div>
          <div class="w-full">
            <VueMarkdown class="post text-sm max-w-[80ch]" :source="reply.content" />
          </div>
          
        </div>
        <div>
          <Button
            v-if="isMe(reply.user.user_id) || isModerator"
            @click="deletePost(reply.id)"
            icon="x"
            color="contrast"
            display="icon-only"
            size="small"
            circular
          >
            Delete post by {{post.user.display_name}}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="showReply" class="flex gap-4 items-start ml-12">
      <!-- @todo User avatar here? -->
      <Avatar size="xs" background />
      <form @submit.prevent="submitReply" class="flex-grow flex flex-col gap-2">
        <div>
          <label for="reply-input">Add comment...</label>
          <ExpandingTextarea v-model="newReply" />
        </div>
        <div>
          <Button type="submit" size="small" color="primary">
            Post reply
          </Button>
        </div>
      </form>
    </div>
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
  return user.value?.id === id;
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
    &:not(:last-child) {
      @apply mb-2;
    }
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

.reply {
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    display: block;
    z-index: -1;
    transform: translateX(-50%);

    @apply bg-stone-300 dark:bg-stone-700/50 w-1 left-4 md:left-5;
  }

  &::before {
    @apply -top-8 h-12 md:h-14;

    &:first-child {
      @apply -top-6 h-10 md:h-12;
    }
  }

  &::after {
    bottom: 0;

    @apply top-4 md:top-5;

    
  }

  &:last-child {
    &::after {
      content: unset;
    }
  }
}
</style>
