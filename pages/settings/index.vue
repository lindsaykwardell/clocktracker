<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-dumbledor text-4xl text-center">Profile</h2>
      <form
        class="flex flex-col gap-4 items-center w-full"
        @submit.prevent="saveSettings"
      >
        <label class="block w-full xl:w-3/4">
          <span class="block">Username</span>
          <input
            v-model="username"
            class="block w-full border border-stone-500 rounded-md p-2"
            pattern="^[a-zA-Z0-9_-]*$"
            title="Username can only contain letters, numbers, underscores, and dashes."
            required
          />
        </label>
        <label class="block w-full xl:w-3/4">
          <span class="block">Display name</span>
          <input
            v-model="displayName"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="block w-full xl:w-3/4">
          <span class="block">Pronouns</span>
          <input
            v-model="pronouns"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
        </label>
        <label class="block w-full xl:w-3/4">
          <span class="block">Location</span>
          <input
            v-model="location"
            class="block w-full border border-stone-500 rounded-md p-2"
          />
        </label>
        <label class="block w-full xl:w-3/4">
          <span class="block">Bio</span>
          <textarea
            v-model="bio"
            class="block w-full border border-stone-500 rounded-md p-2 text-black"
            rows="5"
          ></textarea>
        </label>
        <label class="block w-full xl:w-3/4">
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

const settings = await useFetch("/api/settings");

const username = ref(settings.data.value?.username);
const displayName = ref(settings.data.value?.display_name);
const pronouns = ref(settings.data.value?.pronouns);
const location = ref(settings.data.value?.location);
const bio = ref(settings.data.value?.bio);
const privacy = ref(settings.data.value?.privacy);

watchEffect(() => (username.value = username.value?.replaceAll(" ", "")));

async function saveSettings() {
  inFlight.value = true;
  savedSuccessfully.value = false;
  errorMessage.value = "";

  const { error } = await useFetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      username: username.value,
      display_name: displayName.value,
      pronouns: pronouns.value,
      location: location.value,
      finished_welcome: true,
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
