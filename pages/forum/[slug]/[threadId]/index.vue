<template>
    <StandardTemplate>
        <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-4xl mx-auto">
            <template v-if="threadData?.status === Status.SUCCESS">
                <div class="flex items-center justify-between">
                    <nuxt-link
                        :to="`/forum/${threadData.data.thread.category.slug}`"
                        class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
                    >
                        &larr; {{ threadData.data.thread.category.name }}
                    </nuxt-link>

                    <div class="flex gap-1 shrink-0">
                        <Button
                            v-if="isLoggedIn"
                            size="xs"
                            :color="isSubscribed ? 'primary' : 'secondary'"
                            :icon="isSubscribed ? 'star' : 'star-bordered'"
                            @click="toggleSubscribe"
                        >
                            {{ isSubscribed ? "Subscribed" : "Subscribe" }}
                        </Button>
                        <Button
                            v-if="canModerate"
                            size="xs"
                            color="secondary"
                            icon="pin"
                            @click="togglePin"
                        >
                            {{
                                threadData.data.thread.is_pinned
                                    ? "Unpin"
                                    : "Pin"
                            }}
                        </Button>
                        <Button
                            v-if="canModerate"
                            size="xs"
                            color="secondary"
                            :icon="
                                threadData.data.thread.is_locked
                                    ? 'unlock'
                                    : 'lock'
                            "
                            @click="toggleLock"
                        >
                            {{
                                threadData.data.thread.is_locked
                                    ? "Unlock"
                                    : "Lock"
                            }}
                        </Button>
                        <Button
                            v-if="canModerate"
                            size="xs"
                            color="secondary"
                            icon="arrow-right-short"
                            @click="showMoveDialog = true"
                        >
                            Move
                        </Button>
                        <Button
                            v-if="canModerate"
                            size="xs"
                            color="negative"
                            icon="trash"
                            @click="handleDeleteThread"
                        >
                            Delete
                        </Button>
                        <Button
                            v-if="canCreateGithubIssue && !threadData.data.thread.github_issue_url"
                            size="xs"
                            color="secondary"
                            icon="github"
                            :disabled="creatingGithubIssue"
                            @click="createGithubIssue"
                        >
                            {{ creatingGithubIssue ? "Creating..." : "Create Issue" }}
                        </Button>
                        <a
                            v-if="threadData.data.thread.github_issue_url"
                            :href="threadData.data.thread.github_issue_url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                        >
                            <IconUI id="github" size="xs" />
                            GitHub Issue
                        </a>
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
                    <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">
                        Started by
                        {{
                            threadData.data.thread.author.display_name
                        }}
                        &middot;
                        {{ formatDate(threadData.data.thread.created_at) }}
                    </p>
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
                            {{ githubIssue.is_pull_request ? "Pull Request" : "Issue" }}
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
                    <IconUI id="github" size="sm" class="text-stone-400 shrink-0" />
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
                        <span class="text-xs font-semibold text-primary uppercase tracking-wider">New</span>
                        <div class="flex-1 border-t border-primary/50" />
                    </div>
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
                                            expandedDeletedPosts.has(post.id) &&
                                            post.deleted_author?.avatar
                                                ? post.deleted_author.avatar
                                                : '/img/token-bg.webp'
                                        "
                                        size="sm"
                                        class="border-stone-800"
                                        :background="
                                            expandedDeletedPosts.has(post.id) &&
                                            !!post.deleted_author
                                        "
                                    />
                                    <div
                                        v-if="
                                            !expandedDeletedPosts.has(post.id)
                                        "
                                        class="absolute top-0 left-0 z-10 flex justify-center w-full pointer-events-none"
                                    >
                                        <img
                                            src="/img/shroud.png"
                                            class="w-6 md:w-8"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <template
                                        v-if="
                                            expandedDeletedPosts.has(post.id) &&
                                            post.deleted_author
                                        "
                                    >
                                        <nuxt-link
                                            :to="`/@${post.deleted_author.username}`"
                                            class="text-sm font-semibold hover:underline"
                                            :class="
                                                nameColorClass(
                                                    post.deleted_author
                                                        .name_color,
                                                )
                                            "
                                            :style="
                                                nameColorStyle(
                                                    post.deleted_author
                                                        .name_color,
                                                )
                                            "
                                        >
                                            {{
                                                post.deleted_author.display_name
                                            }}
                                        </nuxt-link>
                                        <span
                                            v-if="post.deleted_author.badge"
                                            class="ml-1.5 text-[0.625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            :class="
                                                badgeClass(
                                                    post.deleted_author.badge,
                                                    post.deleted_author
                                                        .name_color,
                                                )
                                            "
                                            :style="
                                                badgeStyle(
                                                    post.deleted_author.badge,
                                                    post.deleted_author
                                                        .name_color,
                                                )
                                            "
                                        >
                                            {{
                                                badgeLabel(
                                                    post.deleted_author.badge,
                                                )
                                            }}
                                        </span>
                                    </template>
                                    <span
                                        v-else
                                        class="text-sm text-stone-400 italic"
                                        >[deleted]</span
                                    >
                                    <div
                                        class="text-xs text-stone-500 dark:text-stone-400"
                                    >
                                        {{ formatDate(post.created_at) }}
                                        <span
                                            v-if="
                                                expandedDeletedPosts.has(
                                                    post.id,
                                                )
                                            "
                                            class="text-red-400 ml-1"
                                            >[deleted]</span
                                        >
                                        <button
                                            v-if="
                                                expandedDeletedPosts.has(
                                                    post.id,
                                                ) && post.edited_at
                                            "
                                            type="button"
                                            class="hover:underline ml-1"
                                            @click="showEditHistory(post.id)"
                                        >
                                            &middot;
                                            {{
                                                post.edited_by_label
                                                    ? `edited by ${post.edited_by_label}`
                                                    : "edited"
                                            }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <template
                                v-if="
                                    expandedDeletedPosts.has(post.id) &&
                                    post.deleted_body
                                "
                            >
                                <VueMarkdown
                                    class="post text-sm opacity-60"
                                    :source="post.deleted_body"
                                    :options="{ html: false }"
                                />
                            </template>
                            <p v-else class="text-sm text-stone-400 italic">
                                [deleted]
                            </p>
                            <button
                                v-if="post.deleted_body"
                                type="button"
                                class="text-xs text-primary hover:underline mt-2 block"
                                @click="toggleDeletedPost(post.id)"
                            >
                                {{
                                    expandedDeletedPosts.has(post.id)
                                        ? "Hide original"
                                        : "View original"
                                }}
                            </button>
                        </template>

                        <!-- Normal post -->
                        <template v-else>
                            <div
                                v-if="
                                    isLoggedIn ||
                                    canEditPost(post) ||
                                    canDeletePost(post) ||
                                    canBanUser(post)
                                "
                                class="float-right flex items-center gap-5 ml-4"
                            >
                                <button
                                    v-if="
                                        isLoggedIn &&
                                        !threadData.data.thread.is_locked
                                    "
                                    type="button"
                                    class="text-stone-400 hover:text-stone-200 transition-colors"
                                    title="Quote"
                                    @click="quotePost(post)"
                                >
                                    <IconUI id="reply" size="sm" />
                                </button>
                                <button
                                    v-if="
                                        isLoggedIn &&
                                        !post.deleted &&
                                        post.author.user_id !== user?.id
                                    "
                                    type="button"
                                    class="text-stone-400 hover:text-stone-200 transition-colors"
                                    title="Report"
                                    @click="openReportDialog(post.id)"
                                >
                                    <IconUI id="exclamation-circle" size="sm" />
                                </button>
                                <button
                                    v-if="canEditPost(post)"
                                    type="button"
                                    class="text-stone-400 hover:text-stone-200 transition-colors"
                                    title="Edit"
                                    @click="startEdit(post)"
                                >
                                    <IconUI id="edit" size="sm" />
                                </button>
                                <button
                                    v-if="canDeletePost(post)"
                                    type="button"
                                    class="text-red-400 hover:text-red-300 transition-colors"
                                    title="Delete"
                                    @click="handleDeletePost(post.id)"
                                >
                                    <IconUI id="trash" size="sm" />
                                </button>
                                <button
                                    v-if="canBanUser(post)"
                                    type="button"
                                    class="text-amber-400 hover:text-amber-300 transition-colors"
                                    title="Ban user"
                                    @click="
                                        toggleBanForm(
                                            post.author.user_id,
                                            post.author.display_name,
                                        )
                                    "
                                >
                                    <IconUI id="disabled" size="sm" />
                                </button>
                            </div>
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
                                            :class="
                                                nameColorClass(
                                                    post.author.name_color,
                                                )
                                            "
                                            :style="
                                                nameColorStyle(
                                                    post.author.name_color,
                                                )
                                            "
                                        >
                                            {{ post.author.display_name }}
                                        </nuxt-link>
                                        <span
                                            v-if="post.author.badge"
                                            class="text-[0.625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            :class="
                                                badgeClass(
                                                    post.author.badge,
                                                    post.author.name_color,
                                                )
                                            "
                                            :style="
                                                badgeStyle(
                                                    post.author.badge,
                                                    post.author.name_color,
                                                )
                                            "
                                        >
                                            {{ badgeLabel(post.author.badge) }}
                                        </span>
                                    </div>
                                    <div
                                        class="text-xs text-stone-500 dark:text-stone-400"
                                    >
                                        {{ formatDate(post.created_at) }}
                                        <button
                                            v-if="post.edited_at"
                                            type="button"
                                            class="hover:underline"
                                            @click="showEditHistory(post.id)"
                                        >
                                            &middot;
                                            {{
                                                post.edited_by_label
                                                    ? `edited by ${post.edited_by_label}`
                                                    : "edited"
                                            }}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Edit mode -->
                            <template v-if="editingPostId === post.id">
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
                                                        : 'border-transparent text-stone-400 hover:text-stone-200'
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
                                                        : 'border-transparent text-stone-400 hover:text-stone-200'
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
                                        <VueMarkdown
                                            v-if="editBody.trim()"
                                            class="post text-sm"
                                            :source="editBody"
                                            :options="{ html: false }"
                                        />
                                        <p
                                            v-else
                                            class="text-sm text-stone-400 italic"
                                        >
                                            Nothing to preview
                                        </p>
                                    </div>
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                color="primary"
                                                @click="submitEdit(post.id)"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="secondary"
                                                @click="cancelEdit"
                                            >
                                                Cancel
                                            </Button>
                                            <button
                                                type="button"
                                                class="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                                                :disabled="uploadingImage"
                                                @click="uploadImage('edit')"
                                            >
                                                <IconUI
                                                    v-if="!uploadingImage"
                                                    id="upload"
                                                    size="sm"
                                                />
                                                <IconUI
                                                    v-else
                                                    id="dots"
                                                    size="sm"
                                                    class="animate-pulse"
                                                />
                                                Upload image
                                            </button>
                                            <ForumLinkInsert
                                                @insert="editBody += $event"
                                            />
                                        </div>
                                        <span
                                            class="text-xs"
                                            :class="
                                                editBody.length >
                                                POST_BODY_MAX_LENGTH
                                                    ? 'text-red-500'
                                                    : 'text-stone-400'
                                            "
                                        >
                                            {{
                                                editBody.length.toLocaleString()
                                            }}
                                            /
                                            {{
                                                POST_BODY_MAX_LENGTH.toLocaleString()
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </template>
                            <!-- Display mode -->
                            <template v-else>
                                <VueMarkdown
                                    class="post"
                                    :class="
                                        isAnnouncementFirstPost(postIndex)
                                            ? 'text-base'
                                            : 'text-sm'
                                    "
                                    :source="post.body"
                                    :options="{ html: false }"
                                />
                            </template>

                            <!-- Link preview cards -->
                            <ForumLinkCards :body="post.body" />

                            <!-- Reactions -->
                            <div
                                class="flex flex-wrap items-center gap-1.5 mt-3"
                            >
                                <button
                                    v-for="group in groupReactions(post)"
                                    :key="group.emoji"
                                    type="button"
                                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
                                    :class="
                                        group.reacted
                                            ? 'border-primary bg-primary/10 text-stone-800 dark:text-stone-100'
                                            : 'border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500'
                                    "
                                    :title="group.users.join(', ')"
                                    @click="
                                        handleReaction(post.id, group.emoji)
                                    "
                                >
                                    <span>{{ group.emoji }}</span>
                                    <span>{{ group.count }}</span>
                                </button>
                                <div
                                    v-if="isLoggedIn"
                                    class="relative emoji-picker-container"
                                >
                                    <button
                                        type="button"
                                        class="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-stone-300 dark:border-stone-700 text-stone-400 hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-200 transition-colors text-xs"
                                        title="Add reaction"
                                        @click="openEmojiPicker(post.id)"
                                    >
                                        +
                                    </button>
                                    <div
                                        v-if="emojiPickerPostId === post.id"
                                        class="absolute z-20 bottom-full mb-2 left-0 p-2 rounded border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 shadow-lg flex flex-wrap gap-1 w-56"
                                    >
                                        <button
                                            v-for="emoji in EMOJI_OPTIONS"
                                            :key="emoji"
                                            type="button"
                                            class="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-lg"
                                            @click="
                                                handleReaction(post.id, emoji)
                                            "
                                        >
                                            {{ emoji }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
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

                <!-- Report Dialog -->
                <Dialog v-model:visible="showReportDialog" size="sm">
                    <template #title>
                        <h2 class="font-sorts text-xl">Report Post</h2>
                    </template>
                    <div class="p-4 flex flex-col gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-sm text-stone-400"
                                >Why are you reporting this post?</label
                            >
                            <ExpandingTextarea
                                v-model="reportReason"
                                :rows="3"
                            />
                        </div>
                        <div class="flex gap-2">
                            <Button
                                color="negative"
                                :disabled="
                                    !reportReason.trim() || reportSubmitting
                                "
                                @click="submitReport"
                            >
                                {{
                                    reportSubmitting
                                        ? "Submitting..."
                                        : "Submit Report"
                                }}
                            </Button>
                            <Button
                                color="secondary"
                                @click="showReportDialog = false"
                            >
                                Cancel
                            </Button>
                        </div>
                        <p v-if="reportError" class="text-sm text-red-500">
                            {{ reportError }}
                        </p>
                        <p v-if="reportSuccess" class="text-sm text-green-500">
                            Report submitted. Thank you.
                        </p>
                    </div>
                </Dialog>

                <!-- Edit History Dialog -->
                <Dialog v-model:visible="showEditHistoryDialog" size="md">
                    <template #title>
                        <h2 class="font-sorts text-xl">Edit History</h2>
                    </template>
                    <div class="p-4">
                        <Loading v-if="editHistoryLoading" />
                        <p
                            v-else-if="editHistory.length === 0"
                            class="text-sm text-stone-400"
                        >
                            No edit history available.
                        </p>
                        <div v-else class="flex flex-col gap-4">
                            <div
                                v-for="edit in editHistory"
                                :key="edit.id"
                                class="p-3 rounded border border-stone-300/50 dark:border-stone-700/30 bg-stone-200/50 dark:bg-stone-800/50"
                            >
                                <div
                                    class="text-xs text-stone-500 dark:text-stone-400 mb-2"
                                >
                                    Edited by
                                    <span class="font-semibold">{{
                                        edit.editor.display_name
                                    }}</span>
                                    &middot; {{ formatDate(edit.created_at) }}
                                </div>
                                <template v-if="edit.previous_body !== null">
                                    <pre
                                        class="text-xs whitespace-pre-wrap text-stone-400"
                                        >{{ edit.previous_body }}</pre
                                    >
                                </template>
                                <p v-else class="text-xs text-stone-400 italic">
                                    Edit details hidden &mdash;
                                    {{ edit.editor.display_name }} edit
                                </p>
                            </div>
                        </div>
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
                        <p
                            v-if="moveError"
                            class="text-xs text-red-500"
                        >
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
                                {{
                                    movingThread
                                        ? "Moving..."
                                        : "Move Thread"
                                }}
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
                    v-if="isLoggedIn && !threadData.data.thread.is_locked && page === totalPages"
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
                                        : 'border-transparent text-stone-400 hover:text-stone-200'
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
                                        : 'border-transparent text-stone-400 hover:text-stone-200'
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
                        <VueMarkdown
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
                            <button
                                type="button"
                                class="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition-colors"
                                :disabled="uploadingImage"
                                @click="uploadImage('reply')"
                            >
                                <IconUI
                                    v-if="!uploadingImage"
                                    id="upload"
                                    size="sm"
                                />
                                <IconUI
                                    v-else
                                    id="dots"
                                    size="sm"
                                    class="animate-pulse"
                                />
                                Upload image
                            </button>
                            <ForumLinkInsert @insert="replyBody += $event" />
                        </div>
                        <span
                            class="text-xs"
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
                    <button
                        type="button"
                        class="text-sm text-stone-400 hover:text-stone-200 hover:underline transition-colors"
                        @click="toggleSubscribe"
                    >
                        {{
                            isSubscribed
                                ? "Unsubscribe from this thread"
                                : "Subscribe to this thread"
                        }}
                    </button>
                </div>
            </template>
            <Loading v-else />
        </div>
    </StandardTemplate>
</template>

<script setup lang="ts">
import VueMarkdown from "vue-markdown-render";
import { Status } from "~/composables/useFetchStatus";
import type { ForumPost } from "~/composables/useForum";

const POST_BODY_MAX_LENGTH = 10_000;
const EMOJI_OPTIONS = [
    "👍",
    "👎",
    "❤️",
    "😂",
    "😮",
    "😢",
    "🎉",
    "🤔",
    "👏",
    "🔥",
    "😈",
    "💀",
    "👹",
    "🩸",
    "👻",
    "⚰️",
];

const route = useRoute();
const router = useRouter();
const threadId = route.params.threadId as string;
const forum = useForum();
const user = useUser();
const me = useMe();
const page = ref(Math.max(1, Number(route.query.page) || 1));
const wantUnread = ref(route.query.unread === "1");

const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const replyBody = ref("");
const replyError = ref("");
const editingPostId = ref<string | null>(null);
const editBody = ref("");
const banningUserId = ref<string | null>(null);
const banDisplayName = ref("");
const showBanDialog = ref(false);
const banReason = ref("");
const banDuration = ref("");
const banError = ref("");
const uploadingImage = ref(false);
const emojiPickerPostId = ref<string | null>(null);
const showReportDialog = ref(false);
const reportPostId = ref<string | null>(null);
const reportReason = ref("");
const reportError = ref("");
const reportSuccess = ref(false);
const reportSubmitting = ref(false);
const showEditHistoryDialog = ref(false);
const editHistory = ref<
    {
        id: string;
        previous_body: string | null;
        created_at: string;
        editor: { display_name: string };
        mod_edit?: boolean;
    }[]
>([]);
const editHistoryLoading = ref(false);
const isSubscribed = ref(false);
const expandedDeletedPosts = ref(new Set<string>());
const replyFormEl = ref<HTMLFormElement | null>(null);
const replyTab = ref<"write" | "preview">("write");
const editTab = ref<"write" | "preview">("write");

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

function parseGithubUrl(url: string): { owner: string; repo: string; number: string } | null {
    const match = url.match(/github\.com\/([\w.-]+)\/([\w.-]+)\/issues\/(\d+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2], number: match[3] };
}

async function fetchGithubIssue() {
    const data = threadData.value;
    if (data?.status !== Status.SUCCESS || !data.data.thread.github_issue_url) return;

    const parsed = parseGithubUrl(data.data.thread.github_issue_url);
    if (!parsed) return;

    githubIssueLoading.value = true;
    try {
        githubIssue.value = await $fetch("/api/forum/github-preview", {
            query: { owner: parsed.owner, repo: parsed.repo, type: "issues", number: parsed.number },
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

function nameColorStyle(
    color: string | null | undefined,
): Record<string, string> {
    if (!color || color === "admin" || color === "supporter") return {};
    // Custom hex color from user group
    return { color };
}

function badgeLabel(badge: string): string {
    if (badge === "admin") return "Admin";
    if (badge === "moderator") return "Moderator";
    if (badge === "supporter") return "Supporter";
    return "";
}

function badgeClass(
    badge: string,
    nameColor: string | null | undefined,
): string {
    if (badge === "admin")
        return "bg-red-500/15 text-red-500 dark:text-red-400";
    if (badge === "supporter")
        return "bg-teal-500/15 text-teal-600 dark:text-teal-400";
    // Moderator: use name_color if it's a custom hex, otherwise fallback
    if (badge === "moderator") {
        if (nameColor && nameColor !== "admin" && nameColor !== "supporter")
            return "";
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
    }
    return "";
}

function badgeStyle(
    badge: string,
    nameColor: string | null | undefined,
): Record<string, string> {
    if (
        badge === "moderator" &&
        nameColor &&
        nameColor !== "admin" &&
        nameColor !== "supporter"
    ) {
        return { color: nameColor, backgroundColor: `${nameColor}26` };
    }
    return {};
}

function toggleDeletedPost(postId: string) {
    if (expandedDeletedPosts.value.has(postId)) {
        expandedDeletedPosts.value.delete(postId);
    } else {
        expandedDeletedPosts.value.add(postId);
    }
}

function startEdit(post: ForumPost) {
    editingPostId.value = post.id;
    editBody.value = post.body;
    editTab.value = "write";
}

function cancelEdit() {
    editingPostId.value = null;
    editBody.value = "";
    editTab.value = "write";
}

async function submitEdit(postId: string) {
    if (!editBody.value.trim()) return;

    try {
        const updated = await forum.editPost(postId, editBody.value);
        const cached = threadData.value;
        if (cached?.status === Status.SUCCESS) {
            const idx = cached.data.posts.findIndex((p) => p.id === postId);
            if (idx !== -1) {
                const existing = cached.data.posts[idx];
                cached.data.posts[idx] = {
                    ...updated,
                    reactions: existing.reactions,
                    edited_by_label: existing.edited_by_label,
                    deleted_body: existing.deleted_body,
                    deleted_author: existing.deleted_author,
                    author: {
                        ...updated.author,
                        name_color: existing.author.name_color,
                        badge: existing.author.badge,
                    },
                };
            }
        }
        cancelEdit();
    } catch (err: any) {
        console.error(err);
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

async function handleDeletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
        const result = await forum.deletePost(threadId, postId);
        if (result.threadDeleted) {
            const slug =
                threadData.value?.status === Status.SUCCESS
                    ? threadData.value.data.thread.category.slug
                    : "forum";
            router.push(`/forum/${slug}`);
        }
    } catch (err: any) {
        console.error(err);
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
        moveError.value =
            err?.data?.statusMessage || "Failed to move thread";
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

async function showEditHistory(postId: string) {
    showEditHistoryDialog.value = true;
    editHistoryLoading.value = true;
    editHistory.value = [];
    try {
        editHistory.value = await $fetch(`/api/forum/posts/${postId}/edits`);
    } catch (err: any) {
        console.error(err);
    } finally {
        editHistoryLoading.value = false;
    }
}

function openReportDialog(postId: string) {
    reportPostId.value = postId;
    reportReason.value = "";
    reportError.value = "";
    reportSuccess.value = false;
    showReportDialog.value = true;
}

async function submitReport() {
    if (!reportPostId.value || !reportReason.value.trim()) return;
    reportSubmitting.value = true;
    reportError.value = "";

    try {
        await $fetch(`/api/forum/posts/${reportPostId.value}/report`, {
            method: "POST",
            body: { reason: reportReason.value },
        });
        reportSuccess.value = true;
        reportReason.value = "";
    } catch (err: any) {
        reportError.value =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "Failed to submit report";
    } finally {
        reportSubmitting.value = false;
    }
}

function groupReactions(post: ForumPost) {
    const groups = new Map<
        string,
        { emoji: string; count: number; reacted: boolean; users: string[] }
    >();
    for (const r of post.reactions) {
        const existing = groups.get(r.emoji);
        if (existing) {
            existing.count++;
            if (r.user_id === user.value?.id) existing.reacted = true;
        } else {
            groups.set(r.emoji, {
                emoji: r.emoji,
                count: 1,
                reacted: r.user_id === user.value?.id,
                users: [],
            });
        }
    }
    return Array.from(groups.values());
}

function openEmojiPicker(postId: string) {
    emojiPickerPostId.value =
        emojiPickerPostId.value === postId ? null : postId;
}

async function handleReaction(postId: string, emoji: string) {
    emojiPickerPostId.value = null;
    if (!user.value) return;
    try {
        await forum.toggleReaction(threadId, postId, emoji, user.value.id);
    } catch (err: any) {
        console.error("Reaction failed", err);
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

function uploadImage(target: "reply" | "edit") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpg, image/jpeg, image/png, image/gif, image/webp";
    input.onchange = async (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files?.length) return;

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

            const markdown = `\n![image](${urls[0]})\n`;
            if (target === "reply") {
                replyBody.value += markdown;
            } else {
                editBody.value += markdown;
            }
        } catch (err: any) {
            console.error("Image upload failed", err);
        } finally {
            uploadingImage.value = false;
        }
    };
    input.click();
}

function onClickOutsideEmoji(e: MouseEvent) {
    if (
        emojiPickerPostId.value &&
        !(e.target as HTMLElement).closest(".emoji-picker-container")
    ) {
        emojiPickerPostId.value = null;
    }
}

onMounted(async () => {
    document.addEventListener("click", onClickOutsideEmoji);
    forum.fetchThread(threadId, page.value, wantUnread.value);
    try {
        forumMe.value = await $fetch("/api/forum/me");
    } catch {}
});
onBeforeUnmount(() => {
    document.removeEventListener("click", onClickOutsideEmoji);
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
