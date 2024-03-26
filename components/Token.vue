<template>
  <div
    class="bg-center bg-cover relative rounded-full shadow-xl border flex justify-center items-center aspect-square"
    :class="tokenClass"
    @click="emit('clickRole')"
  >
    <img
      v-if="image"
      class="token-image"
      :class="imageSize"
      :src="image"
      loading="lazy"
      :alt="character?.name || character?.role?.name || 'Unknown'"
      v-tooltip="tokenTooltip"
    />
    <div
      v-if="reminderText"
      class="text-center relative -top-2"
      :class="reminderTextSize"
    >
      {{ reminderText }}
    </div>
    <div
      v-if="
        (character?.role &&
          character.alignment !== character.role?.initial_alignment) ||
        alwaysShowAlignment
      "
      class="token bg-center bg-cover absolute bottom-0 -left-3 rounded-full shadow-xl border border-black flex justify-center items-center"
      :class="relatedSize"
      @click.stop="emit('clickAlignment')"
    >
      <img
        :class="relatedImageSize"
        :src="alignmentImage"
        loading="lazy"
        v-tooltip="alignmentTooltip"
      />
    </div>
    <slot />
    <div
      v-if="character?.related_role && !hideRelated"
      :id="relatedId"
      class="token related bg-center bg-cover absolute bottom-0 -right-3 rounded-full shadow-xl border border-black flex justify-center items-center"
      :class="relatedSize"
      @click.stop="emit('clickRelated')"
    >
      <img
        v-if="relatedImage"
        class="related-token-image"
        :class="relatedImageSize"
        :src="relatedImage"
        loading="lazy"
        :alt="character?.related || character.related_role?.name || 'Unknown'"
        v-tooltip="relatedTokenTooltip"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  character?:
    | {
        alignment?: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
        name?: string;
        related?: string | null;
        role?: {
          token_url: string;
          initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
          name?: string;
        };
        related_role?: { token_url: string; name?: string };
      }
    | undefined;
  size?: "sm" | "reminder" | "md" | "lg";
  alwaysShowAlignment?: boolean;
  hideRelated?: boolean;
  outline?: boolean;
  relatedId?: string;
  reminderText?: string;
  tokenTooltip?: any;
  relatedTokenTooltip?: any;
  alignmentTooltip?: any;
}>();

const emit = defineEmits(["clickRelated", "clickRole", "clickAlignment"]);

const tokenClass = computed(() => {
  let classes = "";
  switch (props.size) {
    case "sm":
      classes += "w-8 h-8 md:w-12 md:h-12";
      break;
    case "reminder":
      classes += "reminder flex-col w-12 h-12 md:w-16 md:h-16";
      break;
    case "md":
      classes += "w-20 h-20 md:w-28 md:h-28";
      break;
    case "lg":
      classes += "w-36 h-36 md:w-48 md:h-48";
      break;
  }

  if (props.character) {
    classes += " token border-black";
  }

  if (props.outline) {
    classes += " border-dashed border-stone-100";
  }

  return classes;
});

const imageSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "md:w-12 md:h-12";
    case "reminder":
      return "relative w-8 h-8 md:w-12 md:h-12";
    case "md":
      return "md:w-20 md:h-20";
    case "lg":
      return "w-32 h-32 md:w-40 md:h-40";
  }
});

const relatedSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-4 h-4 md:w-6 md:h-6";
    case "md":
      return "w-8 h-8 md:w-12 md:h-12";
    case "lg":
      return "w-12 h-12 md:w-16 md:h-16";
  }
});

const relatedImageSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "";
    case "md":
      return "";
    case "lg":
      return "md:w-12 md:h-12";
  }
});

const image = computed(() => {
  if (props.character?.role?.token_url) {
    return props.character.role.token_url;
  }
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.png";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.png";
  }
});

const relatedImage = computed(() => {
  if (props.character?.related_role?.token_url) {
    return props.character.related_role.token_url;
  }
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.png";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.png";
  }
});

const alignmentImage = computed(() => {
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.png";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.png";
  } else {
    return "/1x1.png";
  }
});

const reminderTextSize = computed(() => {
  // We're basing the size on the number of characters in the reminder text
  if (props.reminderText?.length) {
    if (props.reminderText.length > 15) {
      return "text-[0.45rem] md:text-[0.5rem]";
    }
    if (props.reminderText.length > 10) {
      return "leading-4 text-[0.5rem] md:text-xs";
    }
  }
  return "text-[0.5rem] md:text-xs";
});
</script>

<style scoped>
.token {
  background-image: url("/img/token-bg.png");

  &.reminder {
    background-image: url("/img/reminder-token.webp");
  }
}
</style>
