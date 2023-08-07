<template>
  <button
    class="text-center text-lg w-[300px] bg-[#5865F2] hover:bg-[#4752C4] transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
    @click="login"
  >
    <Discord />
    <span>Login with Discord</span>
  </button>
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
