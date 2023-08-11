<template>
  <AuthenticatedTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-dumbledor text-4xl text-center">Settings</h2>
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
            class="block w-full border border-stone-500 rounded-md p-2 bg-stone-200"
            readonly
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
          <span class="block">Bio</span>
          <textarea
            v-model="bio"
            class="block w-full border border-stone-500 rounded-md p-2 text-black"
            rows="5"
          ></textarea>
        </label>
        <label class="block w-[300px]">
          <span class="block">Privacy Setting</span>
          <select
            v-model="privacy"
            class="block w-full border border-stone-500 rounded-md p-2 text-black"
          >
            <option :value="PrivacySetting.PUBLIC">Public</option>
            <option :value="PrivacySetting.PRIVATE">Private</option>
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
    </section>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";

definePageMeta({
  middleware: "auth",
});

const router = useRouter();
const inFlight = ref(false);
const errorMessage = ref<string>();

const supabase = useSupabaseClient();
const settings = await useFetch("/api/settings");
const config = useRuntimeConfig();

const avatar = ref(settings.data.value?.avatar || "");
const username = ref(settings.data.value?.username);
const displayName = ref(settings.data.value?.display_name);
const pronouns = ref(settings.data.value?.pronouns);
const location = ref(settings.data.value?.location);
const bio = ref(settings.data.value?.bio);
const privacy = ref(settings.data.value?.privacy);

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

  const prevAvatar = avatar.value;
  avatar.value = "";

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(`${uuid()}`, newlyUploadedAvatar);

  if (error) {
    avatar.value = prevAvatar;
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
      bio: bio.value,
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
