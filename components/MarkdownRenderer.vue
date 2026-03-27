<script setup lang="ts">
import VueMarkdown from "vue-markdown-render";
import { markdownAlignment } from "~/utils/markdownAlignment";

defineProps<{
  source: string;
  options?: Record<string, any>;
}>();

const plugins = [markdownAlignment];
</script>

<template>
  <VueMarkdown :source="source" :options="options" :plugins="plugins" />
</template>
