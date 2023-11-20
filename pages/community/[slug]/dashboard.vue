<template>
  <CommunityTemplate v-slot="{ community, isModerator }">
    <div v-if="isModerator" class="flex flex-col gap-3 p-2">
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
          <label>
            <span class="block">Name</span>
            <input
              v-model="updatedName"
              class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2"
              required
            />
          </label>
          <label>
            <span class="block">Description</span>
            <textarea
              v-model="updatedDescription"
              class="block w-full border border-stone-500 text-white bg-stone-600 rounded-md p-2"
              rows="5"
            ></textarea>
          </label>
          <label>
            <span class="block">Slug</span>
            <input
              v-model="updatedSlug"
              class="block w-full border border-stone-500 bg-stone-600 rounded-md p-2"
              required
            />
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
            <template v-else>Save Game</template>
          </button>
        </div>
      </form>
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
const showIconDialog = ref(false);

const slug = route.params.slug as string;

const updatedName = ref("");
const updatedDescription = ref("");
const updatedSlug = ref("");
const loaded = ref(false);
const inFlight = ref(false);

const community = computed(() => {
  return communities.getCommunity(slug);
});

watchEffect(() => {
  if (community.value.status === Status.SUCCESS && !loaded.value) {
    updatedName.value = community.value.data.name;
    updatedDescription.value = community.value.data.description;
    updatedSlug.value = community.value.data.slug;
    loaded.value = true;
  }
});

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
</script>
