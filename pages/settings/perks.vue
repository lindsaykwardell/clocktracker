<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-dumbledor text-4xl text-center">Ko-Fi Perks</h2>
      <form
        v-if="kofiLevel"
        class="flex flex-col gap-4 items-center w-full"
        @submit.prevent="saveSettings"
      >
        <label class="flex gap-2 items-center w-full xl:w-3/4">
          <Switch
            v-model="opt_into_testing"
            :class="opt_into_testing ? 'bg-blue-700' : 'bg-blue-950'"
            class="relative inline-flex h-[24px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
          >
            <span class="sr-only">Use setting</span>
            <span
              aria-hidden="true"
              :class="opt_into_testing ? 'translate-x-9' : 'translate-x-0'"
              class="pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
            />
          </Switch>
          <div>
            Opt into development features. These features may not be finished,
            but provide early access into what's coming next on ClockTracker
          </div>
        </label>
        <button
          type="submit"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
          :disabled="inFlight"
        >
          <template v-if="inFlight">
            <Spinner />
            Saving...
          </template>
          <template v-else>Save Settings</template>
        </button>
        <span v-if="errorMessage" class="text-red-600">{{ errorMessage }}</span>
        <span v-if="savedSuccessfully" class="text-green-600">
          Profile updated successfully!
        </span>
      </form>
      <div v-else>
        <p>
          You must be a Ko-Fi supporter to access these features.
          <a href="https://ko-fi.com/clocktracker" class="underline">Become a supporter now!</a>
        </p>
      </div>
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
import { Switch } from "@headlessui/vue";

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

const settings = await useFetch("/api/settings");

const opt_into_testing = ref(settings.data.value?.opt_into_testing);

async function saveSettings() {
  inFlight.value = true;
  savedSuccessfully.value = false;
  errorMessage.value = "";

  const { error } = await useFetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      opt_into_testing: opt_into_testing.value,
    }),
  });

  if (error.value) {
    console.error(error);
    errorMessage.value = error.value.statusMessage;
    inFlight.value = false;
    return;
  }

  inFlight.value = false;
  savedSuccessfully.value = true;

  users.fetchMe(user.value?.id);
}
</script>

<style scoped>
input {
  color: black;
}
</style>
