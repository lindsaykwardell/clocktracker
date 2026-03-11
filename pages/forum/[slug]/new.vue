<template>
    <StandardTemplate>
        <div class="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 lg:pb-8 max-w-2xl mx-auto">
            <nuxt-link
                :to="`/forum/${slug}`"
                class="text-sm text-stone-500 dark:text-stone-400 hover:underline"
            >
                &larr; Back
            </nuxt-link>
            <h1 class="font-sorts text-2xl lg:text-3xl mt-2 mb-6">
                New Thread
            </h1>

            <form @submit.prevent="submit" class="flex flex-col gap-4">
                <div class="flex flex-col gap-1">
                    <label>Title</label>
                    <Input v-model="title" />
                </div>
                <div class="flex flex-col gap-1">
                    <label>Body</label>
                    <div
                        class="flex items-center justify-between text-sm border-b border-stone-300 dark:border-stone-700"
                    >
                        <div class="flex gap-2">
                            <button
                                type="button"
                                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                                :class="
                                    bodyTab === 'write'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                                "
                                @click="bodyTab = 'write'"
                            >
                                Write
                            </button>
                            <button
                                type="button"
                                class="px-3 py-1 -mb-px border-b-2 transition-colors"
                                :class="
                                    bodyTab === 'preview'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200'
                                "
                                @click="bodyTab = 'preview'"
                            >
                                Preview
                            </button>
                        </div>
                        <MarkdownHelp />
                    </div>
                    <ExpandingTextarea
                        v-if="bodyTab === 'write'"
                        v-model="body"
                        :rows="5"
                    />
                    <div v-else class="min-h-[7.5rem] p-2">
                        <VueMarkdown
                            v-if="body.trim()"
                            class="post text-sm"
                            :source="body"
                            :options="{ html: false }"
                        />
                        <p v-else class="text-sm text-stone-400 italic">
                            Nothing to preview
                        </p>
                    </div>
                    <span
                        class="text-xs self-end"
                        :class="
                            body.length > POST_BODY_MAX_LENGTH
                                ? 'text-red-500'
                                : 'text-stone-400'
                        "
                    >
                        {{ body.length.toLocaleString() }} /
                        {{ POST_BODY_MAX_LENGTH.toLocaleString() }}
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        type="submit"
                        color="primary"
                        :disabled="
                            !title.trim() ||
                            !body.trim() ||
                            body.length > POST_BODY_MAX_LENGTH ||
                            submitting
                        "
                    >
                        {{ submitting ? "Creating..." : "Create Thread" }}
                    </Button>
                    <Button
                        variant="link"
                        size="sm"
                        :icon="uploadingImage ? 'dots' : 'upload'"
                        :icon-spin="uploadingImage"
                        :disabled="uploadingImage"
                        @click="handleUploadImage"
                    >
                        Upload image
                    </Button>
                    <ForumLinkInsert @insert="body += $event" />
                </div>
                <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            </form>
        </div>
    </StandardTemplate>
</template>

<script setup lang="ts">
import VueMarkdown from "vue-markdown-render";

definePageMeta({ middleware: "auth" });

const POST_BODY_MAX_LENGTH = 10_000;

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;
const forum = useForum();

const title = ref("");
const body = ref("");
const submitting = ref(false);
const error = ref("");
const bodyTab = ref<"write" | "preview">("write");
const uploadingImage = ref(false);

function handleUploadImage() {
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

            body.value += `\n![image](${urls[0]})\n`;
        } catch (err: any) {
            console.error("Image upload failed", err);
        } finally {
            uploadingImage.value = false;
        }
    };
    input.click();
}

async function submit() {
    if (!title.value.trim() || !body.value.trim()) return;
    submitting.value = true;
    error.value = "";

    try {
        const thread = await forum.createThread(slug, title.value, body.value);
        router.push(`/forum/${slug}/${thread.id}`);
    } catch (err: any) {
        error.value =
            err?.data?.statusMessage ||
            err?.statusMessage ||
            "Failed to create thread";
        submitting.value = false;
    }
}

useHead({ title: "New Thread" });
</script>
