<template>
  <main
    v-if="render"
    class="w-full h-screen flex flex-col items-center justify-center gap-12"
  >
    <h1 class="font-piratesbay text-stone-200 text-4xl">ClockTracker</h1>
    <img class="w-[100px]" src="/demon-head.png" alt="Demon Head" />
    <h2 class="text-stone-200 text-2xl font-piratesbay">
      Welcome, {{ user?.user_metadata.full_name }}
    </h2>
    <form
      class="flex flex-col gap-4 items-center"
      @submit.prevent="saveSettings"
    >
      <Avatar
        :value="settings.data.value?.avatar || settings.data.value?.email"
      />
      <label class="block w-[300px]">
        <span class="block">Username</span>
        <input
          v-model="username"
          class="block w-full border border-stone-500 rounded-md p-2"
        />
      </label>
      <button
        type="submit"
        class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        :disabled="inFlight"
      >
        <template v-if="inFlight">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving...
        </template>
        <template v-else>Save Settings</template>
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const render = ref(false);
const router = useRouter();
const inFlight = ref(false);

const user = useSupabaseUser();
const settings = await useFetch("/api/settings");

if (settings.data.value?.finished_welcome) {
  router.push("/dashboard");
} else {
  render.value = true;
}

const username = ref(settings.data.value?.username);

async function saveSettings() {
  inFlight.value = true;
  const { error } = await useFetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      username: username.value,
      finished_welcome: true,
    }),
  });

  if (error.value) {
    console.error(error);
    inFlight.value = false;
    return;
  }

  router.push("/dashboard");
}
</script>

<style scoped>
input {
  color: black;
}
</style>
