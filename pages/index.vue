<template>
  <main
    v-if="!user"
    class="w-full h-screen flex flex-col items-center justify-center gap-12"
  >
    <img src="/logo.png" class="w-11/12 sm:w-[400px]" alt="ClockTracker" />
    <button
      class="text-center text-lg w-[300px] bg-[#5865F2] hover:bg-[#4752C4] transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
      @click="login"
    >
      <Discord />
      <span>Login with Discord</span>
    </button>
  </main>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

definePageMeta({
  middleware: "guest",
});

async function login() {
  await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      queryParams: { prompt: "none" },
      redirectTo: `${window.location.host}/welcome`,
    },
  });
}

watchEffect(() => {
  if (user.value) {
    router.push("/welcome");
  }
});
</script>
