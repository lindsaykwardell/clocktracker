<template>
  <div class="flex flex-col items-center gap-2 m-auto py-4 px-4">
    <nuxt-link to="/">
      <img
        src="/logo.png"
        class="w-48 bg-stone-900 rounded-full"
        alt="ClockTracker"
      />
    </nuxt-link>
    <h1>Reset password</h1>

    <template v-if="status === 'loading'">
      <p class="text-stone-500 dark:text-stone-400">Verifying reset link...</p>
      <Spinner />
    </template>

    <template v-else-if="status === 'error'">
      <Alert color="negative" class="max-w-md">
        {{ errorMessage }}
      </Alert>
      <nuxt-link to="/login" class="text-primary hover:underline text-sm mt-2">
        Back to login
      </nuxt-link>
    </template>

    <template v-else-if="status === 'success'">
      <Alert color="positive" class="max-w-md">
        Password updated successfully. You can now sign in with your new
        password.
      </Alert>
      <Button color="primary" class="mt-2" @click="router.push('/login')">
        Go to login
      </Button>
    </template>

    <form
      v-else
      class="flex flex-col min-w-[16rem] max-w-md w-full items-stretch gap-2"
      @submit.prevent="updatePassword"
    >
      <label>
        <span class="block">New password</span>
        <input
          v-model="newPassword"
          class="block w-full border bg-stone-200 dark:bg-stone-600 border-stone-100 dark:border-stone-500 rounded-md p-2"
          required
          type="password"
          minlength="6"
          placeholder="New password"
          autocomplete="new-password"
        />
      </label>
      <label>
        <span class="block">Confirm password</span>
        <input
          v-model="confirmPassword"
          class="block w-full border bg-stone-200 dark:bg-stone-600 border-stone-100 dark:border-stone-500 rounded-md p-2"
          required
          type="password"
          minlength="6"
          placeholder="Confirm password"
          autocomplete="new-password"
          :pattern="confirmPasswordRegex"
          title="Passwords must match"
        />
      </label>
      <Alert v-if="formError" color="negative">{{ formError }}</Alert>
      <Button type="submit" color="primary" wide :disabled="saving">
        <template v-if="saving">
          <Spinner />
          Saving...
        </template>
        <template v-else>Update password</template>
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * Public landing page for Supabase password-recovery email links.
 *
 * Must NOT use the auth middleware: recovery redirects arrive with ?code=
 * before a session exists. An auth-gated page would redirect away and drop
 * the code, so exchangeCodeForSession never runs.
 */
const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();

type Status = "loading" | "ready" | "error" | "success";

const status = ref<Status>("loading");
const errorMessage = ref(
  "This reset link is invalid or has expired. Please request a new one from the login page."
);
const formError = ref<string>();
const saving = ref(false);
const newPassword = ref("");
const confirmPassword = ref("");

const confirmPasswordRegex = computed(() =>
  newPassword.value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
);

async function establishRecoverySession() {
  // getSession() waits for client init, which may already have exchanged
  // ?code= via detectSessionInUrl.
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) {
    return;
  }

  const code = typeof route.query.code === "string" ? route.query.code : null;
  const tokenHash =
    typeof route.query.token_hash === "string" ? route.query.token_hash : null;
  const type =
    typeof route.query.type === "string" ? route.query.type : "recovery";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return;
  }

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "recovery",
    });
    if (error) {
      throw error;
    }
    return;
  }

  // Implicit-flow recovery links put tokens in the URL hash.
  if (window.location.hash.includes("access_token")) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        throw error;
      }
      return;
    }
  }

  throw new Error(
    "This reset link is invalid or has expired. Please request a new one from the login page."
  );
}

async function updatePassword() {
  formError.value = undefined;

  if (newPassword.value !== confirmPassword.value) {
    formError.value = "Passwords must match";
    return;
  }

  saving.value = true;
  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  });
  saving.value = false;

  if (error) {
    formError.value = error.message;
    return;
  }

  status.value = "success";
}

onMounted(async () => {
  try {
    await establishRecoverySession();
    // Drop auth params from the URL once the session is established.
    if (Object.keys(route.query).length > 0 || window.location.hash) {
      await router.replace({ path: "/reset-password", query: {} });
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
      }
    }
    status.value = "ready";
  } catch (error: unknown) {
    console.error(error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "This reset link is invalid or has expired. Please request a new one from the login page.";
    status.value = "error";
  }
});
</script>

<style scoped>
input {
  color: black;
}
</style>
