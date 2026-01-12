<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Integrations</h2>
      <div class="text-left w-full space-y-4">
        <h3 class="text-2xl">BoardGameGeek</h3>
        <p class="text-stone-500">
          Connect your BoardGameGeek account to sync your plays to your profile.
        </p>
        <div class="flex gap-4">
          <div v-if="!bgg_username" class="flex flex-col gap-2">
            <label class="block w-full">
              <span class="block">Username</span>
              <input
                v-model="username"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
            </label>
            <label class="block w-full">
              <span class="block">Password</span>
              <input
                v-model="password"
                type="password"
                class="block w-full border border-stone-500 rounded-md p-2"
                required
              />
            </label>
            <Button @click.prevent="connectBoardGameGeek" color="bgg">
              Connect
            </Button>
          </div>
          <div v-if="bgg_username" class="pt-4">
            <p class="pb-2">
              Connected as <strong>{{ bgg_username }}</strong>
            </p>
            <Button @click.prevent="disconnectBoardGameGeek" color="negative" size="small">
              Disconnect
            </Button>
          </div>
        </div>
      </div>
      <div class="text-left w-full">
        <h3 class="text-2xl">BGStats</h3>
        <p class="text-stone-500">Enable logging games to BGStats.</p>
        <label class="flex gap-4 pt-4">
          <Toggle v-model="enable_bgstats" />
          <span>Enable BGStats</span>
        </label>
      </div>
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const settings = await useFetch("/api/settings");
const users = useUsers();
const user = useSupabaseUser();
const bgg_username = ref(settings.data?.value?.bgg_username);
const enable_bgstats = ref(settings.data?.value?.enable_bgstats || false);

const username = ref("");
const password = ref("");
const inFlight = ref(false);

async function connectBoardGameGeek() {
  inFlight.value = true;
  try {
    const result = await $fetch("/api/settings/bgg", {
      method: "POST",
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    inFlight.value = false;
    bgg_username.value = username.value;
    username.value = "";
    password.value = "";

    users.fetchMe(user.value?.id);
  } catch {
    inFlight.value = false;
  }
}

async function disconnectBoardGameGeek() {
  inFlight.value = true;
  try {
    const result = await $fetch("/api/settings/bgg", {
      method: "DELETE",
    });

    inFlight.value = false;
    bgg_username.value = null;

    users.fetchMe(user.value?.id);
  } catch {
    inFlight.value = false;
  }
}

watch(enable_bgstats, async (value) => {
  await $fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      enable_bgstats: value,
    }),
  });
});
</script>

<style scoped>
input {
  color: black;
}
</style>
