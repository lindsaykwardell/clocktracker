<template>
  <div class="flex flex-col items-center gap-2 m-auto py-4">
    <nuxt-link to="/">
      <img src="/logo.png" class="w-48 bg-stone-900 rounded-full" alt="ClockTracker" />
    </nuxt-link>
    <h1>Sign in</h1>
    <!-- @todo Fix input fields-->
    <form @submit.prevent="login" class="flex flex-col items-center gap-2">
      <label>
        <span class="block">Email</span>
        <input
          class="text-black p-1 rounded w-48"
          required
          type="email"
          v-model="email"
          placeholder="Email"
        />
      </label>
      <label>
        <span class="block">Password</span>
        <input
          class="text-black p-1 rounded w-48"
          required
          type="password"
          v-model="password"
          placeholder="Password"
        />
      </label>
      <Button type="submit" color="primary" wide>
        Login
      </Button>
      <Button type="button" @click="register" wide>
        Register
      </Button>
      <!-- @todo create link version of Button? -->
      <button
        @click.prevent="sendResetPassword"
        class="hover:underline text-stone-400 text-sm"
      >
        Forgot Password?
      </button>
      <span v-if="resetPasswordSent" class="text-green-500"
        >An email has been sent to reset your password</span
      >
      <span class="text-red-500">{{ errorMessage }}</span>
    </form>
    <hr class="border border-stone-100 w-full max-w-[500px]" />
    <LoginWithDiscord />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});

const supabase = useSupabaseClient();
const router = useRouter();
const friends = useFriends();

const email = ref("");
const password = ref("");
const errorMessage = ref();
const resetPasswordSent = ref(false);

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    console.error(error);
    errorMessage.value = error.message;
  } else {
    friends.fetchFriends();
    friends.fetchRequests();

    router.push("/");
  }
}

async function register() {
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });

  if (error) {
    console.error(error);
    errorMessage.value = error.message;
  } else {
    friends.fetchFriends();
    friends.fetchRequests();

    router.push("/welcome");
  }
}

async function sendResetPassword() {
  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/settings`,
  });

  if (error) {
    console.error(error);
    errorMessage.value = error.message;
  } else {
    resetPasswordSent.value = true;
  }
}
</script>
