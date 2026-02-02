<template>
  <span>
    <template v-if="!redact">
      {{ name }}
    </template>
    <template v-else>
      <span
        v-for="(part, idx) in parts"
        :key="idx"
        :class="part.redacted ? redactedClass : null"
      >
        {{ part.text }}
      </span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getRedactedNameParts } from "~/composables/useRedactedName";

const props = defineProps<{
  name: string;
  redact?: boolean;
  redactedClass?: string;
}>();

const parts = computed(() => getRedactedNameParts(props.name));
const redact = computed(() => props.redact ?? false);
const redactedClass = computed(() => props.redactedClass ?? "redacted-name");
</script>
