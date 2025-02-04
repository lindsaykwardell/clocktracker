<template>
  <StandardTemplate>
    <section class="py-6">
      <h2 class="font-sorts text-4xl text-center">Create Community</h2>
      <form
        class="max-w-[1000px] m-auto py-6 flex flex-col gap-4"
        @submit.prevent="createCommunity"
      >
        <label>
          <span class="block">Name</span>
          <Input v-model="community.name" required />
        </label>
        <label>
          <span class="block">Description</span>
          <Input
            mode="textarea"
            v-model="community.description"
            rows="5"
          ></Input>
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
