<template>
  <StandardTemplate>
    <div class="max-w-[1000px] w-5/6 py-4 m-auto">
      <div class="pt-8">
        <form @submit.prevent.stop role="search">
          <label>
            <h1 class="font-dumbledor text-2xl text-center">Search</h1>
            <div class="relative">
              <Input
                v-model="query"
                type="search"
                spellcheck="false"
                placeholder="Type in a query to begin"
              />
              <div
                class="absolute right-2 -top-2 w-16 h-16"
                aria-label="Search"
              >
                <img src="/img/role/investigator.png" />
              </div>
            </div>
          </label>
        </form>
      </div>
      <div class="py-4 flex flex-col gap-4">
        <div v-if="searching" class="flex justify-center gap-1">
          <Spinner />
          Searching...
        </div>
        <template v-else>
          <div class="flex flex-wrap md:flex-nowrap">
            <div class="w-1/2 md:w-auto p-1">
              <Button
                font-size="md"
                @click="showUsers = !showUsers"
                class="w-full md:w-auto"
                :tertiary="!showUsers"
                :disabled="users.length === 0"
              >
                <h2>
                  {{ users.length }} User{{ users.length === 1 ? "" : "s" }}
                </h2>
              </Button>
            </div>
            <div class="w-1/2 md:w-auto p-1">
              <Button
                font-size="md"
                @click="showCommunities = !showCommunities"
                class="w-full md:w-auto"
                :tertiary="!showCommunities"
                :disabled="communities.length === 0"
              >
                <h2>
                  {{ communities.length }} Communit{{
                    communities.length === 1 ? "y" : "ies"
                  }}
                </h2>
              </Button>
            </div>
            <div class="w-1/2 md:w-auto p-1">
              <Button
                font-size="md"
                @click="showScripts = !showScripts"
                class="w-full md:w-auto"
                :tertiary="!showScripts"
                :disabled="scripts.length === 0"
              >
                <h2>
                  {{ scripts.length }} Script{{
                    scripts.length === 1 ? "" : "s"
                  }}
                </h2>
              </Button>
            </div>
            <div class="w-1/2 md:w-auto p-1">
              <Button
                font-size="md"
                @click="showRoles = !showRoles"
                class="w-full md:w-auto"
                :tertiary="!showRoles"
                :disabled="roles.length === 0"
              >
                <h2>
                  {{ roles.length }} Role{{ roles.length === 1 ? "" : "s" }}
                </h2>
              </Button>
            </div>
          </div>
          <template v-if="showUsers">
            <UserCard v-for="user in users" :username="user.username" />
          </template>
          <template v-if="showCommunities">
            <CommunityCard
              v-for="community in communities"
              :community="community"
            />
          </template>
          <template v-if="showRoles">
            <RoleCard v-for="role in roles" :role="role" />
          </template>
          <template v-if="showScripts">
            <ScriptCard v-for="script in scripts" :script="script" />
          </template>
        </template>
      </div>
    </div>
  </StandardTemplate>
</template>

<script setup lang="ts">
import type { Role } from "@prisma/client";
import { watchDebounced } from "@vueuse/core";

const route = useRoute();
const router = useRouter();

const users = ref<
  {
    user_id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    pronouns: string | null;
    bio: string;
    location: string | null;
  }[]
>([]);
const communities = ref<
  {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon: string | null;
    _count: {
      members: number;
      admins: number;
      posts: number;
    };
  }[]
>([]);
const scripts = ref<
  {
    id: number;
    name: string;
    version: string;
    author: string;
    type: string;
    json_url: string;
    pdf_url: string;
    logo: string;
    characters_last_updated: string | null;
    _count: {
      games: number;
    };
  }[]
>([]);
const roles = ref<(Role & { _count: { scripts: number; games: number } })[]>(
  []
);

// Default the query to the query parameter in the URL
const query = ref<string>(route.query.query as string | "");
const searching = ref(false);

const activeTab = ref<"USERS" | "COMMUNITIES" | "SCRIPTS" | "ROLES">("USERS");

const showUsers = computed({
  get() {
    return activeTab.value === "USERS";
  },
  set() {
    activeTab.value = "USERS";
  },
});
const showCommunities = computed({
  get() {
    return activeTab.value === "COMMUNITIES";
  },
  set() {
    activeTab.value = "COMMUNITIES";
  },
});
const showScripts = computed({
  get() {
    return activeTab.value === "SCRIPTS";
  },
  set() {
    activeTab.value = "SCRIPTS";
  },
});
const showRoles = computed({
  get() {
    return activeTab.value === "ROLES";
  },
  set() {
    activeTab.value = "ROLES";
  },
});

async function search() {
  // Only search if the query is at least 3 characters long
  if (query.value.length < 3) {
    return;
  }
  searching.value = true;
  users.value = [];
  communities.value = [];
  scripts.value = [];
  roles.value = [];
  const result = await $fetch("/api/search", {
    params: {
      query: query.value,
    },
  });

  users.value = result.users;
  scripts.value = result.scripts as any;
  communities.value = result.communities;
  if ("roles" in result) {
    roles.value = result.roles as any;
  } else {
    roles.value = [];
  }

  // check if the current tab has content
  const hasContent = (() => {
    switch (activeTab.value) {
      case "USERS":
        return users.value.length > 0;
      case "COMMUNITIES":
        return communities.value.length > 0;
      case "SCRIPTS":
        return scripts.value.length > 0;
      case "ROLES":
        return roles.value.length > 0;
    }
  })();

  if (!hasContent) {
    // switch to a tab that has content
    if (users.value.length > 0) {
      activeTab.value = "USERS";
    } else if (communities.value.length > 0) {
      activeTab.value = "COMMUNITIES";
    } else if (scripts.value.length > 0) {
      activeTab.value = "SCRIPTS";
    } else if (roles.value.length > 0) {
      activeTab.value = "ROLES";
    }
  }

  searching.value = false;
}

onMounted(() => {
  if (query.value) {
    search();
  }
});

watchDebounced(
  query,
  () => {
    search();
    // update the router with the query parameter
    router.push({ query: { query: query.value } });
  },
  { debounce: 500 }
);
</script>
