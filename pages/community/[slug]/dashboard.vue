<template>
  <CommunityTemplate moderatorOnly v-slot="{ community }">
    <div class="flex flex-col gap-3 p-2">
      <form
        @submit.prevent="updateCommunity"
        class="flex flex-col md:flex-row gap-4 items-center p-2"
      >
        <div class="flex flex-col items-center">
          <Avatar
            :value="community.data.icon"
            size="lg"
            class="community-icon"
          />
          <button
            @click="toggleChangeIcon"
            type="button"
            class="whitespace-nowrap flex gap-1 items-center justify-center py-1 w-[150px] rounded transition duration-150 hover:bg-blue-900 border border-blue-600 text-white"
          >
            Change Icon
          </button>
        </div>
        <div class="flex-grow w-full flex flex-col gap-3">
          <div class="flex flex-col md:flex-row md:gap-2">
            <label class="block flex-grow">
              <span class="block">Name</span>
              <input
                v-model="updatedName"
                class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2"
                required
              />
            </label>
            <label class="block">
              <span class="block">Slug</span>
              <input
                v-model="updatedSlug"
                class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2"
                required
              />
            </label>
            <label class="block">
              <span class="block">Privacy</span>
              <select
                v-model="updatedPrivacy"
                class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2 h-[42px]"
              >
                <option :value="false">Public</option>
                <option :value="true">Private</option>
              </select>
            </label>
          </div>
          <label v-if="featureFlags.isEnabled('discord-server-integration')">
            <span class="block">Discord Server ID</span>
            <div class="flex gap-2">
              <input
                v-model="updatedDiscordServerId"
                class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2"
              />
              <a
                href="https://discord.com/oauth2/authorize?client_id=1125833336695304323&permissions=549755833344&scope=bot"
                target="_blank"
                class="text-center md:text-lg w-[200px] bg-[#5865F2] hover:bg-[#4752C4] transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-2 items-center"
              >
                <Discord />
                Add Bot
              </a>
            </div>
          </label>
          <label>
            <span class="block">Description</span>
            <textarea
              v-model="updatedDescription"
              class="block w-full border border-stone-500 text-white bg-stone-600 rounded-md p-2"
              rows="5"
            ></textarea>
          </label>
          <button
            type="submit"
            id="save-game"
            class="w-full bg-blue-700 hover:bg-blue-800 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
            :disabled="inFlight"
          >
            <template v-if="inFlight">
              <Spinner />
              Saving...
            </template>
            <template v-else>Save Community</template>
          </button>
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
                    class="flex-1 whitespace-nowrap rounded transition duration-150 border border-green-800 hover:bg-green-900 text-white px-4 py-2 mt-2"
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
                    class="flex-1 whitespace-nowrap rounded transition duration-150 border border-red-800 hover:bg-red-900 text-white px-4 py-2 mt-2"
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
    <TokenDialog
      v-model:visible="showIconDialog"
      :availableRoles="[]"
      :alwaysShowAllRoles="true"
      @selectRole="updateIcon"
    />
  </CommunityTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "community-admin",
});

const communities = useCommunities();
const route = useRoute();
const user = useSupabaseUser();
const featureFlags = useFeatureFlags();
const showIconDialog = ref(false);

const slug = route.params.slug as string;

const community = await $fetch(`/api/community/${slug}`);

const updatedName = ref(community.name);
const updatedDescription = ref(community.description);
const updatedSlug = ref(community.slug);
const updatedPrivacy = ref(community.is_private);
const updatedDiscordServerId = ref<string | null>(community.discord_server_id);
const inFlight = ref(false);

function isMe(id: string) {
  return user.value?.id === id;
}

function toggleChangeIcon() {
  showIconDialog.value = true;
}

function updateIcon({ token_url }: { token_url: string }) {
  communities.updateIcon(slug, token_url);
  showIconDialog.value = false;
}

function updateCommunity() {
  inFlight.value = true;
  communities.updateCommunity(slug, {
    name: updatedName.value,
    description: updatedDescription.value,
    slug: updatedSlug.value,
    is_private: updatedPrivacy.value,
    discord_server_id: updatedDiscordServerId.value,
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
