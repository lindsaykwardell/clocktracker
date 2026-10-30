<template>
  <div class="flex flex-col items-center gap-2 m-auto py-4">
    <nuxt-link to="/">
      <img src="/logo.png" class="w-48 bg-stone-900 rounded-full" alt="ClockTracker" />
    </nuxt-link>
    <h1>Sign in</h1>
    <p v-if="staging" class="text-sm">Staging is restricted to administrators. Use your existing account.</p>
    <!-- @todo Fix input fields-->
     <template v-if="errorMessage">
        <Alert color="negative">
          {{ errorMessage }}
        </Alert>
      </template>
      <template v-if="resetPasswordSent">
        <Alert color="positive">
          An email has been sent to reset your password
        </Alert>
      </template>
    <form @submit.prevent="login" class="flex flex-col min-w-[16rem] items-stretch gap-2">
      <label>
        <span class="block">Email</span>
        <input
          class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-400 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2"
          required
          type="email"
          v-model="email"
          placeholder="Email"
        />
      </label>
      <label>
        <span class="block">Password</span>
        <input
          class="block w-full border bg-stone-200 dark:bg-stone-600 disabled:bg-stone-400 dark:disabled:bg-stone-700 border-stone-100 dark:border-stone-500 rounded-md p-2"
          required
          type="password"
          v-model="password"
          placeholder="Password"
        />
      </label>
      <Button type="submit" color="primary" :disabled="emailRequestPending" wide>
        Login
      </Button>
      <Button v-if="!staging" type="button" @click="register" :disabled="emailRequestPending" wide>
        Register
      </Button>
      <Button v-if="!staging" type="button" @click.prevent="sendResetPassword" :disabled="emailRequestPending" variant="link" size="sm">
        Forgot Password?
      </Button>
    </form>
    <p class="p-2">OR</p>
    <LoginWithDiscord />
    <Button v-if="staging && signedInUser" variant="link" @click="signOutStaging">Sign out of staging</Button>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});

const staging = useRuntimeConfig().public.staging;
const signedInUser = useUser();
async function signOutStaging() {
  await supabase.auth.signOut({ scope: "local" });
  window.location.assign("/login");
}
const supabase = useSupabaseClient();
const router = useRouter();
const friends = useFriends();

const email = ref("");
const password = ref("");
const errorMessage = ref();
const resetPasswordSent = ref(false);
const emailRequestPending = ref(false);

async function requestEmail(send: (address: string) => Promise<void>) {
  if (staging) return;
  if (emailRequestPending.value) return;
  const address = email.value.trim();
  errorMessage.value = "";
  resetPasswordSent.value = false;
  emailRequestPending.value = true;
  try {
    // This reserves an attempt; Supabase still sends the email directly from the browser.
    await $fetch("/api/auth/email-allowance", { method: "POST", body: { email: address }, retry: 0 });
    await send(address);
  } catch (error: any) {
    const seconds = Number(error?.data?.data?.retryAfter);
    errorMessage.value = seconds > 0
      ? `Please wait ${Math.ceil(seconds / 60)} minute(s) before requesting another email.`
      : error?.data?.message || error?.message || "Unable to request an email. Please try again later.";
  } finally {
    emailRequestPending.value = false;
  }
}

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
  if (!password.value) {
    errorMessage.value = "Enter a password.";
    return;
  }
  const enteredPassword = password.value;
  await requestEmail(async (address) => {
    const { error } = await supabase.auth.signUp({ email: address, password: enteredPassword });
    if (error) throw error;
    friends.fetchFriends();
    friends.fetchRequests();
    router.push("/welcome");
  });
}

async function sendResetPassword() {
  await requestEmail(async (address) => {
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      // Keep the recovery callback public so the session can be established.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    resetPasswordSent.value = true;
  });
}
</script>
