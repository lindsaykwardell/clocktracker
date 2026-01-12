<template>
  <main
    v-if="render"
    class="w-full h-screen flex flex-col items-center gap-6 py-4"
  >
    <img class="w-[300px] bg-stone-900 rounded-full" src="/logo.png" alt="ClockTracker" />
    <h1 class="text-2xl font-sorts">
      <!-- @todo This full_name doen't work on the welcome page -->
      Welcome, {{ user?.user_metadata.full_name }}
    </h1>
    <form
      class="flex flex-col gap-4 items-center"
      @submit.prevent="saveSettings"
    >
      <Avatar :value="avatar" />
      <Button @click.prevent.stop="selectAvatar" size="small">
        Upload avatar
      </Button>
      <label class="block w-[300px]">
        <span class="block">Username</span>
        <input
          v-model="username"
          class="block w-full border border-stone-500 rounded-md p-2"
          pattern="^[a-zA-Z0-9_-]*$"
          title="Username can only contain letters, numbers, underscores, and dashes."
          required
        />
      </label>
      <label class="block w-[300px]">
        <span class="block">Display name</span>
        <input
          v-model="displayName"
          class="block w-full border border-stone-500 rounded-md p-2"
          required
        />
      </label>
      <label class="block w-[300px]">
        <span class="block">Pronouns</span>
        <input
          v-model="pronouns"
          class="block w-full border border-stone-500 rounded-md p-2"
        />
      </label>
      <label class="block w-[300px]">
        <span class="block">Location</span>
        <input
          v-model="location"
          class="block w-full border border-stone-500 rounded-md p-2"
        />
      </label>
      <label class="block w-[300px]">
        <span class="block">Privacy Setting</span>
        <select
          v-model="privacy"
          class="block w-full border border-stone-500 rounded-md p-2 text-black"
        >
          <option :value="PrivacySetting.PUBLIC">Public</option>
          <option :value="PrivacySetting.PRIVATE">Private</option>
          <option :value="PrivacySetting.FRIENDS_ONLY">
            Visible to friends only
          </option>
        </select>
      </label>
      <Button
        type="submit"
        :disabled="inFlight"
        color="primary"
        wide
      >
        <template v-if="inFlight">
          <Spinner />
          Saving...
        </template>
        <template v-else>Save Settings</template>
      </Button>
      <span v-if="errorMessage" class="text-red-600">{{ errorMessage }}</span>
    </form>
    <nuxt-link to="/logout" class="underline pb-4">Not you? Log out</nuxt-link>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const render = ref(false);
const router = useRouter();
const inFlight = ref(false);
const errorMessage = ref<string>();

const user = useSupabaseUser();
const settings = await useFetch("/api/settings");

if (settings.data.value?.finished_welcome) {
  router.push("/");
} else {
  render.value = true;
}

const avatar = ref(settings.data.value?.avatar || "");
const username = ref(settings.data.value?.username);
const displayName = ref(settings.data.value?.display_name);
const pronouns = ref(settings.data.value?.pronouns);
const location = ref(settings.data.value?.location);
const privacy = ref(settings.data.value?.privacy);

watchEffect(() => (username.value = username.value?.replaceAll(" ", "")));

function selectAvatar() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpg, image/jpeg, image/png";
  input.onchange = uploadAvatar;
  input.click();
}

async function uploadAvatar(event: Event) {
  const newlyUploadedAvatar = (event.target as HTMLInputElement).files?.[0];

  if (!newlyUploadedAvatar) {
    return;
  }

  const formData = new FormData();
  formData.append("file", newlyUploadedAvatar);

  const url = (
    await $fetch(`/api/storage/avatars`, {
      method: "POST",
      body: formData,
    })
  )[0];

  avatar.value = url;
}

async function saveSettings() {
  inFlight.value = true;
  try {
    await $fetch("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        username: username.value,
        display_name: displayName.value,
        pronouns: pronouns.value,
        location: location.value,
        finished_welcome: true,
        avatar: avatar.value,
        privacy: privacy.value,
      }),
    });
    router.push("/");
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
