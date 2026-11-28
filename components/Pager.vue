<template>
  <!-- Every control is always present, so nothing moves while paging -->
  <nav aria-label="Pages" class="flex items-center justify-center gap-1">
    <Button
      size="sm"
      color="secondary"
      icon="chevron-double-left"
      display="icon-only"
      title="First page"
      :disabled="page <= 1"
      @click="go(1)"
    >
      First page
    </Button>
    <Button
      size="sm"
      color="secondary"
      icon="chevron-left"
      display="icon-only"
      title="Previous page"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >
      Previous page
    </Button>
    <span
      class="min-w-[7.5rem] text-center text-sm tabular-nums text-stone-600 dark:text-stone-400"
      aria-live="polite"
    >
      Page {{ page }} of {{ totalPages }}
    </span>
    <Button
      size="sm"
      color="secondary"
      icon="chevron-right"
      display="icon-only"
      title="Next page"
      :disabled="page >= totalPages"
      @click="go(page + 1)"
    >
      Next page
    </Button>
    <Button
      size="sm"
      color="secondary"
      icon="chevron-double-right"
      display="icon-only"
      title="Last page"
      :disabled="page >= totalPages"
      @click="go(totalPages)"
    >
      Last page
    </Button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  "update:page": [page: number];
}>();

function go(target: number) {
  const next = Math.min(Math.max(1, target), props.totalPages);
  if (next !== props.page) emit("update:page", next);
}
</script>
