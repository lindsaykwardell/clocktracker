<template>
    <StandardTemplate>
        <div
            class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto overflow-hidden"
        >
            <template v-if="threadData?.status === Status.SUCCESS">
                <div class="flex items-center justify-between">
                    <nuxt-link
                        :to="`/forum/${threadData.data.thread.category.slug}`"
                        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
                    >
                        &larr; {{ threadData.data.thread.category.name }}
                    </nuxt-link>

                    <div class="flex items-center gap-1 shrink-0">
                        <Button
                            v-if="isLoggedIn"
                            size="xs"
                            :color="isSubscribed ? 'primary' : 'secondary'"
                            :icon="isSubscribed ? 'star' : 'star-bordered'"
                            @click="toggleSubscribe"
                        >
                            {{ isSubscribed ? "Subscribed" : "Subscribe" }}
                        </Button>
                        <Menu
                            v-if="
                                canModerate ||
                                (canCreateGithubIssue &&
                                    !threadData.data.thread.github_issue_url)
                            "
                            v-slot="{ open }"
                            as="div"
                            class="relative"
                        >
                            <MenuButton>
                                <IconUI id="dots" :rounded="true" shadow />
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
                                    <MenuItems
                                        static
                                        class="ct-contextual-links right-0"
                                    >
                                        <MenuItem v-if="canModerate">
                                            <ButtonSubmenu
                                                @click="togglePin"
                                                icon="pin"
                                            >
                                                {{
                                                    threadData.data.thread
                                                        .is_pinned
                                                        ? "Unpin"
                                                        : "Pin"
                                                }}
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem v-if="canModerate">
                                            <ButtonSubmenu
                                                @click="toggleLock"
                                                :icon="
                                                    threadData.data.thread
                                                        .is_locked
                                                        ? 'unlock'
                                                        : 'lock'
                                                "
                                            >
                                                {{
                                                    threadData.data.thread
                                                        .is_locked
                                                        ? "Unlock"
                                                        : "Lock"
                                                }}
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem v-if="canModerate">
                                            <ButtonSubmenu
                                                @click="showMoveDialog = true"
                                                icon="arrow-right-short"
                                            >
                                                Move
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem
                                            v-if="
                                                canCreateGithubIssue &&
                                                !threadData.data.thread
                                                    .github_issue_url
                                            "
                                        >
                                            <ButtonSubmenu
                                                @click="createGithubIssue"
                                                icon="github"
                                                :disabled="creatingGithubIssue"
                                            >
                                                {{
                                                    creatingGithubIssue
                                                        ? "Creating..."
                                                        : "Create GitHub Issue"
                                                }}
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem v-if="canModerate">
                                            <ButtonSubmenu
                                                @click="handleDeleteThread"
                                                icon="trash"
                                                color="negative"
                                            >
                                                Delete Thread
                                            </ButtonSubmenu>
                                        </MenuItem>
                                    </MenuItems>
                                </div>
                            </transition>
                        </Menu>
                        <span
                            v-if="githubIssueError"
                            class="text-xs text-red-500"
                        >
                            {{ githubIssueError }}
                        </span>
                    </div>
                </div>

                <div class="mt-2 mb-6">
                    <h1 class="font-sorts text-2xl lg:text-3xl">
                        {{ threadData.data.thread.title }}
                    </h1>
                    <div
                        class="flex flex-wrap items-center gap-x-1 text-sm text-stone-500 dark:text-stone-400 mt-1"
                    >
                        <span
                            >Started by
                            {{
                                threadData.data.thread.author.display_name
                            }}</span
                        >
                        <span>&middot;</span>
                        <span>{{
                            formatDate(threadData.data.thread.created_at)
                        }}</span>
                    </div>
                    <div
                        class="flex items-center gap-1 mt-2"
                        v-if="
                            threadData.data.thread.is_pinned ||
                            threadData.data.thread.is_locked
                        "
                    >
                        <span
                            v-if="threadData.data.thread.is_pinned"
                            class="flex items-center gap-1 text-sm text-primary"
                        >
                            <IconUI id="pin" size="sm" />
                            Pinned
                        </span>
                        <Badge
                            v-if="threadData.data.thread.is_locked"
                            color="caution"
                            size="sm"
                            >Locked</Badge
                        >
                    </div>
                </div>

                <!-- GitHub Issue Card -->
                <a
                    v-if="githubIssue"
                    :href="threadData.data.thread.github_issue_url!"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 px-4 py-3 mb-4 rounded border transition-colors"
                    :class="
                        githubIssue.state === 'open'
                            ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                            : 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10'
                    "
                >
                    <div
                        class="w-10 h-10 rounded shrink-0 flex items-center justify-center"
                        :class="
                            githubIssue.state === 'open'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/20 text-purple-400'
                        "
                    >
                        <svg
                            viewBox="0 0 16 16"
                            class="w-5 h-5"
                            fill="currentColor"
                        >
                            <template v-if="githubIssue.is_pull_request">
                                <path
                                    d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"
                                />
                            </template>
                            <template v-else-if="githubIssue.state === 'open'">
                                <path
                                    d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
                                />
                                <path
                                    d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"
                                />
                            </template>
                            <template v-else>
                                <path
                                    d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"
                                />
                                <path
                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"
                                />
                            </template>
                        </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold truncate">
                            {{ githubIssue.title }}
                            <span class="text-stone-400 font-normal"
                                >#{{ githubIssue.number }}</span
                            >
                        </div>
                        <div class="text-xs text-stone-400 truncate">
                            {{
                                githubIssue.is_pull_request
                                    ? "Pull Request"
                                    : "Issue"
                            }}
                            &middot;
                            <span
                                :class="
                                    githubIssue.state === 'open'
                                        ? 'text-green-400'
                                        : 'text-purple-400'
                                "
                                >{{ githubIssue.state }}</span
                            >
                            <template v-if="githubIssue.comments > 0">
                                &middot; {{ githubIssue.comments }} comment{{
                                    githubIssue.comments === 1 ? "" : "s"
                                }}
                            </template>
                        </div>
                        <div
                            v-if="githubIssue.labels?.length"
                            class="flex gap-1 mt-1 flex-wrap"
                        >
                            <span
                                v-for="label in githubIssue.labels.slice(0, 5)"
                                :key="label.name"
                                class="inline-block px-1.5 py-0.5 text-[0.625rem] rounded-full font-medium"
                                :style="{
                                    backgroundColor: `#${label.color}33`,
                                    color: `#${label.color}`,
                                }"
                            >
                                {{ label.name }}
                            </span>
                        </div>
                    </div>
                    <IconUI
                        id="github"
                        size="sm"
                        class="text-stone-400 shrink-0"
                    />
                </a>
                <div
                    v-else-if="githubIssueLoading"
                    class="px-4 py-3 mb-4 rounded border border-stone-300 dark:border-stone-700/50 text-xs text-stone-400 animate-pulse"
                >
                    Loading GitHub issue...
                </div>

                <!-- Top Pagination -->
                <div
                    v-if="threadData.data.total > threadData.data.perPage"
                    class="flex justify-center gap-2 mb-4"
                >
                    <Button
                        v-if="page > 2"
                        @click="page = 1"
                        color="secondary"
                        size="sm"
                        icon="chevron-left"
                    >
                        First
                    </Button>
                    <Button
                        v-if="page > 1"
                        @click="page--"
                        color="secondary"
                        size="sm"
                    >
                        Previous
                    </Button>
                    <span class="flex items-center text-sm text-stone-500">
                        Page {{ page }} of {{ totalPages }}
                    </span>
                    <Button
                        v-if="
                            threadData.data.total >
                            page * threadData.data.perPage
                        "
                        @click="page++"
                        color="secondary"
                        size="sm"
                    >
                        Next
                    </Button>
                    <Button
                        v-if="page < totalPages - 1"
                        @click="page = totalPages"
                        color="secondary"
                        size="sm"
                        icon="chevron-right"
                        display="icon-after"
                    >
                        Last
                    </Button>
                </div>

                <!-- Posts -->
                <div class="flex flex-col gap-4">
                    <template
                        v-for="(post, postIndex) in threadData.data.posts"
                        :key="post.id"
                    >
                        <!-- Unread divider -->
                        <div
                            v-if="post.id === threadData.data.firstUnreadPostId"
                            id="unread-divider"
                            class="flex items-center gap-3 py-1"
                        >
                            <div class="flex-1 border-t border-primary/50" />
                            <span
                                class="text-xs font-semibold text-primary uppercase tracking-wider"
                                >New</span
                            >
                            <div class="flex-1 border-t border-primary/50" />
                        </div>
                        <ForumPost
                            :post="post"
                            :threadId="threadId"
                            :threadIsLocked="threadData.data.thread.is_locked"
                            :currentUserId="user?.id"
                            :canEditPost="canEditPost(post)"
                            :canDeletePost="canDeletePost(post)"
                            :showBanAction="canBanUser(post)"
                            :largeText="isAnnouncementFirstPost(postIndex)"
                            @quote="quotePost"
                            @deleted="onPostDeleted"
                            @threadDeleted="onThreadDeleted"
                            @ban="toggleBanForm"
                            @edited="onPostEdited"
                        />
                    </template>
                </div>

                <!-- Ban Dialog -->
                <Dialog v-model:visible="showBanDialog" size="sm">
                    <template #title>
                        <h2 class="font-sorts text-xl">
                            Ban {{ banDisplayName }}
                        </h2>
                    </template>
                    <div class="p-4 flex flex-col gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-sm text-stone-400"
                                >Reason (optional)</label
                            >
                            <Input
                                v-model="banReason"
                                placeholder="Reason for ban"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-sm text-stone-400"
                                >Duration</label
                            >
                            <select
                                v-model="banDuration"
                                class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-sm"
                            >
                                <option value="">Permanent</option>
                                <option value="1h">1 hour</option>
                                <option value="1d">1 day</option>
                                <option value="7d">7 days</option>
                                <option value="30d">30 days</option>
                            </select>
                        </div>
                        <div class="flex gap-2">
                            <Button
                                color="negative"
                                @click="submitBan(banningUserId!)"
                            >
                                Confirm Ban
                            </Button>
                            <Button
                                color="secondary"
                                @click="showBanDialog = false"
                            >
                                Cancel
                            </Button>
                        </div>
                        <p v-if="banError" class="text-sm text-red-500">
                            {{ banError }}
                        </p>
                    </div>
                </Dialog>

                <!-- Move Thread Dialog -->
                <Dialog v-model:visible="showMoveDialog" size="sm">
                    <template #title>
                        <h2 class="font-sorts text-xl">Move Thread</h2>
                    </template>
                    <div class="p-4 flex flex-col gap-3">
                        <p class="text-sm text-stone-400">
                            Select a category to move this thread to:
                        </p>
                        <select
                            v-model="moveTargetCategoryId"
                            class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="" disabled>
                                Choose a category...
                            </option>
                            <template
                                v-for="cat in moveCategories"
                                :key="cat.id"
                            >
                                <option
                                    :value="cat.id"
                                    :disabled="
                                        cat.id ===
                                        threadData?.data?.thread.category.id
                                    "
                                >
                                    {{ cat.name }}
                                    {{
                                        cat.id ===
                                        threadData?.data?.thread.category.id
                                            ? "(current)"
                                            : ""
                                    }}
                                </option>
                            </template>
                        </select>
                        <p v-if="moveError" class="text-xs text-red-500">
                            {{ moveError }}
                        </p>
                        <div class="flex gap-2 justify-end">
                            <Button
                                size="sm"
                                color="secondary"
                                @click="showMoveDialog = false"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                :disabled="
                                    !moveTargetCategoryId || movingThread
                                "
                                @click="moveThread"
                            >
                                {{ movingThread ? "Moving..." : "Move Thread" }}
                            </Button>
                        </div>
                    </div>
                </Dialog>

                <!-- Pagination -->
                <div
                    v-if="threadData.data.total > threadData.data.perPage"
                    class="flex justify-center gap-2 mt-4"
                >
                    <Button
                        v-if="page > 2"
                        @click="page = 1"
                        color="secondary"
                        size="sm"
                        icon="chevron-left"
                    >
                        First
                    </Button>
                    <Button
                        v-if="page > 1"
                        @click="page--"
                        color="secondary"
                        size="sm"
                    >
                        Previous
                    </Button>
                    <span class="flex items-center text-sm text-stone-500">
                        Page {{ page }} of {{ totalPages }}
                    </span>
                    <Button
                        v-if="
                            threadData.data.total >
                            page * threadData.data.perPage
                        "
                        @click="page++"
                        color="secondary"
                        size="sm"
                    >
                        Next
                    </Button>
                    <Button
                        v-if="page < totalPages - 1"
                        @click="page = totalPages"
                        color="secondary"
                        size="sm"
                        icon="chevron-right"
                        display="icon-after"
                    >
                        Last
                    </Button>
                </div>

                <!-- Reply form -->
                <form
                    ref="replyFormEl"
                    v-if="
                        isLoggedIn &&
                        !threadData.data.thread.is_locked &&
                        page === totalPages
                    "
                    @submit.prevent="submitReply"
                    class="mt-6 p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50 flex flex-col gap-2"
                >
                    <div
                        class="flex items-center justify-between text-sm border-b border-stone-300 dark:border-stone-700"
                    >
                        <div class="flex gap-2">
                            <button
                                type="button"
                                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                                :class="
                                    replyTab === 'write'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                                "
                                @click="replyTab = 'write'"
                            >
                                Write
                            </button>
                            <button
                                type="button"
                                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                                :class="
                                    replyTab === 'preview'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                                "
                                @click="replyTab = 'preview'"
                            >
                                Preview
                            </button>
                        </div>
                        <MarkdownHelp />
                    </div>
                    <ExpandingTextarea
                        v-if="replyTab === 'write'"
                        v-model="replyBody"
                        :rows="5"
                    />
                    <div v-else class="min-h-[7.5rem] p-2">
                        <MarkdownRenderer
                            v-if="replyBody.trim()"
                            class="post text-sm"
                            :source="replyBody"
                            :options="{ html: false }"
                        />
                        <p v-else class="text-sm text-stone-400 italic">
                            Nothing to preview
                        </p>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Button
                                type="submit"
                                color="primary"
                                :disabled="
                                    !replyBody.trim() ||
                                    replyBody.length > POST_BODY_MAX_LENGTH
                                "
                            >
                                Post Reply
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                :icon="uploadingImage ? 'dots' : 'upload'"
                                :icon-spin="uploadingImage"
                                :disabled="uploadingImage"
                                @click="uploadImage()"
                            >
                                Upload image
                            </Button>
                            <ForumLinkInsert @insert="replyBody += $event" />
                        </div>
                        <span
                            class="hidden md:inline text-xs"
                            :class="
                                replyBody.length > POST_BODY_MAX_LENGTH
                                    ? 'text-red-500'
                                    : 'text-stone-400'
                            "
                        >
                            {{ replyBody.length.toLocaleString() }} /
                            {{ POST_BODY_MAX_LENGTH.toLocaleString() }}
                        </span>
                    </div>
                    <p v-if="replyError" class="text-sm text-red-500">
                        {{ replyError }}
                    </p>
                </form>
                <p
                    v-else-if="threadData.data.thread.is_locked"
                    class="mt-6 text-center text-stone-400"
                >
                    This thread is locked.
                </p>

                <!-- Subscription footer -->
                <div v-if="isLoggedIn" class="mt-6 text-center">
                    <Button
                        variant="link-underline"
                        size="sm"
                        @click="toggleSubscribe"
                    >
                        {{
                            isSubscribed
                                ? "Unsubscribe from this thread"
                                : "Subscribe to this thread"
                        }}
                    </Button>
                </div>
            </template>
            <Loading v-else />
        </div>
    </StandardTemplate>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { Status } from "~/composables/useFetchStatus";
import type { ForumPost } from "~/composables/useForum";

const POST_BODY_MAX_LENGTH = 10_000;

function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
}

const route = useRoute();
const router = useRouter();
const threadId = route.params.threadId as string;
const forum = useForum();
const user = useUser();
const { pickImages } = useImagePicker();
const me = useMe();
const page = ref(Math.max(1, Number(route.query.page) || 1));
const wantUnread = ref(route.query.unread === "1");

const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const replyBody = ref("");
const replyError = ref("");
const banningUserId = ref<string | null>(null);
const banDisplayName = ref("");
const showBanDialog = ref(false);
const banReason = ref("");
const banDuration = ref("");
const banError = ref("");
const uploadingImage = ref(false);
const isSubscribed = ref(false);
const replyFormEl = ref<HTMLFormElement | null>(null);
const replyTab = ref<"write" | "preview">("write");

const isLoggedIn = computed(() => !!user.value);

const threadData = computed(() => forum.threadDetail.get(threadId));

const totalPages = computed(() => {
    const data = threadData.value;
    if (data?.status !== Status.SUCCESS) return 1;
    return Math.ceil(data.data.total / data.data.perPage);
});

const isAdminUser = computed(() => {
    const meVal = me.value;
    return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const hasPermission = (perm: string) =>
    isAdminUser.value || (forumMe.value?.permissions.includes(perm) ?? false);

const canModerate = computed(
    () =>
        isAdminUser.value ||
        hasPermission("PIN_THREAD") ||
        hasPermission("LOCK_THREAD") ||
        hasPermission("DELETE_ANY_POST"),
);

const canCreateGithubIssue = computed(
    () => isAdminUser.value || hasPermission("GITHUB"),
);

const creatingGithubIssue = ref(false);
const githubIssueError = ref("");

async function createGithubIssue() {
    if (!confirm("Create a GitHub issue from this thread?")) return;

    creatingGithubIssue.value = true;
    githubIssueError.value = "";
    try {
        const result = await $fetch<{
            number: number;
            url: string;
            title: string;
        }>(`/api/forum/threads/${threadId}/github-issue`, {
            method: "POST",
        });

        // Update the cached thread data with the new URL
        const cached = threadData.value;
        if (cached?.status === Status.SUCCESS) {
            cached.data.thread.github_issue_url = result.url;
        }

        // Fetch the new issue preview
        fetchGithubIssue();

        // Post a reply linking to the new issue
        try {
            await forum.createPost(
                threadId,
                `New issue tracked: [${result.title}](${result.url})`,
            );
        } catch {}
    } catch (err: any) {
        githubIssueError.value =
            err?.data?.statusMessage || "Failed to create GitHub issue";
    } finally {
        creatingGithubIssue.value = false;
    }
}

const githubIssue = ref<{
    title: string;
    number: number;
    state: string;
    is_pull_request: boolean;
    author: string;
    comments: number;
    labels: { name: string; color: string }[];
} | null>(null);
const githubIssueLoading = ref(false);

function parseGithubUrl(
    url: string,
): { owner: string; repo: string; number: string } | null {
    const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], number: match[3] };
}

async function fetchGithubIssue() {
    const data = threadData.value;
    if (data?.status !== Status.SUCCESS || !data.data.thread.github_issue_url)
        return;

    const parsed = parseGithubUrl(data.data.thread.github_issue_url);
    if (!parsed) return;

    githubIssueLoading.value = true;
    try {
        githubIssue.value = await $fetch("/api/forum/github-preview", {
            query: {
                owner: parsed.owner,
                repo: parsed.repo,
                type: "issues",
                number: parsed.number,
            },
        });
    } catch {
        githubIssue.value = null;
    } finally {
        githubIssueLoading.value = false;
    }
}

function canEditPost(post: ForumPost) {
    if (!user.value) return false;
    if (isAdminUser.value || hasPermission("EDIT_ANY_POST")) return true;
    return post.author.user_id === user.value.id;
}

function canDeletePost(post: ForumPost) {
    if (!user.value) return false;
    if (isAdminUser.value || hasPermission("DELETE_ANY_POST")) return true;
    return post.author.user_id === user.value.id;
}

function isAnnouncementFirstPost(index: number) {
    if (index !== 0 || page.value !== 1) return false;
    const data = threadData.value;
    return (
        data?.status === Status.SUCCESS &&
        data.data.thread.category.is_announcement
    );
}

function canBanUser(post: ForumPost) {
    if (!user.value) return false;
    if (!hasPermission("BAN_USER")) return false;
    // Can't ban yourself
    if (post.author.user_id === user.value.id) return false;
    return true;
}

// Event handlers for ForumPost component
function onPostDeleted(postId: string) {
    // Post was soft-deleted, the store already updated via forum.deletePost
}

function onThreadDeleted() {
    const slug =
        threadData.value?.status === Status.SUCCESS
            ? threadData.value.data.thread.category.slug
            : "forum";
    router.push(`/forum/${slug}`);
}

function onPostEdited(postId: string, body: string) {
    // The component handles the API call; update the store cache
    const cached = threadData.value;
    if (cached?.status === Status.SUCCESS) {
        const idx = cached.data.posts.findIndex((p) => p.id === postId);
        if (idx !== -1) {
            cached.data.posts[idx].body = body;
            cached.data.posts[idx].edited_at = new Date().toISOString();
        }
    }
}

async function submitReply() {
    if (!replyBody.value.trim()) return;
    replyError.value = "";

    try {
        await forum.createPost(threadId, replyBody.value);
        replyBody.value = "";
    } catch (err: any) {
        replyError.value =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "Failed to post reply";
    }
}

async function handleDeleteThread() {
    const slug =
        threadData.value?.status === Status.SUCCESS
            ? threadData.value.data.thread.category.slug
            : "forum";

    try {
        await forum.deleteThread(threadId);
        router.push(`/forum/${slug}`);
    } catch (err: any) {
        console.error(err);
    }
}

async function togglePin() {
    await forum.togglePin(threadId);
}

async function toggleLock() {
    await forum.toggleLock(threadId);
}

// Move thread
const showMoveDialog = ref(false);
const moveTargetCategoryId = ref("");
const movingThread = ref(false);
const moveError = ref("");
const moveCategories = ref<{ id: string; name: string }[]>([]);

watch(showMoveDialog, async (open) => {
    if (open && moveCategories.value.length === 0) {
        try {
            const data = await $fetch<any>("/api/forum/categories");
            const allCats = [
                ...(data.ungrouped || []),
                ...(data.groups || []).flatMap((g: any) => g.categories || []),
            ];
            moveCategories.value = allCats.map((c: any) => ({
                id: c.id,
                name: c.name,
            }));
        } catch {}
    }
    moveTargetCategoryId.value = "";
    moveError.value = "";
});

async function moveThread() {
    if (!moveTargetCategoryId.value) return;
    movingThread.value = true;
    moveError.value = "";

    try {
        const result = await $fetch<{
            id: string;
            category: { id: string; name: string; slug: string };
        }>(`/api/forum/threads/${threadId}/move`, {
            method: "PUT",
            body: { category_id: moveTargetCategoryId.value },
        });

        showMoveDialog.value = false;

        // Redirect to the thread in its new category
        router.push(`/forum/${result.category.slug}/${threadId}`);
    } catch (err: any) {
        moveError.value = err?.data?.statusMessage || "Failed to move thread";
    } finally {
        movingThread.value = false;
    }
}

function toggleBanForm(userId: string, displayName: string) {
    banningUserId.value = userId;
    banDisplayName.value = displayName;
    banReason.value = "";
    banDuration.value = "";
    banError.value = "";
    showBanDialog.value = true;
}

async function submitBan(userId: string) {
    banError.value = "";

    let expires_at: string | undefined;
    if (banDuration.value) {
        const now = Date.now();
        const durations: Record<string, number> = {
            "1h": 60 * 60 * 1000,
            "1d": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
        };
        expires_at = new Date(now + durations[banDuration.value]).toISOString();
    }

    try {
        await $fetch("/api/forum/bans", {
            method: "POST",
            body: {
                user_id: userId,
                reason: banReason.value || undefined,
                expires_at,
            },
        });
        showBanDialog.value = false;
        banningUserId.value = null;
    } catch (err: any) {
        banError.value =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "Failed to ban user";
    }
}

async function toggleSubscribe() {
    try {
        const result = await $fetch<{ subscribed: boolean }>(
            `/api/forum/threads/${threadId}/subscribe`,
            {
                method: "POST",
            },
        );
        isSubscribed.value = result.subscribed;
    } catch (err: any) {
        console.error(err);
    }
}

const pendingScrollToReply = ref(false);

function quotePost(post: ForumPost) {
    const quoted = post.body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    const prefix = replyBody.value.length ? "\n\n" : "";
    replyBody.value += `${prefix}**${post.author.display_name}** wrote:\n${quoted}\n\n`;
    replyTab.value = "write";

    if (page.value !== totalPages.value) {
        pendingScrollToReply.value = true;
        page.value = totalPages.value;
    } else {
        nextTick(() => {
            replyFormEl.value?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        });
    }
}

async function uploadImage() {
    const files = await pickImages();
    if (files.length === 0) return;

    uploadingImage.value = true;
    try {
        const formData = new FormData();
        formData.append("file", files[0]);

        const urls = await $fetch<string[]>(
            "/api/storage/game-attachments",
            {
                method: "POST",
                body: formData,
            },
        );

        replyBody.value += `\n![image](${urls[0]})\n`;
    } catch (err: any) {
        console.error("Image upload failed", err);
    } finally {
        uploadingImage.value = false;
    }
}

onMounted(async () => {
    forum.fetchThread(threadId, page.value, wantUnread.value);
    try {
        forumMe.value = await $fetch("/api/forum/me");
    } catch {}

    // Handle ?quote=postId from dashboard navigation
    const quotePostId = route.query.quote as string | undefined;
    if (quotePostId) {
        const unwatch = watch(
            threadData,
            (data) => {
                if (data?.status !== Status.SUCCESS) return;
                // Find the post across all pages - it might not be on the current page,
                // so fetch it directly
                const postOnPage = data.data.posts.find(
                    (p) => p.id === quotePostId,
                );
                if (postOnPage) {
                    quotePost(postOnPage);
                    unwatch();
                }
            },
            { immediate: true },
        );
    }
});
watch(page, (p) => forum.fetchThread(threadId, p));
watch(threadData, (data) => {
    if (data?.status === Status.SUCCESS) {
        isSubscribed.value = data.data.subscribed;

        // Sync page ref with what the server returned (may differ if unread=1 was used)
        if (data.data.page !== page.value) {
            page.value = data.data.page;
        }

        // Clear the unread flag after first load
        wantUnread.value = false;

        // Fetch GitHub issue preview if linked
        if (data.data.thread.github_issue_url && !githubIssue.value) {
            fetchGithubIssue();
        }

        // Scroll to reply form if quote navigated us to last page
        if (pendingScrollToReply.value) {
            pendingScrollToReply.value = false;
            nextTick(() => {
                replyFormEl.value?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            });
            return;
        }

        // Scroll to the first unread post
        if (data.data.firstUnreadPostId) {
            nextTick(() => {
                const el = document.getElementById(`unread-divider`);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
            return;
        }

        // Scroll to a specific post if hash is present
        const hash = route.hash;
        if (hash?.startsWith("#post-")) {
            nextTick(() => {
                const el = document.querySelector(hash);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("ring-2", "ring-primary");
                    setTimeout(
                        () => el.classList.remove("ring-2", "ring-primary"),
                        3000,
                    );
                }
            });
        }
    }
});

useHead({
    title: () => {
        const data = threadData.value;
        if (data?.status === Status.SUCCESS) return data.data.thread.title;
        return "Discussions";
    },
});
</script>
