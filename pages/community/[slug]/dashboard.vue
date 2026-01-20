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
            <Button
              @click="selectCommunityAvatar"
              type="button"
              variant="filled"
              size="sm"
              color="neutral"
            >
              Change Logo
            </Button>
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
                  <Button
                    type="button"
                    @click="updatedLinks.splice(index, 1)"
                    icon="x-lg"
                    display="icon-only"
                    color="negative"
                  >
                    Remove
                  </Button>
                </div>
                <div class="flex justify-center">
                  <Button 
                    @click="updatedLinks.push('')" 
                    type="button"
                    variant="filled"
                    color="neutral"
                    size="sm"
                  >
                    Add link
                  </Button>
                </div>
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
                  variant="filled"
                  color="discord"
                  icon="discord"
                >
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
            variant="filled"
            color="primary"
            size="lg"
            wide
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

      <section class="grid gap-4 grid-cols-2 grid-flow-row-dense">
        <div class="col-start-2 row-start-1" v-if="community.data.join_requests?.length">
          <h2 class="font-sorts text-center xl:text-left text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Join Requests
          </h2>
          <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
            <table>
              <thead>
                <tr>
                  <th class="text-left">User</th>
                  <th class="text-left">Status</th>
                  <th class="text-left"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
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
                      <div class="flex flex-col">
                        <span class="font-semibold">{{ member.display_name }}</span>
                        <span class="text-xs md:text-sm text-muted">(@{{ member.username }})</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge color="caution" size="sm">
                      Pending
                    </Badge>
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <Button
                        @click="approveUser(member.user_id)"
                        size="sm"
                        color="positive"
                      >
                        Approve
                      </Button>
                      <Button
                        @click="denyUser(member.user_id)"
                        size="sm"
                        color="negative"
                      >
                        Ignore
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-start-1 span-hack">
          <h2 class="font-sorts text-center xl:text-left text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Community Members
          </h2>
          <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
            <table>
              <thead>
                <tr>
                  <th class="text-left">User</th>
                  <th class="text-left">Role</th>
                  <th class="text-left"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="member in community.data.members">
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
                      <div class="flex flex-col">
                        <span class="font-semibold">{{ member.display_name }}</span>
                        <span class="text-xs md:text-sm text-muted">@{{ member.username }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge
                      :color="community.data.admins.map(({ user_id }) => user_id).includes(member.user_id) ? 'primary' : 'neutral'"
                      size="sm"
                    >
                      {{
                        community.data.admins
                          .map(({ user_id }) => user_id)
                          .includes(member.user_id)
                          ? "Admin"
                          : "Member"
                      }}
                    </Badge>
                  </td>
                  <td>
                    <div class="flex justify-end relative">
                      <Menu>
                        <MenuButton>
                          <IconUI id="dots" :rounded="true" shadow />
                        </MenuButton>
                        <transition
                          enter-active-class="transition duration-100 ease-out"
                          enter-from-class="transform scale-95 opacity-0"
                          enter-to-class="transform scale-100 opacity-100"
                          leave-active-class="transition duration-75 ease-out"
                          leave-from-class="transform scale-100 opacity-100"
                          leave-to-class="transform scale-95 opacity-0"
                        >
                          <MenuItems
                            class="ct-contextual-links right-0 top-full"
                          >
                            <MenuItem>
                              <ButtonSubmenu
                                v-if="!isMe(member.user_id)"
                                @click="toggleAdmin(member.user_id)"
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
                              </ButtonSubmenu>
                            </MenuItem>
                            <MenuItem>
                              <ButtonSubmenu
                                @click="removeUser(member.user_id)"
                              >
                                Remove
                              </ButtonSubmenu>
                            </MenuItem>
                          </MenuItems>
                        </transition>
                      </Menu>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="col-start-2 row-start-2" v-if="community.data.banned_users?.length">
          <h2 class="font-sorts text-center xl:text-left text-xl lg:text-2xl mb-2 lg:mb-4 col-span-8">
            Banned Users
          </h2>
          <div class="overflow-x-scroll custom-scrollbar -mx-4 md:mx-0 w-screen md:w-full">
            <table>
              <thead>
                <tr>
                  <th class="text-left">User</th>
                  <th class="text-left">Status</th>
                  <th class="text-left"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
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
                      <div class="flex flex-col">
                        <span class="font-semibold">{{ member.display_name }}</span>
                        <span class="text-xs md:text-sm text-muted">@{{ member.username }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge color="negative" size="sm">
                      Banned
                    </Badge>
                  </td>
                  <td>
                    <div class="flex justify-end gap-2">
                      <Button
                        @click="unbanUser(member.user_id)"
                        size="sm"
                        color="caution"
                      >
                        Unban
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </CommunityTemplate>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

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
  table {
    @apply w-full rounded-lg border border-stone-300 dark:border-stone-700/40;
  }

  thead {
    @apply text-sm border-b border-stone-300 dark:border-stone-700/40;
  }

  tbody {
    @apply divide-y divide-stone-300 dark:divide-stone-700/40;
  }

  th {
    @apply font-normal text-muted;
  }

  th,
  td {
    @apply p-2;
  }

  .span-hack {
    grid-row: span 3;
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
