<template>
  <div class="relative inline-block">
    <button
      type="button"
      class="text-stone-400 hover:text-stone-200 transition-colors"
      title="Markdown help"
      @click="open = !open"
    >
      <IconUI id="info-circle" size="sm" />
    </button>
    <div
      v-if="open"
      class="absolute z-20 bottom-full mb-2 w-64 p-3 rounded border
             border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800
             shadow-lg text-xs text-stone-600 dark:text-stone-300"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <button
        type="button"
        class="absolute top-1 right-1 text-stone-400 hover:text-stone-200"
        @click="open = false"
      >
        <IconUI id="x" size="xs" />
      </button>
      <p class="font-semibold mb-2">Markdown Formatting</p>
      <table class="w-full">
        <tbody>
          <tr v-for="item in items" :key="item.syntax" class="border-b border-stone-300/50 dark:border-stone-700/50 last:border-0">
            <td class="py-1 pr-2 font-mono text-stone-400">{{ item.syntax }}</td>
            <td class="py-1">{{ item.label }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const { align = "right" } = defineProps<{
  align?: "left" | "right";
}>();

const open = ref(false);

const items = [
  { syntax: "**bold**", label: "Bold" },
  { syntax: "*italic*", label: "Italic" },
  { syntax: "[text](url)", label: "Link" },
  { syntax: "![alt](url)", label: "Image" },
  { syntax: "# Heading", label: "Heading" },
  { syntax: "- item", label: "List" },
  { syntax: "> quote", label: "Blockquote" },
  { syntax: "`code`", label: "Inline code" },
];
</script>
