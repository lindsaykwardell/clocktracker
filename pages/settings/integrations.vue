<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Integrations</h2>
      <div class="space-y-4 w-full xl:w-3/4">
        <h3 class="text-2xl">Discord</h3>
        <p class="text-stone-500 dark:text-stone-400">
          Connect your Discord account to log in with Discord.
        </p>
        <div class="flex gap-4">
          <div v-if="!discordIdentity">
            <Button @click.prevent="connectDiscord" color="discord" icon="discord">
              Connect Discord
            </Button>
          </div>
          <div v-else class="pt-4">
            <p class="pb-2">
              Connected as <strong>{{ discordIdentity.identity_data?.full_name || discordIdentity.identity_data?.name || 'Discord User' }}</strong>
            </p>
            <Button @click.prevent="disconnectDiscord" color="negative" size="sm">
              Disconnect
            </Button>
          </div>
        </div>
      </div>
      <div class="space-y-4 w-full xl:w-3/4">
        <h3 class="text-2xl">BoardGameGeek</h3>
        <p class="text-stone-500 dark:text-stone-400">
          Connect your BoardGameGeek account to sync your plays to your profile.
        </p>
        <div class="flex gap-4">
          <div v-if="!bgg_username" class="flex flex-col gap-2 w-full md:w-[16rem]">
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
            <Button @click.prevent="disconnectBoardGameGeek" color="negative" size="sm">
              Disconnect
            </Button>
          </div>
        </div>
      </div>
      <div class="space-y-4 w-full xl:w-3/4">
        <h3 class="text-2xl">BGStats</h3>
        <p class="text-stone-500 dark:text-stone-400">Enable logging games to BGStats.</p>
        <label class="flex gap-4">
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

const supabase = useSupabaseClient();
const settings = await useFetch("/api/settings");
const users = useUsers();
const user = useSupabaseUser();
const bgg_username = ref(settings.data?.value?.bgg_username);
const enable_bgstats = ref(settings.data?.value?.enable_bgstats || false);

const username = ref("");
const password = ref("");
const inFlight = ref(false);

// Discord integration
const discordIdentity = computed(() => {
  return user.value?.identities?.find((identity) => identity.provider === "discord");
});

async function connectDiscord() {
  await supabase.auth.linkIdentity({
    provider: "discord",
    options: {
      redirectTo: `${window.location.origin}/settings/integrations`,
    },
  });
}

async function disconnectDiscord() {
  if (!discordIdentity.value) return;

  const { error } = await supabase.auth.unlinkIdentity(discordIdentity.value);

  if (error) {
    console.error("Failed to disconnect Discord:", error);
    alert("Failed to disconnect Discord. You must have at least one login method.");
  } else {
    // Refresh user data to update the UI
    await supabase.auth.refreshSession();
  }
}

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
