<template>
  <Button
    class="w-[300px] py-2 text-white"
    discord
    @click="login"
  >
    <Discord />
    <span>Login with Discord</span>
  </Button>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();

async function login() {
  await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      queryParams: { prompt: "none" },
      redirectTo: `${window.location.host}/welcome`,
    },
  });
}
</script>
