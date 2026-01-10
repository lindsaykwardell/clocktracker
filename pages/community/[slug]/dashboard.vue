<template>
  <CommunityTemplate moderatorOnly v-slot="{ community }">
    <div class="px-4 lg:px-8 pb-4 lg:pb-8 space-y-8 md:space-y-12 xl:space-y-16">
      <form
        @submit.prevent="updateCommunity"
        class="flex flex-col gap-4 items-center w-full xl:w-3/4 m-auto"
      >
        <div class="form-items flex flex-col md:flex-row gap-4 items-center md:items-start w-full lg:pr-40">
          <div class="flex-none w-32 md:w-40 flex flex-col gap-2 items-center">
            <Avatar :value="community.data.icon" size="lg" />
            <button
              @click="selectCommunityAvatar"
              type="button"
              class="form-action is-neutral"
            >
              Change Logo
            </button>
          </div>
          <div class="flex-grow flex flex-col gap-3">
            <div class="flex flex-col md:flex-row md:gap-2">
              <label class="block flex-grow">
                <span class="block">Name</span>
                <Input v-model="updatedName" required />
              </label>
              <label class="block">
                <span class="block">Slug</span>
                <Input v-model="updatedSlug" required />
              </label>
            </div>
            <div class="flex flex-col md:flex-row md:gap-2">
              <label class="block">
                <span class="block">Privacy</span>
                <Input mode="select" v-model="updatedPrivacy">
                  <option :value="false">Public</option>
                  <option :value="true">Private</option>
                </Input>
              </label>
              <label class="block flex-grow">
                <span class="block">Location</span>
                <LocationSearchInput
                  v-model:value="_location"
                  inputClass="block w-full border border-stone-500 rounded-md p-2"
                />
              </label>
              <label class="block flex-grow">
                <span class="block">Time Zone</span>
                <TimeZoneSelector v-model:value="updatedTimeZone" />
              </label>
            </div>
            <label>
              <span class="block">Links</span>
              <div class="flex flex-col gap-1">
                <div
                  v-for="(_, index) in updatedLinks"
                  :key="index"
                  class="flex gap-1"
                >
                  <Input v-model="updatedLinks[index]" type="text" />
                  <button
                    type="button"
                    @click="updatedLinks.splice(index, 1)"
                    class="form-action is-destructive"
                  >
                    Remove
                  </button>
                </div>
                <button @click="updatedLinks.push('')" type="button">
                  Add link
                </button>
              </div>
            </label>
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
          </div>
        </div>
        <div class="form-actions">
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

      <section v-if="community.data.join_requests?.length">
        <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
          Join Requests
        </h2>
        <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-center">User</th>
                <th class="text-left">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-300 dark:divide-stone-700/40">
              <tr v-for="member in community.data.join_requests">
                <td>
                  <div class="flex gap-2 items-center">
                    <div class="flex-none">
                      <Avatar
                        :value="member.avatar"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </div>
                    <div class="flex flex-col lg:flex-row lg:gap-1">
                      <span class="font-semibold">{{ member.display_name }}</span>
                      <span class="text-sm md:text-base">(@{{ member.username }})</span>
                    </div>
                  </div>
                </td>
                <td class="w-[250px]">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="approveUser(member.user_id)"
                      class="table-action is-positive"
                    >
                      Approve
                    </button>
                    <button
                      @click="denyUser(member.user_id)"
                      class="table-action is-destructive"
                    >
                      Ignore
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
          Community Members
        </h2>
        <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left">User</th>
                <th class="text-center">Role</th>
                <th class="text-Center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-300 dark:divide-stone-700/40">
              <tr v-for="member in community.data.members">
                <td>
                  <div class="flex gap-2 items-center ">
                    <div class="flex-none">
                      <Avatar
                        :value="member.avatar"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </div>
                    <div class="flex flex-col lg:flex-row lg:gap-1">
                      <span class="font-semibold">{{ member.display_name }}</span>
                      <span class="text-sm md:text-base">(@{{ member.username }})</span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span
                    class="inline-flex items-center rounded-sm text-sm md:text-base font-medium px-2 md:px-3 md:py-1"
                    :class="{
                      'bg-stone-200 text-gray-800 dark:bg-black/40 dark:text-white': !community.data.admins
                        .map(({ user_id }) => user_id)
                        .includes(member.user_id),
                      'bg-stone-500 text-white dark:bg-purple-400/40 dark:text-white': community.data.admins
                        .map(({ user_id }) => user_id)
                        .includes(member.user_id),
                    }"
                  >          
                    {{
                      community.data.admins
                        .map(({ user_id }) => user_id)
                        .includes(member.user_id)
                        ? "Admin"
                        : "Member"
                    }}
                  </span>
                </td>
                <td class="">
                  <div class="flex gap-2">
                    <button
                      v-if="!isMe(member.user_id)"
                      @click="toggleAdmin(member.user_id)"
                      :class="[
                        'table-action',
                        community.data.admins
                          .map(({ user_id }) => user_id)
                          .includes(member.user_id)
                          ? 'is-undo'
                          : 'is-positive',
                      ]"
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
                      class="table-action border border-transparent"
                    />
                    <button
                      @click="removeUser(member.user_id)"
                      class="table-action is-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <section v-if="community.data.banned_users?.length">
        <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
          Banned Users
        </h2>
        <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left">User</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-300 dark:divide-stone-700/40">
              <tr v-for="member in community.data.banned_users">
                <td>
                  <div class="flex gap-2 items-center">
                    <div class="flex-none">
                      <Avatar
                        :value="member.avatar"
                        size="xs"
                        class="border-stone-800"
                        background
                      />
                    </div>
                    <div class="flex flex-col lg:flex-row lg:gap-1">
                      <span class="font-semibold">{{ member.display_name }}</span>
                      <span class="text-sm md:text-base">(@{{ member.username }})</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="flex justify-center gap-2">
                    <button
                      @click="unbanUser(member.user_id)"
                      class="table-action is-undo"
                    >
                      Unban
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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

const metadata = await $fetch(`/api/community/${slug}/minimal`);
const community = await $fetch(`/api/community/${slug}`);

const updatedName = ref(community.name);
const updatedDescription = ref(community.description);
const updatedSlug = ref(community.slug);
const updatedPrivacy = ref(community.is_private);
const updatedDiscordServerId = ref<string | null>(community.discord_server_id);
const updatedTimeZone = ref<string | null>(community.time_zone);
const updatedLinks = ref(community.links);
const updatedLocation = ref(community.location);
const updatedCityId = ref(community.city_id);

const _location = computed({
  get: () => updatedLocation.value,
  set: (newValue: { id: number; name: string }) => {
    updatedLocation.value = newValue.name;
    if (newValue.id !== 0) {
      updatedCityId.value = newValue.id.toString();
    } else {
      updatedCityId.value = null;
    }
  },
});

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

async function updateCommunity() {
  inFlight.value = true;
  await communities.updateCommunity(slug, {
    name: updatedName.value,
    description: updatedDescription.value,
    slug: updatedSlug.value,
    is_private: updatedPrivacy.value,
    discord_server_id: updatedDiscordServerId.value,
    time_zone: updatedTimeZone.value,
    links:
      updatedLinks.value.length === 1 && updatedLinks.value[0] === ""
        ? []
        : updatedLinks.value,
    location: updatedLocation.value,
    city_id: updatedCityId.value,
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

watchEffect(() => {
  if (updatedLinks.value.length < 1) {
    updatedLinks.value.push("");
  }
});

useHead({
  title: () => `Dashboard - ${metadata.name}`,
});
</script>

<style scoped>
  th,
  td {
    @apply p-2;
  }

  .form-action {
    @apply rounded transition duration-150 text-sm md:text-base px-2 md:px-3 py-1 md:py-2;
  }

  .table-action {
    @apply flex-1 whitespace-nowrap rounded transition duration-150 text-sm md:text-base px-2 md:px-3 py-1 md:py-2;
  }

  .table-action.is-positive {
    @apply text-white bg-green-600 hover:bg-green-700;
  }

  .table-action.is-undo {
    @apply text-black bg-yellow-500 hover:bg-yellow-600;
  }

  .form-action.is-destructive,
  .table-action.is-destructive {
    @apply text-white bg-red-700 hover:bg-red-800;
  }

  .form-action.is-neutral {
    @apply text-black dark:text-white bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-700;
  }

  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: oklch(0.869 0.005 56.366) transparent; /* Stone 300 */
    scrollbar-gutter: stable;
  }

  .custom-scrollbar:where(.dark, .dark *) {
    scrollbar-color: oklch(0.444 0.011 73.639) transparent; /* Stone 600 */
  }
</style>
