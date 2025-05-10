<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Ko-Fi Perks</h2>
      <form
        v-if="kofiLevel"
        class="flex flex-col gap-4 items-center w-full"
        @submit.prevent="saveSettings"
      >
        <label class="flex gap-2 items-center w-full xl:w-3/4">
          <Toggle v-model="opt_into_testing" />
          <div>
            Opt into development features. These features may not be finished,
            but provide early access into what's coming next on ClockTracker
          </div>
        </label>
        <Button type="submit" primary class="px-4 py-2" :disabled="inFlight">
          <template v-if="inFlight">
            <Spinner />
            Saving...
          </template>
          <template v-else>Save Settings</template>
        </Button>
        <span v-if="errorMessage" class="text-red-600">{{ errorMessage }}</span>
        <span v-if="savedSuccessfully" class="text-green-600">
          Profile updated successfully!
        </span>
      </form>
      <div v-else>
        <p>
          You must be a Ko-Fi supporter to access these features.
          <a
            href="https://ko-fi.com/clocktracker"
            class="underline"
            target="_blank"
          >
            Become a supporter now!
          </a>
        </p>
      </div>
      <!-- <h2 class="font-sorts text-4xl text-center">
        Current Supporter Perks
      </h2> -->
      <!-- <section>
        <h3 class="font-sorts text-2xl">Advanced Game Editor</h3>
        <p class="p-2">
          I have been working on some adjustments to the game editor. The most
          obvious change is to how the grimoire is entered. Since Clocktracker
          is already able to determine which roles you were assigned based on
          the grimoire, this change allows you to either enter individual roles
          OR the grimoire, but without forcing you to look at both.
        </p>
        <img src="/img/perks/advanced-editor-1.webp" />
        <img src="/img/perks/advanced-editor-2.webp" />
      </section> -->
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const inFlight = ref(false);
const errorMessage = ref<string>();
const savedSuccessfully = ref(false);
const users = useUsers();
const user = useSupabaseUser();

const kofiLevel = computed(() => {
  const u = users.getUserById(user.value?.id);

  if (u.status !== Status.SUCCESS) return null;

  return u.data.kofi_level;
});

const settings = await $fetch("/api/settings");

const opt_into_testing = ref(settings?.opt_into_testing || false);

async function saveSettings() {
  inFlight.value = true;
  savedSuccessfully.value = false;
  errorMessage.value = "";

  try {
    await $fetch("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        opt_into_testing: opt_into_testing.value,
      }),
    });

    inFlight.value = false;
    savedSuccessfully.value = true;

    users.fetchMe(user.value?.id);
  } catch (error: any) {
    console.error(error);
    errorMessage.value = error.message || "An error occurred";
    inFlight.value = false;
  }
}
</script>

<style scoped>
input {
  color: black;
}
</style>
