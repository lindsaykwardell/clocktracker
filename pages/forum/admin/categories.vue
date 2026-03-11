<template>
  <ForumAdminTemplate title="Categories" :has-access="isAdminUser">
        <div class="flex gap-2 mb-4">
          <Button color="secondary" size="sm" @click="showNewCategoryGroup = true">
            New Group
          </Button>
          <Button color="primary" size="sm" @click="showNewCategory = true">
            New Category
          </Button>
        </div>

        <!-- New Category Group Form -->
        <div
          v-if="showNewCategoryGroup"
          class="mb-4 p-4 rounded border border-stone-300 dark:border-stone-700/50
                 bg-stone-300/40 dark:bg-stone-900/50 flex flex-col gap-3"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Group Name</label>
            <Input v-model="newCategoryGroup.name" />
          </div>
          <div class="flex gap-2">
            <Button color="primary" size="sm" @click="createCategoryGroup">Create Group</Button>
            <Button color="secondary" size="sm" @click="showNewCategoryGroup = false">Cancel</Button>
          </div>
          <p v-if="categoryGroupError" class="text-sm text-red-500">{{ categoryGroupError }}</p>
        </div>

        <!-- New Category Form -->
        <div
          v-if="showNewCategory"
          class="mb-4 p-4 rounded border border-stone-300 dark:border-stone-700/50
                 bg-stone-300/40 dark:bg-stone-900/50 flex flex-col gap-3"
        >
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Name</label>
            <Input v-model="newCategory.name" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Slug</label>
            <Input v-model="newCategory.slug" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Description</label>
            <Input v-model="newCategory.description" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold">Category Group</label>
            <select
              v-model="newCategory.group_id"
              class="w-full rounded border border-stone-300 dark:border-stone-700
                     bg-white dark:bg-stone-900 px-2 py-1 text-sm"
            >
              <option value="">None (ungrouped)</option>
              <option v-for="cg in categoryGroups" :key="cg.id" :value="cg.id">{{ cg.name }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <Toggle v-model="newCategory.is_private" />
            <span class="text-sm">Private (restricted to specific groups)</span>
          </div>
          <div class="flex items-center gap-2">
            <Toggle v-model="newCategory.mod_posting_only" />
            <span class="text-sm">Moderator posting only</span>
          </div>
          <div class="flex items-center gap-2">
            <Toggle v-model="newCategory.is_announcement" />
            <span class="text-sm">Announcement category</span>
          </div>
          <div class="flex gap-2">
            <Button color="primary" size="sm" @click="createCategory">Create Category</Button>
            <Button color="secondary" size="sm" @click="showNewCategory = false">Cancel</Button>
          </div>
          <p v-if="categoryError" class="text-sm text-red-500">{{ categoryError }}</p>
        </div>

        <!-- Unified Category List -->
        <div class="flex flex-col gap-4">
          <!-- Ungrouped categories -->
          <div>
            <h3 class="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Ungrouped
            </h3>
            <draggable
              v-model="ungroupedCategoriesList"
              item-key="id"
              handle=".drag-handle"
              ghost-class="opacity-50"
              group="categories"
              @end="saveCategoryOrder"
              class="flex flex-col gap-2 min-h-[2.5rem] rounded border border-dashed border-stone-300/50 dark:border-stone-700/30 p-2"
            >
              <template #item="{ element: category }">
                <div class="p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50">
                  <template v-if="editingCategorySlug === category.slug">
                    <div class="flex flex-col gap-3">
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Name</label>
                        <Input v-model="editCategory.name" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Slug</label>
                        <Input v-model="editCategory.slug" />
                      </div>
                      <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold">Description</label>
                        <Input v-model="editCategory.description" />
                      </div>
                      <div class="flex items-center gap-2">
                        <Toggle v-model="editCategory.is_private" />
                        <span class="text-sm">Private</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Toggle v-model="editCategory.mod_posting_only" />
                        <span class="text-sm">Moderator posting only</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Toggle v-model="editCategory.is_announcement" />
                        <span class="text-sm">Announcement category</span>
                      </div>
                      <div class="flex gap-2">
                        <Button size="sm" color="primary" @click="saveEditCategory">Save</Button>
                        <Button size="sm" color="secondary" @click="cancelEditCategory">Cancel</Button>
                      </div>
                      <p v-if="editCategoryError" class="text-sm text-red-500">{{ editCategoryError }}</p>
                    </div>
                  </template>
                  <template v-else>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="drag-handle cursor-grab text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">&#x2807;</span>
                        <span class="font-semibold">{{ category.name }}</span>
                        <span class="text-sm text-stone-500">/forum/{{ category.slug }}</span>
                        <span v-if="category.is_private" class="text-xs text-amber-600 dark:text-amber-400 font-medium">Private</span>
                        <span v-if="category.mod_posting_only" class="text-xs text-blue-500 dark:text-blue-400 font-medium">Mod posting only</span>
                        <span v-if="category.is_announcement" class="text-xs text-green-500 dark:text-green-400 font-medium">Announcement</span>
                      </div>
                      <div class="flex items-center gap-5">
                        <button type="button" class="text-stone-400 hover:text-stone-200 transition-colors" title="Edit" @click="startEditCategory(category)">
                          <IconUI id="edit" size="sm" />
                        </button>
                        <Button v-if="category.is_private" size="xs" color="secondary" @click="toggleAccessPanel(category.slug)">
                          {{ expandedAccess === category.slug ? 'Hide Access' : 'Manage Access' }}
                        </Button>
                        <button type="button" class="text-red-400 hover:text-red-300 transition-colors" title="Delete" @click="deleteCategory(category.slug)">
                          <IconUI id="trash" size="sm" />
                        </button>
                      </div>
                    </div>
                    <p v-if="category.description" class="text-sm text-stone-500 dark:text-stone-400 mt-1">{{ category.description }}</p>
                    <!-- Access panel -->
                    <div v-if="expandedAccess === category.slug" class="mt-3 pt-3 border-t border-stone-300 dark:border-stone-700/50">
                      <h4 class="text-sm font-semibold mb-2">Group Access Rules</h4>
                      <div class="flex flex-col gap-2 mb-3">
                        <div v-for="rule in categoryAccessRules[category.slug] || []" :key="rule.id"
                          class="flex items-center justify-between text-sm p-2 rounded bg-stone-200/50 dark:bg-stone-800/50">
                          <div class="flex items-center gap-3">
                            <span class="font-medium">{{ rule.group.name }}</span>
                            <div class="flex gap-2">
                              <label class="flex items-center gap-1">
                                <input type="checkbox" :checked="rule.can_view" @change="updateAccess(category.slug, rule.group.id, ($event.target as HTMLInputElement).checked, rule.can_post)" />
                                View
                              </label>
                              <label class="flex items-center gap-1">
                                <input type="checkbox" :checked="rule.can_post" @change="updateAccess(category.slug, rule.group.id, rule.can_view, ($event.target as HTMLInputElement).checked)" />
                                Post
                              </label>
                            </div>
                          </div>
                          <Button size="xs" color="negative" @click="removeAccess(category.slug, rule.group.id)">Remove</Button>
                        </div>
                        <p v-if="!categoryAccessRules[category.slug]?.length" class="text-xs text-stone-400">
                          No groups have access. This category is hidden from all non-admin users.
                        </p>
                      </div>
                      <div class="flex gap-2 items-end">
                        <div class="flex flex-col gap-1 flex-1">
                          <label class="text-xs text-stone-500">Add group access</label>
                          <select v-model="addAccessGroupId[category.slug]" class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-sm">
                            <option value="">Select a group...</option>
                            <option v-for="group in availableGroupsForCategory(category.slug)" :key="group.id" :value="group.id">{{ group.name }}</option>
                          </select>
                        </div>
                        <Button size="sm" color="primary" :disabled="!addAccessGroupId[category.slug]" @click="addAccess(category.slug)">Add</Button>
                      </div>
                      <p v-if="accessError[category.slug]" class="text-sm text-red-500 mt-1">{{ accessError[category.slug] }}</p>
                    </div>
                  </template>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Draggable group headers with nested category lists -->
          <draggable
            v-model="categoryGroups"
            item-key="id"
            handle=".group-drag-handle"
            ghost-class="opacity-50"
            @end="saveCategoryGroupOrder"
            class="flex flex-col gap-4"
          >
            <template #item="{ element: cg }">
              <div>
                <template v-if="editingGroupId === cg.id">
                  <div class="flex items-center gap-2 mb-2">
                    <Input v-model="editGroupName" class="max-w-xs" />
                    <Button size="xs" color="primary" @click="saveEditGroup">Save</Button>
                    <Button size="xs" color="secondary" @click="editingGroupId = null">Cancel</Button>
                  </div>
                </template>
                <div v-else class="flex items-center gap-2 mb-2">
                  <span class="group-drag-handle cursor-grab text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">&#x2807;</span>
                  <h3 class="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">{{ cg.name }}</h3>
                  <div class="flex items-center gap-5">
                    <button type="button" class="text-stone-400 hover:text-stone-200 transition-colors" title="Edit group" @click="startEditGroup(cg)">
                      <IconUI id="edit" size="sm" />
                    </button>
                    <button type="button" class="text-red-400 hover:text-red-300 transition-colors" title="Delete group" @click="deleteCategoryGroup(cg.id)">
                      <IconUI id="trash" size="sm" />
                    </button>
                  </div>
                </div>
                <draggable
                  :model-value="groupedCategoriesMap[cg.id] || []"
                  @update:model-value="updateGroupCategories(cg.id, $event)"
                  item-key="id"
                  handle=".drag-handle"
                  ghost-class="opacity-50"
                  group="categories"
                  @end="saveCategoryOrder"
                  class="flex flex-col gap-2 ml-6 min-h-[2.5rem] rounded border border-dashed border-stone-300/50 dark:border-stone-700/30 p-2"
                >
                  <template #item="{ element: category }">
                    <div class="p-4 rounded border border-stone-300 dark:border-stone-700/50 bg-stone-300/40 dark:bg-stone-900/50">
                      <template v-if="editingCategorySlug === category.slug">
                        <div class="flex flex-col gap-3">
                          <div class="flex flex-col gap-1">
                            <label class="text-sm font-semibold">Name</label>
                            <Input v-model="editCategory.name" />
                          </div>
                          <div class="flex flex-col gap-1">
                            <label class="text-sm font-semibold">Slug</label>
                            <Input v-model="editCategory.slug" />
                          </div>
                          <div class="flex flex-col gap-1">
                            <label class="text-sm font-semibold">Description</label>
                            <Input v-model="editCategory.description" />
                          </div>
                          <div class="flex items-center gap-2">
                            <Toggle v-model="editCategory.is_private" />
                            <span class="text-sm">Private</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <Toggle v-model="editCategory.mod_posting_only" />
                            <span class="text-sm">Moderator posting only</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <Toggle v-model="editCategory.is_announcement" />
                            <span class="text-sm">Announcement category</span>
                          </div>
                          <div class="flex gap-2">
                            <Button size="sm" color="primary" @click="saveEditCategory">Save</Button>
                            <Button size="sm" color="secondary" @click="cancelEditCategory">Cancel</Button>
                          </div>
                          <p v-if="editCategoryError" class="text-sm text-red-500">{{ editCategoryError }}</p>
                        </div>
                      </template>
                      <template v-else>
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="drag-handle cursor-grab text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">&#x2807;</span>
                            <span class="font-semibold">{{ category.name }}</span>
                            <span class="text-sm text-stone-500">/forum/{{ category.slug }}</span>
                            <span v-if="category.is_private" class="text-xs text-amber-600 dark:text-amber-400 font-medium">Private</span>
                            <span v-if="category.mod_posting_only" class="text-xs text-blue-500 dark:text-blue-400 font-medium">Mod posting only</span>
                            <span v-if="category.is_announcement" class="text-xs text-green-500 dark:text-green-400 font-medium">Announcement</span>
                          </div>
                          <div class="flex items-center gap-5">
                            <button type="button" class="text-stone-400 hover:text-stone-200 transition-colors" title="Edit" @click="startEditCategory(category)">
                              <IconUI id="edit" size="sm" />
                            </button>
                            <Button v-if="category.is_private" size="xs" color="secondary" @click="toggleAccessPanel(category.slug)">
                              {{ expandedAccess === category.slug ? 'Hide Access' : 'Manage Access' }}
                            </Button>
                            <button type="button" class="text-red-400 hover:text-red-300 transition-colors" title="Delete" @click="deleteCategory(category.slug)">
                              <IconUI id="trash" size="sm" />
                            </button>
                          </div>
                        </div>
                        <p v-if="category.description" class="text-sm text-stone-500 dark:text-stone-400 mt-1">{{ category.description }}</p>
                        <!-- Access panel -->
                        <div v-if="expandedAccess === category.slug" class="mt-3 pt-3 border-t border-stone-300 dark:border-stone-700/50">
                          <h4 class="text-sm font-semibold mb-2">Group Access Rules</h4>
                          <div class="flex flex-col gap-2 mb-3">
                            <div v-for="rule in categoryAccessRules[category.slug] || []" :key="rule.id"
                              class="flex items-center justify-between text-sm p-2 rounded bg-stone-200/50 dark:bg-stone-800/50">
                              <div class="flex items-center gap-3">
                                <span class="font-medium">{{ rule.group.name }}</span>
                                <div class="flex gap-2">
                                  <label class="flex items-center gap-1">
                                    <input type="checkbox" :checked="rule.can_view" @change="updateAccess(category.slug, rule.group.id, ($event.target as HTMLInputElement).checked, rule.can_post)" />
                                    View
                                  </label>
                                  <label class="flex items-center gap-1">
                                    <input type="checkbox" :checked="rule.can_post" @change="updateAccess(category.slug, rule.group.id, rule.can_view, ($event.target as HTMLInputElement).checked)" />
                                    Post
                                  </label>
                                </div>
                              </div>
                              <Button size="xs" color="negative" @click="removeAccess(category.slug, rule.group.id)">Remove</Button>
                            </div>
                            <p v-if="!categoryAccessRules[category.slug]?.length" class="text-xs text-stone-400">
                              No groups have access. This category is hidden from all non-admin users.
                            </p>
                          </div>
                          <div class="flex gap-2 items-end">
                            <div class="flex flex-col gap-1 flex-1">
                              <label class="text-xs text-stone-500">Add group access</label>
                              <select v-model="addAccessGroupId[category.slug]" class="w-full rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-1 text-sm">
                                <option value="">Select a group...</option>
                                <option v-for="group in availableGroupsForCategory(category.slug)" :key="group.id" :value="group.id">{{ group.name }}</option>
                              </select>
                            </div>
                            <Button size="sm" color="primary" :disabled="!addAccessGroupId[category.slug]" @click="addAccess(category.slug)">Add</Button>
                          </div>
                          <p v-if="accessError[category.slug]" class="text-sm text-red-500 mt-1">{{ accessError[category.slug] }}</p>
                        </div>
                      </template>
                    </div>
                  </template>
                </draggable>
              </div>
            </template>
          </draggable>

          <p v-if="categories.length === 0 && categoryGroups.length === 0" class="text-center py-3 text-stone-400">
            No categories yet.
          </p>
        </div>
  </ForumAdminTemplate>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { Status } from "~/composables/useFetchStatus";

definePageMeta({ middleware: "auth" });

const me = useMe();

const isAdminUser = computed(() => {
  const meVal = me.value;
  return meVal.status === Status.SUCCESS && meVal.data.is_admin;
});

// Category Groups
const categoryGroups = ref<any[]>([]);
const showNewCategoryGroup = ref(false);
const categoryGroupError = ref("");
const newCategoryGroup = reactive({ name: "" });

async function fetchCategoryGroups() {
  categoryGroups.value = await $fetch("/api/forum/category-groups");
}

async function createCategoryGroup() {
  categoryGroupError.value = "";
  try {
    await $fetch("/api/forum/category-groups", {
      method: "POST",
      body: { name: newCategoryGroup.name, sort_order: categoryGroups.value.length },
    });
    showNewCategoryGroup.value = false;
    newCategoryGroup.name = "";
    await fetchCategoryGroups();
  } catch (err: any) {
    categoryGroupError.value = err?.data?.statusMessage || "Failed to create category group";
  }
}

async function deleteCategoryGroup(id: string) {
  try {
    await $fetch(`/api/forum/category-groups/${id}`, { method: "DELETE" });
    await Promise.all([fetchCategoryGroups(), fetchCategories()]);
  } catch (err: any) {
    console.error(err);
  }
}

const editingGroupId = ref<string | null>(null);
const editGroupName = ref("");

function startEditGroup(cg: any) {
  editingGroupId.value = cg.id;
  editGroupName.value = cg.name;
}

async function saveEditGroup() {
  if (!editingGroupId.value || !editGroupName.value.trim()) return;
  try {
    await $fetch(`/api/forum/category-groups/${editingGroupId.value}`, {
      method: "PUT",
      body: { name: editGroupName.value.trim() },
    });
    editingGroupId.value = null;
    await fetchCategoryGroups();
  } catch (err: any) {
    console.error(err);
  }
}

async function saveCategoryGroupOrder() {
  try {
    await $fetch("/api/forum/reorder", {
      method: "PUT",
      body: {
        categoryGroups: categoryGroups.value.map((cg, i) => ({ id: cg.id, sort_order: i })),
      },
    });
  } catch (err: any) {
    console.error(err);
  }
}

// Categories
const categories = ref<any[]>([]);
const showNewCategory = ref(false);
const categoryError = ref("");
const newCategory = reactive({
  name: "", slug: "", description: "",
  is_private: false, mod_posting_only: false, is_announcement: false, group_id: "",
});

const ungroupedCategoriesList = computed({
  get: () => categories.value.filter((c: any) => !c.group_id),
  set: (val: any[]) => {
    const grouped = categories.value.filter((c: any) => c.group_id);
    categories.value = [...val.map((c) => ({ ...c, group_id: null })), ...grouped];
  },
});

const groupedCategoriesMap = computed(() => {
  const map: Record<string, any[]> = {};
  for (const cg of categoryGroups.value) {
    map[cg.id] = categories.value.filter((c: any) => c.group_id === cg.id);
  }
  return map;
});

function updateGroupCategories(groupId: string, newList: any[]) {
  const otherCategories = categories.value.filter((c: any) => c.group_id !== groupId);
  const updatedGroupCats = newList.map((c) => ({ ...c, group_id: groupId }));
  const movedIds = new Set(updatedGroupCats.map((c) => c.id));
  const remaining = otherCategories.filter((c) => !movedIds.has(c.id));
  categories.value = [...remaining, ...updatedGroupCats];
}

async function saveCategoryOrder() {
  const payload: { id: string; sort_order: number; group_id: string | null }[] = [];
  for (let i = 0; i < ungroupedCategoriesList.value.length; i++) {
    payload.push({ id: ungroupedCategoriesList.value[i].id, sort_order: i, group_id: null });
  }
  for (const cg of categoryGroups.value) {
    const cats = groupedCategoriesMap.value[cg.id] || [];
    for (let i = 0; i < cats.length; i++) {
      payload.push({ id: cats[i].id, sort_order: i, group_id: cg.id });
    }
  }
  try {
    await $fetch("/api/forum/reorder", { method: "PUT", body: { categories: payload } });
  } catch (err: any) {
    console.error(err);
  }
}

watch(() => newCategory.name, (name) => {
  newCategory.slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
});

async function fetchCategories() {
  const data = await $fetch<{ ungrouped: any[]; groups: any[] }>("/api/forum/categories");
  const all = [...data.ungrouped];
  for (const group of data.groups) all.push(...group.categories);
  categories.value = all;
}

async function createCategory() {
  categoryError.value = "";
  try {
    await $fetch("/api/forum/categories", {
      method: "POST",
      body: {
        name: newCategory.name, slug: newCategory.slug,
        description: newCategory.description || undefined,
        sort_order: categories.value.length,
        is_private: newCategory.is_private, mod_posting_only: newCategory.mod_posting_only,
        is_announcement: newCategory.is_announcement, group_id: newCategory.group_id || undefined,
      },
    });
    showNewCategory.value = false;
    Object.assign(newCategory, { name: "", slug: "", description: "", is_private: false, mod_posting_only: false, is_announcement: false, group_id: "" });
    await fetchCategories();
  } catch (err: any) {
    categoryError.value = err?.data?.statusMessage || "Failed to create category";
  }
}

async function deleteCategory(slug: string) {
  try {
    await $fetch(`/api/forum/categories/${slug}`, { method: "DELETE" });
    await fetchCategories();
  } catch (err: any) {
    console.error(err);
  }
}

// Category Editing
const editingCategorySlug = ref<string | null>(null);
const editCategory = reactive({
  name: "", slug: "", description: "",
  is_private: false, mod_posting_only: false, is_announcement: false,
});
const editCategoryError = ref("");

function startEditCategory(category: any) {
  editingCategorySlug.value = category.slug;
  editCategory.name = category.name;
  editCategory.slug = category.slug;
  editCategory.description = category.description || "";
  editCategory.is_private = category.is_private;
  editCategory.mod_posting_only = category.mod_posting_only ?? false;
  editCategory.is_announcement = category.is_announcement ?? false;
  editCategoryError.value = "";
}

function cancelEditCategory() {
  editingCategorySlug.value = null;
  editCategoryError.value = "";
}

async function saveEditCategory() {
  if (!editingCategorySlug.value) return;
  editCategoryError.value = "";
  try {
    await $fetch(`/api/forum/categories/${editingCategorySlug.value}`, {
      method: "PUT",
      body: {
        name: editCategory.name, slug: editCategory.slug,
        description: editCategory.description || null,
        is_private: editCategory.is_private, mod_posting_only: editCategory.mod_posting_only,
        is_announcement: editCategory.is_announcement,
      },
    });
    editingCategorySlug.value = null;
    await fetchCategories();
  } catch (err: any) {
    editCategoryError.value = err?.data?.statusMessage || "Failed to update category";
  }
}

// Category Access
const expandedAccess = ref<string | null>(null);
const categoryAccessRules = reactive<Record<string, any[]>>({});
const addAccessGroupId = reactive<Record<string, string>>({});
const accessError = reactive<Record<string, string>>({});
const groups = ref<any[]>([]);

async function fetchGroups() {
  groups.value = await $fetch("/api/forum/groups");
}

function availableGroupsForCategory(slug: string) {
  const existingGroupIds = (categoryAccessRules[slug] || []).map((r: any) => r.group.id);
  return groups.value.filter((g: any) => !existingGroupIds.includes(g.id));
}

async function toggleAccessPanel(slug: string) {
  if (expandedAccess.value === slug) { expandedAccess.value = null; return; }
  expandedAccess.value = slug;
  await fetchCategoryAccess(slug);
}

async function fetchCategoryAccess(slug: string) {
  try { categoryAccessRules[slug] = await $fetch(`/api/forum/categories/${slug}/access`); }
  catch { categoryAccessRules[slug] = []; }
}

async function addAccess(slug: string) {
  accessError[slug] = "";
  const groupId = addAccessGroupId[slug];
  if (!groupId) return;
  try {
    await $fetch(`/api/forum/categories/${slug}/access`, { method: "PUT", body: { group_id: groupId, can_view: true, can_post: true } });
    addAccessGroupId[slug] = "";
    await fetchCategoryAccess(slug);
  } catch (err: any) {
    accessError[slug] = err?.data?.statusMessage || "Failed to add access";
  }
}

async function updateAccess(slug: string, groupId: string, canView: boolean, canPost: boolean) {
  try {
    await $fetch(`/api/forum/categories/${slug}/access`, { method: "PUT", body: { group_id: groupId, can_view: canView, can_post: canPost } });
    await fetchCategoryAccess(slug);
  } catch (err: any) { console.error(err); }
}

async function removeAccess(slug: string, groupId: string) {
  try {
    await $fetch(`/api/forum/categories/${slug}/access`, { method: "DELETE", body: { group_id: groupId } });
    await fetchCategoryAccess(slug);
  } catch (err: any) { console.error(err); }
}

onMounted(async () => {
  if (isAdminUser.value) {
    await Promise.all([fetchCategoryGroups(), fetchCategories(), fetchGroups()]);
  }
});

watch(isAdminUser, async (val) => {
  if (val) await Promise.all([fetchCategoryGroups(), fetchCategories(), fetchGroups()]);
});

useHead({ title: "Categories - Admin" });
</script>
