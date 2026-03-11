<template>
  <AdminTemplate title="User Groups" :has-access="canManageGroups">
        <div class="mb-4">
          <Button color="primary" size="sm" @click="showNewGroup = true">
            New Group
          </Button>
        </div>

        <!-- New Group Form -->
        <div
          v-if="showNewGroup"
          class="mb-4 p-4 rounded border border-stone-300 dark:border-stone-700/50
                 bg-stone-300/40 dark:bg-stone-900/50 flex flex-col gap-3"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Name</label>
            <Input v-model="newGroup.name" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Permissions</label>
            <div
              v-for="group in permissionGroups"
              :key="group.label"
              class="flex flex-col gap-1.5"
            >
              <span class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{{ group.label }}</span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="perm in group.permissions"
                  :key="perm"
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-full border transition-colors"
                  :class="newGroup.permissions.includes(perm)
                    ? 'bg-primary border-primary text-white'
                    : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500'"
                  @click="togglePermission(newGroup.permissions, perm)"
                >
                  {{ PERMISSION_LABELS[perm] }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Display Name Color</label>
            <div class="flex items-center gap-2">
              <input
                type="color"
                v-model="newGroup.color"
                class="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 cursor-pointer"
              />
              <Input v-model="newGroup.color" class="max-w-[8rem]" placeholder="#000000" />
              <Button v-if="newGroup.color" size="xs" color="secondary" @click="newGroup.color = ''">Clear</Button>
            </div>
            <p class="text-xs text-stone-500">Optional. Sets the display name color for members of this group in forum posts.</p>
          </div>
          <div class="flex gap-2">
            <Button color="primary" size="sm" @click="createGroup">Create</Button>
            <Button color="secondary" size="sm" @click="showNewGroup = false">Cancel</Button>
          </div>
          <p v-if="groupError" class="text-sm text-red-500">{{ groupError }}</p>
        </div>

        <!-- Group List -->
        <div class="flex flex-col gap-4">
          <div
            v-for="group in groups"
            :key="group.id"
            class="p-4 rounded border border-stone-300 dark:border-stone-700/50
                   bg-stone-300/40 dark:bg-stone-900/50"
          >
            <!-- Edit mode -->
            <template v-if="editingUserGroupId === group.id">
              <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-semibold">Name</label>
                  <Input v-model="editUserGroup.name" />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-semibold">Permissions</label>
                  <div
                    v-for="pg in permissionGroups"
                    :key="pg.label"
                    class="flex flex-col gap-1.5"
                  >
                    <span class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">{{ pg.label }}</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        v-for="perm in pg.permissions"
                        :key="perm"
                        type="button"
                        class="px-2.5 py-1 text-xs rounded-full border transition-colors"
                        :class="editUserGroup.permissions.includes(perm)
                          ? 'bg-primary border-primary text-white'
                          : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500'"
                        @click="togglePermission(editUserGroup.permissions, perm)"
                      >
                        {{ PERMISSION_LABELS[perm] }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-semibold">Display Name Color</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      v-model="editUserGroup.color"
                      class="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 cursor-pointer"
                    />
                    <Input v-model="editUserGroup.color" class="max-w-[8rem]" placeholder="#000000" />
                    <Button v-if="editUserGroup.color" size="xs" color="secondary" @click="editUserGroup.color = ''">Clear</Button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" color="primary" @click="saveEditUserGroup">Save</Button>
                  <Button size="sm" color="secondary" @click="editingUserGroupId = null">Cancel</Button>
                </div>
                <p v-if="editUserGroupError" class="text-sm text-red-500">{{ editUserGroupError }}</p>
              </div>
            </template>

            <!-- Display mode -->
            <template v-else>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="font-semibold">{{ group.name }}</span>
                  <span
                    v-if="group.color"
                    class="w-4 h-4 rounded-full border border-stone-400"
                    :style="{ backgroundColor: group.color }"
                    :title="`Color: ${group.color}`"
                  />
                </div>
                <div class="flex items-center gap-5">
                  <button type="button" class="text-stone-400 hover:text-stone-200 transition-colors" title="Edit group" @click="startEditUserGroup(group)">
                    <IconUI id="edit" size="sm" />
                  </button>
                  <button type="button" class="text-red-400 hover:text-red-300 transition-colors" title="Delete group" @click="deleteGroup(group.id)">
                    <IconUI id="trash" size="sm" />
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-1 mb-3">
                <span
                  v-for="perm in group.permissions"
                  :key="perm"
                  class="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                >
                  {{ PERMISSION_LABELS[perm] || perm }}
                </span>
              </div>

              <!-- Members -->
              <div class="mb-3">
                <h4 class="text-xs text-stone-500 mb-1">Members ({{ group._count.members }})</h4>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="membership in group.members"
                    :key="membership.user.user_id"
                    class="flex items-center gap-1.5 text-sm px-2 py-1 rounded bg-stone-200/50 dark:bg-stone-800/50"
                  >
                    <Avatar :value="membership.user.avatar" size="xxs" class="border-stone-800" />
                    <span>{{ membership.user.display_name }}</span>
                    <span class="text-xs text-stone-500">@{{ membership.user.username }}</span>
                    <button
                      type="button"
                      class="text-red-400 hover:text-red-300 transition-colors ml-1 flex items-center"
                      title="Remove member"
                      @click="removeMember(group.id, membership.user.user_id, membership.user.display_name)"
                    >
                      <IconUI id="x" size="xs" />
                    </button>
                  </div>
                  <p v-if="!group.members?.length" class="text-xs text-stone-400">No members</p>
                </div>
              </div>

              <!-- Add Member -->
              <div class="flex gap-2 items-end">
                <div class="flex flex-col gap-1 flex-1">
                  <label class="text-xs text-stone-500">Add user by username</label>
                  <Input v-model="addMemberUsername[group.id]" placeholder="username" />
                </div>
                <Button size="sm" color="primary" @click="addMember(group.id)">Add</Button>
              </div>
              <p v-if="memberError[group.id]" class="text-sm text-red-500 mt-1">{{ memberError[group.id] }}</p>
            </template>
          </div>
          <p v-if="groups.length === 0" class="text-center py-3 text-stone-400">
            No user groups yet.
          </p>
        </div>
  </AdminTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();
const forumMe = ref<{ permissions: string[]; is_admin: boolean } | null>(null);

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

const canManageGroups = computed(() => {
  if (isAdminUser.value) return true;
  if (!forumMe.value) return false;
  return forumMe.value.permissions.includes("MANAGE_GROUPS");
});

const PERMISSION_LABELS: Record<string, string> = {
  CREATE_THREAD: "Create Threads",
  CREATE_POST: "Create Posts",
  EDIT_OWN_POST: "Edit Own Posts",
  DELETE_OWN_POST: "Delete Own Posts",
  EDIT_ANY_POST: "Edit Any Post",
  DELETE_ANY_POST: "Delete Any Post",
  LOCK_THREAD: "Lock Threads",
  PIN_THREAD: "Pin Threads",
  BAN_USER: "Ban Users",
  MANAGE_CATEGORIES: "Manage Categories",
  MANAGE_GROUPS: "Manage Groups",
  MANAGE_FEATURE_FLAGS: "Manage Feature Flags",
  VIEW_REPORTS: "View Reports",
  VIEW_MOD_LOG: "View Mod Log",
  GITHUB: "GitHub Integration",
};

const permissionGroups = [
  {
    label: "Basic",
    permissions: ["CREATE_THREAD", "CREATE_POST", "EDIT_OWN_POST", "DELETE_OWN_POST"],
  },
  {
    label: "Moderation",
    permissions: ["EDIT_ANY_POST", "DELETE_ANY_POST", "LOCK_THREAD", "PIN_THREAD", "BAN_USER"],
  },
  {
    label: "Administration",
    permissions: ["MANAGE_CATEGORIES", "MANAGE_GROUPS", "MANAGE_FEATURE_FLAGS", "VIEW_REPORTS", "VIEW_MOD_LOG", "GITHUB"],
  },
];

function togglePermission(list: string[], perm: string) {
  const idx = list.indexOf(perm);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(perm);
  }
}

const groups = ref<any[]>([]);
const showNewGroup = ref(false);
const groupError = ref("");
const addMemberUsername = reactive<Record<string, string>>({});
const memberError = reactive<Record<string, string>>({});
const newGroup = reactive({
  name: "",
  permissions: [] as string[],
  color: "",
});

async function fetchGroups() {
  groups.value = await $fetch("/api/forum/groups");
}

async function createGroup() {
  groupError.value = "";
  try {
    await $fetch("/api/forum/groups", {
      method: "POST",
      body: {
        name: newGroup.name,
        permissions: newGroup.permissions,
        color: newGroup.color || null,
      },
    });
    showNewGroup.value = false;
    newGroup.name = "";
    newGroup.permissions = [];
    newGroup.color = "";
    await fetchGroups();
  } catch (err: any) {
    groupError.value = err?.data?.statusMessage || "Failed to create group";
  }
}

async function deleteGroup(groupId: string) {
  try {
    await $fetch(`/api/forum/groups/${groupId}`, { method: "DELETE" });
    await fetchGroups();
  } catch (err: any) {
    console.error(err);
  }
}

async function addMember(groupId: string) {
  memberError[groupId] = "";
  const username = addMemberUsername[groupId]?.trim();
  if (!username) return;
  try {
    const userResult = await $fetch<{ user_id: string }>(`/api/user/${username}`);
    await $fetch(`/api/forum/groups/${groupId}/members`, {
      method: "POST",
      body: { user_id: userResult.user_id },
    });
    addMemberUsername[groupId] = "";
    await fetchGroups();
  } catch (err: any) {
    memberError[groupId] = err?.data?.statusMessage || "Failed to add member";
  }
}

async function removeMember(groupId: string, userId: string, displayName: string) {
  if (!confirm(`Remove ${displayName} from this group?`)) return;
  try {
    await $fetch(`/api/forum/groups/${groupId}/members/${userId}`, { method: "DELETE" });
    await fetchGroups();
  } catch (err: any) {
    console.error(err);
  }
}

// User Group Editing
const editingUserGroupId = ref<string | null>(null);
const editUserGroup = reactive({
  name: "",
  permissions: [] as string[],
  color: "",
});
const editUserGroupError = ref("");

function startEditUserGroup(group: any) {
  editingUserGroupId.value = group.id;
  editUserGroup.name = group.name;
  editUserGroup.permissions = [...group.permissions];
  editUserGroup.color = group.color || "";
  editUserGroupError.value = "";
}

async function saveEditUserGroup() {
  if (!editingUserGroupId.value) return;
  editUserGroupError.value = "";
  try {
    await $fetch(`/api/forum/groups/${editingUserGroupId.value}`, {
      method: "PUT",
      body: {
        name: editUserGroup.name.trim(),
        permissions: editUserGroup.permissions,
        color: editUserGroup.color || null,
      },
    });
    editingUserGroupId.value = null;
    await fetchGroups();
  } catch (err: any) {
    editUserGroupError.value = err?.data?.statusMessage || "Failed to update group";
  }
}

onMounted(async () => {
  try {
    forumMe.value = await $fetch("/api/forum/me");
  } catch {}
  if (canManageGroups.value) await fetchGroups();
});

watch(canManageGroups, async (val) => {
  if (val) await fetchGroups();
});

useHead({ title: "User Groups - Admin" });
</script>
