<template>
  <StandardTemplate>
    <div class="flex gap-4 xl:max-w-[1200px] m-auto mt-4">
      <nav
        class="flex flex-col md:w-[300px] w-[100px] min-w-[100px] md:min-w-[300px] items-center"
      >
        <Avatar :value="avatar" class="mt-10 md:mt-0" />
        <button
          @click.prevent.stop="selectAvatar"
          class="text-sm hover:underline text-stone-400"
        >
          Upload new avatar
        </button>
        <h1 class="font-sorts text-lg hidden md:block py-2">
          {{ displayName }}
        </h1>
        <ul class="w-full py-4">
          <li class="w-full bg-stone-300 dark:bg-stone-700">
            <nuxt-link
              to="/settings"
              class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
              active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
            >
              Profile
            </nuxt-link>
            <nuxt-link
              to="/settings/password"
              class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
              active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
            >
              Password
            </nuxt-link>
            <nuxt-link
              to="/settings/integrations"
              class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
              active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
            >
              Integrations
            </nuxt-link>
            <nuxt-link
              to="/settings/account"
              class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
              active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
            >
              Account & Data
            </nuxt-link>
            <nuxt-link
              to="/settings/perks"
              class="flex gap-2 w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
              active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
            >
              <KoFi class="w-6 h-6" />
              <span>Perks</span>
            </nuxt-link>
          </li>
        </ul>
      </nav>
      <section class="flex-grow">
        <slot />
      </section>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const users = useUsers();

const avatar = computed(() => {
  const u = users.getUserById(user.value?.id);

  if (u.status !== Status.SUCCESS) return null;

  return u.data.avatar;
});

const displayName = computed(() => {
  const u = users.getUserById(user.value?.id);

  if (u.status !== Status.SUCCESS) return null;

  return u.data.display_name;
});

function selectAvatar() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpg, image/jpeg, image/png";
  input.onchange = uploadAvatar;
  input.click();
}

async function uploadAvatar(event: Event) {
  const newlyUploadedAvatar = (event.target as HTMLInputElement).files?.[0];

  if (!newlyUploadedAvatar) {
    return;
  }

  const formData = new FormData();
  formData.append("file", newlyUploadedAvatar);

  const url = (
    await $fetch(`/api/storage/avatars`, {
      method: "POST",
      body: formData,
    })
  )[0];

  await $fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      avatar: url,
    }),
  });

  users.fetchMe(user.value?.id);
}
</script>
