<template>
  <AuthenticatedTemplate>
    <div class="flex gap-4 xl:max-w-[1200px] m-auto mt-4">
      <nav class="flex flex-col md:w-[300px] items-center">
        <Avatar :value="avatar" class="mt-10 md:mt-0" />
        <button
          @click.prevent.stop="selectAvatar"
          class="text-sm hover:underline text-stone-400"
        >
          Upload new avatar
        </button>
        <h1 class="font-dumbledor text-lg hidden md:block py-2">
          {{ displayName }}
        </h1>
        <ul class="w-full py-4">
          <li class="w-full">
            <nuxt-link
              to="/settings"
              class="block w-full p-2 bg-stone-700 hover:bg-stone-900 duration-150"
              active-class="bg-stone-900 hover:bg-stone-950 hover:bg-black"
            >
              Profile
            </nuxt-link>
            <nuxt-link
              to="/settings/password"
              class="block w-full p-2 bg-stone-700 hover:bg-stone-900 duration-150"
              active-class="bg-stone-950 hover:bg-black"
            >
              Password
            </nuxt-link>
            <nuxt-link
              to="/settings/integrations"
              class="block w-full p-2 bg-stone-700 hover:bg-stone-900 duration-150"
              active-class="bg-stone-950 hover:bg-black"
            >
              Integrations
            </nuxt-link>
          </li>
        </ul>
      </nav>
      <section class="flex-grow">
        <slot />
      </section>
    </div>
  </AuthenticatedTemplate>
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const users = useUsers();
const supabase = useSupabaseClient();
import { v4 as uuid } from "uuid";
const config = useRuntimeConfig();

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

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(`${uuid()}`, newlyUploadedAvatar);

  if (error) {
    throw error;
  }

  await $fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      avatar: `${config.public.supabase.url}/storage/v1/object/public/avatars/${data.path}`,
    }),
  });

  users.fetchMe(user.value?.id);
}
</script>
