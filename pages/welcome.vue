<template>
  <main
    v-if="render"
    class="w-full h-screen flex flex-col items-center gap-6 py-4"
  >
    <img class="w-[300px]" src="/logo.png" alt="ClockTracker" />
    <h1 class="text-stone-200 text-2xl font-dumbledor">
      Welcome, {{ user?.user_metadata.full_name }}
    </h1>
    <form
      class="flex flex-col gap-4 items-center"
      @submit.prevent="saveSettings"
    >
      <Avatar :value="avatar" />
      <button @click.prevent.stop="selectAvatar">Upload new avatar</button>
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
      <button
        type="submit"
        class="w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
        :disabled="inFlight"
      >
        <template v-if="inFlight">
          <Spinner />
          Saving...
        </template>
        <template v-else>Save Settings</template>
      </button>
      <span class="text-red-600">{{ errorMessage }}</span>
    </form>
  </main>
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";

definePageMeta({
  middleware: "auth",
});

const render = ref(false);
const router = useRouter();
const inFlight = ref(false);
const errorMessage = ref<string>();

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const settings = await useFetch("/api/settings");
const config = useRuntimeConfig();

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

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(`${uuid()}`, newlyUploadedAvatar);

  if (error) {
    inFlight.value = false;
    throw error;
  }

  avatar.value = `${config.public.supabase.url}/storage/v1/object/public/avatars/${data.path}`;
}

async function saveSettings() {
  inFlight.value = true;
  const { error } = await useFetch("/api/settings", {
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

  if (error.value) {
    console.error(error);
    errorMessage.value = error.value.statusMessage;
    inFlight.value = false;
    return;
  }

  router.push("/");
}
</script>

<style scoped>
input {
  color: black;
}
</style>
