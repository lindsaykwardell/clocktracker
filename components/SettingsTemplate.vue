<template>
  <StandardTemplate>
    <div class="flex gap-4 xl:max-w-[1200px] m-auto mt-4">
      <nav
        class="flex flex-col md:w-[300px] w-[100px] min-w-[100px] md:min-w-[300px] items-center"
      >
        <Avatar :value="avatar" class="mt-10 md:mt-0 mb-2" />
        <Button
          @click.prevent.stop="selectAvatar"
          size="sm"
        >
          Upload new avatar
        </Button>
        <h1 class="font-sorts text-lg hidden md:block my-4">
          {{ displayName }}
        </h1>
        <ul class="w-full divide-y divide-stone-300 dark:divide-stone-800 bg-stone-200 dark:bg-stone-700 rounded overflow-hidden">
          <li class="w-full">
            <nuxt-link
              to="/settings"
              class="block w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150"
              active-class="border-primary dark:border-dark-primary"
            >
              Profile
            </nuxt-link>
          </li>
          <li>  
            <nuxt-link
              to="/settings/password"
              class="block w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150"
              active-class="border-primary dark:border-dark-primary"
            >
              Password
            </nuxt-link>
          </li>
          <li>  
            <nuxt-link
              to="/settings/integrations"
              class="block w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150"
              active-class="border-primary dark:border-dark-primary"
            >
              Integrations
            </nuxt-link>
          </li>
          <li>  
            <nuxt-link
              to="/settings/account"
              class="block w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150"
              active-class="border-primary dark:border-dark-primary"
            >
              Account & Data
            </nuxt-link>
          </li>
          <li>
            <nuxt-link
              to="/settings/perks"
              class="flex gap-2 items-center w-full p-2 border-l-[6px] hover:border-primary hover:text-primary-content hover:bg-primary dark:hover:bg-dark-primary duration-150"
              active-class="border-primary dark:border-dark-primary"
            >
              <IconUI id="kofi" size="lg" />
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

<style scoped>
  li > a:not(.router-link-exact-active,:hover) {
    border-color: theme(colors.stone.300);

    &:where(.dark, .dark *) {
      border-color: theme(colors.stone.900);
    }
  }
</style>