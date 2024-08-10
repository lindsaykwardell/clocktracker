<template>
  <CommunityTemplate moderatorOnly v-slot="{ community }">
    <div class="flex flex-col gap-3 p-2">
      <form
        @submit.prevent="updateCommunity"
        class="flex flex-col md:flex-row gap-4 items-center p-2"
      >
        <div class="flex flex-col items-center">
          <Avatar :value="community.data.icon" size="lg" />
          <Button
            @click="selectCommunityAvatar"
            type="button"
            class="whitespace-nowrap w-[150px] mt-2"
            outline
          >
            Change Icon
          </Button>
        </div>
        <div class="flex-grow w-full flex flex-col gap-3">
          <div class="flex flex-col md:flex-row md:gap-2">
            <label class="block flex-grow">
              <span class="block">Name</span>
              <Input v-model="updatedName" required />
            </label>
            <label class="block">
              <span class="block">Slug</span>
              <Input v-model="updatedSlug" required />
            </label>
            <label class="block">
              <span class="block">Privacy</span>
              <Input mode="select" v-model="updatedPrivacy">
                <option :value="false">Public</option>
                <option :value="true">Private</option>
              </Input>
            </label>
            <label class="block">
              <span class="block">Time Zone</span>
              <Input mode="select" v-model="updatedTimeZone">
                <option v-for="tz in Intl.supportedValuesOf('timeZone')">
                  {{ tz }}
                </option>
              </Input>
            </label>
          </div>
          <label>
            <span class="block">Discord Server ID</span>
            <div class="flex gap-2">
              <Input v-model="updatedDiscordServerId" />
              <Button
                component="a"
                href="https://discord.com/oauth2/authorize?client_id=1125833336695304323&permissions=549755833344&scope=bot"
                target="_blank"
                class="w-[200px] text-white"
                discord
              >
                <Discord />
                Add Bot
              </Button>
            </div>
          </label>
          <label>
            <span class="block">Description</span>
            <Input
              mode="textarea"
              v-model="updatedDescription"
              rows="5"
            ></Input>
          </label>
          <Button
            type="submit"
            id="save-game"
            class="py-2 px-4 w-[300px] m-auto"
            primary
            :disabled="inFlight"
          >
            <template v-if="inFlight">
              <Spinner />
              Saving...
            </template>
            <template v-else>Save Community</template>
          </Button>
        </div>
      </form>
      <template v-if="community.data.join_requests?.length">
        <h2 class="text-2xl">Join Requests</h2>
        <div class="overflow-scroll w-screen md:w-full">
          <table class="w-full">
            <thead>
              <tr>
                <th />
                <th class="text-left">Name</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in community.data.join_requests">
                <td class="w-[50px] min-w-[50px]">
                  <Avatar
                    :value="member.avatar"
                    size="xs"
                    class="border-stone-800"
                  />
                </td>
                <td class="">
                  <div
                    class="whitespace-nowrap overflow-hidden overflow-ellipsis"
                  >
                    {{ member.display_name }} (@{{ member.username }})
                  </div>
                </td>
                <td class="w-[250px]">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="approveUser(member.user_id)"
                      class="whitespace-nowrap rounded transition duration-150 border border-green-800 hover:bg-green-900 text-white px-4 py-2 mt-2 w-[125px]"
                    >
                      Approve
                    </button>
                    <button
                      @click="denyUser(member.user_id)"
                      class="whitespace-nowrap rounded transition duration-150 border border-red-800 hover:bg-red-900 text-white px-4 py-2 mt-2 w-[125px]"
                    >
                      Ignore
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <h2 class="text-2xl">Members</h2>
      <div class="overflow-scroll w-screen md:w-full">
        <table class="w-full">
          <thead>
            <tr>
              <th />
              <th class="text-left">Name</th>
              <th class="text-left">Role</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in community.data.members">
              <td class="w-[50px] min-w-[50px]">
                <Avatar
                  :value="member.avatar"
                  size="xs"
                  class="border-stone-800"
                />
              </td>
              <td class="">
                <div
                  class="whitespace-nowrap overflow-hidden overflow-ellipsis"
                >
                  {{ member.display_name }} (@{{ member.username }})
                </div>
              </td>
              <td>
                {{
                  community.data.admins
                    .map(({ user_id }) => user_id)
                    .includes(member.user_id)
                    ? "Admin"
                    : "Member"
                }}
              </td>
              <td class="w-[250px]">
                <div class="flex gap-2">
                  <button
                    v-if="!isMe(member.user_id)"
                    @click="toggleAdmin(member.user_id)"
                    class="flex-1 whitespace-nowrap rounded transition duration-150 border border-green-800 hover:bg-green-900 hover:text-white dark:text-white px-4 py-2 mt-2"
                  >
                    <template
                      v-if="
                        community.data.admins
                          .map(({ user_id }) => user_id)
                          .includes(member.user_id)
                      "
                    >
                      Demote
                    </template>
                    <template v-else> Promote </template>
                  </button>
                  <div
                    v-else
                    class="flex-1 whitespace-nowrap rounded transition duration-150 border border-transparent px-4 py-2 mt-2"
                  />
                  <button
                    @click="removeUser(member.user_id)"
                    class="flex-1 whitespace-nowrap rounded transition duration-150 border border-red-800 hover:bg-red-900 hover:text-white dark:text-white px-4 py-2 mt-2"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template v-if="community.data.banned_users?.length">
        <h2 class="text-2xl">Banned Users</h2>
        <div class="overflow-scroll w-screen md:w-full">
          <table class="w-full">
            <thead>
              <tr>
                <th />
                <th class="text-left">Name</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in community.data.banned_users">
                <td class="w-[50px] min-w-[50px]">
                  <Avatar
                    :value="member.avatar"
                    size="xs"
                    class="border-stone-800"
                  />
                </td>
                <td class="">
                  <div
                    class="whitespace-nowrap overflow-hidden overflow-ellipsis"
                  >
                    {{ member.display_name }} (@{{ member.username }})
                  </div>
                </td>
                <td class="w-[250px]">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="unbanUser(member.user_id)"
                      class="whitespace-nowrap rounded transition duration-150 border border-red-800 hover:bg-red-900 text-white px-4 py-2 mt-2 w-[125px]"
                    >
                      Unban
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { v4 as uuid } from "uuid";

definePageMeta({
  middleware: "community-admin",
});

const supabase = useSupabaseClient();
const config = useRuntimeConfig();
const communities = useCommunities();
const route = useRoute();
const user = useSupabaseUser();
const featureFlags = useFeatureFlags();

const slug = route.params.slug as string;

const community = await $fetch(`/api/community/${slug}`);

const updatedName = ref(community.name);
const updatedDescription = ref(community.description);
const updatedSlug = ref(community.slug);
const updatedPrivacy = ref(community.is_private);
const updatedDiscordServerId = ref<string | null>(community.discord_server_id);
const updatedTimeZone = ref<string | null>(community.time_zone);
const inFlight = ref(false);

function isMe(id: string) {
  return user.value?.id === id;
}

function selectCommunityAvatar() {
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

  communities.updateIcon(slug, url);
}

function updateCommunity() {
  inFlight.value = true;
  communities.updateCommunity(slug, {
    name: updatedName.value,
    description: updatedDescription.value,
    slug: updatedSlug.value,
    is_private: updatedPrivacy.value,
    discord_server_id: updatedDiscordServerId.value,
    time_zone: updatedTimeZone.value,
  });
  inFlight.value = false;
}

function toggleAdmin(user_id: string) {
  communities.toggleAdmin(slug, user_id);
}

function removeUser(user_id: string) {
  if (confirm("Are you sure you want to remove this user?")) {
    communities.removeUser(slug, user_id);
  }
}

function unbanUser(user_id: string) {
  if (confirm("Are you sure you want to unban this user?")) {
    communities.unbanUser(slug, user_id);
  }
}

function approveUser(user_id: string) {
  communities.approveUser(slug, user_id);
}

function denyUser(user_id: string) {
  communities.denyUser(slug, user_id);
}
</script>
