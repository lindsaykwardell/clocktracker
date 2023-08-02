<template>
  <div class="flex flex-col items-center gap-2 m-auto py-4">
    <img src="/logo.png" class="w-48" />
    <h1>Sign in</h1>
    <form @submit.prevent="login" class="flex flex-col gap-2">
      <label>
        <span class="block">Email</span>
        <input class="text-black p-1 rounded w-48" required type="email" v-model="email" placeholder="Email" />
      </label>
      <label>
        <span class="block">Password</span>
        <input class="text-black p-1 rounded w-48" required type="password" v-model="password" placeholder="Password" />
      </label>
      <button type="submit">Login</button>
      <button type="button" @click="register">Register</button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});

const supabase = useSupabaseClient();
const router = useRouter();

const email = ref("")
const password = ref("")

async function login() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    console.error(error)
  } else {
    router.push("/welcome")
  }
}

async function register() {
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    console.error(error)
  } else {
    router.push("/welcome")
  }
}
</script>