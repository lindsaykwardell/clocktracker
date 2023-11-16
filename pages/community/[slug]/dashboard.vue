<template>
  <CommunityTemplate v-slot="{ community, isMember, isModerator }">
    <div class="overflow-scroll w-screen md:w-full">
      <table v-if="isModerator" class="w-full">
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
              <div class="whitespace-nowrap overflow-hidden overflow-ellipsis">
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
  </CommunityTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "community-admin",
});

const communities = useCommunities();
const route = useRoute();
const user = useSupabaseUser();

const slug = route.params.slug as string;

function isMe(id: string) {
  return user.value?.id === id;
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
