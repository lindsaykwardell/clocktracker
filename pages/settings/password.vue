<template>
  <SettingsTemplate>
    <section
      class="w-full flex flex-col items-center justify-center gap-12 py-4"
    >
      <h2 class="font-sorts text-4xl text-center">Password</h2>
      <form
        class="flex flex-col gap-4 items-center w-full"
        @submit.prevent="updatePassword"
      >
        <label class="block w-full xl:w-3/4">
          <span class="block">New Password</span>
          <input
            v-model="newPassword"
            type="password"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="block w-full xl:w-3/4">
          <span class="block">Verify New Password</span>
          <input
            v-model="verifyNewPassword"
            type="password"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
            :pattern="verifyPasswordRegex"
            title="Passwords must match"
          />
        </label>
        <Button
          type="submit"
          primary
          class="px-4 py-2"
          :disabled="passwordInFlight"
        >
          <template v-if="passwordInFlight">
            <Spinner />
            Saving...
          </template>
          <template v-else>Update Password</template>
        </Button>
        <span class="text-red-600"> {{ passwordErrorMessage }}</span>
        <span v-if="passwordSavedSuccessfully" class="text-green-600">
          Password updated successfully!
        </span>
      </form>
    </section>
  </SettingsTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const passwordInFlight = ref(false);
const passwordErrorMessage = ref<string>();
const passwordSavedSuccessfully = ref(false);

const supabase = useSupabaseClient();

const newPassword = ref("");
const verifyNewPassword = ref("");

watch(
  newPassword,
  () => {
    passwordErrorMessage.value = "";
    passwordSavedSuccessfully.value = false;
  },
  { immediate: true }
);

watch(
  verifyNewPassword,
  () => {
    passwordErrorMessage.value = "";
    passwordSavedSuccessfully.value = false;
  },
  { immediate: true }
);

const verifyPasswordRegex = computed(() =>
  newPassword.value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
);

async function updatePassword() {
  passwordInFlight.value = true;

  const result = await supabase.auth.updateUser({
    password: newPassword.value,
  });

  if (result.error) {
    console.error(result.error);
    passwordErrorMessage.value = result.error.message;
    passwordInFlight.value = false;
    return;
  } else {
    passwordInFlight.value = false;
    passwordSavedSuccessfully.value = true;
  }
}
</script>

<style scoped>
input {
  color: black;
}
</style>
