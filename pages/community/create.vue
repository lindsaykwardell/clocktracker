<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-dumbledor text-4xl text-center">Create Community</h2>
      <form
        class="max-w-[1000px] m-auto py-6 flex flex-col gap-4"
        @submit.prevent="createCommunity"
      >
        <label>
          <span class="block">Name</span>
          <input
            v-model="community.name"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label>
          <span class="block">Description</span>
          <textarea
            v-model="community.description"
            class="block w-full border border-stone-500 rounded-md p-2 text-black"
            rows="5"
          ></textarea>
        </label>
        <Button
          type="submit"
          id="save-game"
          class="py-2 px-4 w-[300px] m-auto"
          :disabled="inFlight"
          primary
        >
          <template v-if="inFlight">
            <Spinner />
            Saving...
          </template>
          <template v-else>Create New Community</template>
        </Button>
        <template v-if="errors">
          <div class="text-red-500 text-center">{{ errors }}</div>
        </template>
      </form>
    </section>
  </StandardTemplate>
</template>

<script setup lang="ts">
const router = useRouter();

const community = reactive({
  name: "",
  slug: "",
  description: "",
});
const inFlight = ref(false);
const errors = ref("");

watchEffect(() => {
  community.slug = community.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
});

async function createCommunity() {
  inFlight.value = true;
  errors.value = "";
  try {
    const saved = await $fetch("/api/community", {
      method: "POST",
      body: JSON.stringify(community),
    });

    if (saved) {
      router.push(`/community/${community.slug}`);
    }
  } catch (err) {
    errors.value = (err as any).statusMessage;
  }
}
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-lg bg-stone-600 text-white;

  &:disabled {
    @apply bg-stone-700;
  }
}

textarea {
  @apply text-lg bg-stone-600 text-white;
}
</style>
