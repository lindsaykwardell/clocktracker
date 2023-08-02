<template>
  <div class="flex flex-col items-center gap-2 m-auto py-4">
    <nuxt-link to="/">
      <img src="/logo.png" class="w-48" alt="ClockTracker" />
    </nuxt-link>
    <h1>Sign in</h1>
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
      <button
        type="submit"
        class="text-center text-lg w-[300px] bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
      >
        Login
      </button>
      <button
        type="button"
        @click="register"
        class="text-center text-lg w-[300px] hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
      >
        Register
      </button>
      <span class="text-red-500">{{ errorMessage }}</span>
      <template v-if="errorMessage">
        <span class="text-red-500">Email: {{ email }}</span>
      </template>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});

const supabase = useSupabaseClient();
const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref();

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    console.error(error);
    errorMessage.value = error.message;
  } else {
    router.push("/welcome");
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
    router.push("/welcome");
  }
}
</script>
