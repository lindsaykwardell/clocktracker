<template>
  <div
    class="bg-center bg-cover relative rounded-full shadow-xl border flex justify-center items-center aspect-square flex-col"
    :class="tokenClass"
    @click="emit('clickRole')"
  >
    <img
      v-if="image"
      class="token-image"
      :class="dynamicTokenClass"
      :src="image"
      loading="lazy"
      :alt="character?.name || character?.role?.name || 'Unknown'"
      v-tooltip="tokenTooltip || undefined"
    />
    <svg
      v-if="!hideName && (character?.name || character?.role?.name)"
      data-v-deec739a=""
      viewBox="0 0 150 150"
      class="absolute font-sorts text-lg font-bold"
    >
      <path
        data-v-deec739a=""
        d="M 13 75 C 13 160, 138 160, 138 75"
        id="curve"
        fill="transparent"
      ></path>
      <text
        data-v-deec739a=""
        width="150"
        x="66.6%"
        text-anchor="middle"
        font-size="90%"
        class="label mozilla"
      >
        <textPath data-v-deec739a="" xlink:href="#curve">
          {{ character?.name || character?.role?.name }}
        </textPath>
      </text>
    </svg>
    <div
      v-if="reminderText"
      class="text-center relative text-white"
      :class="{
        [reminderTextSize]: true,
        '-top-2': image !== undefined,
      }"
    >
      {{ reminderText }}
    </div>
    <div
      v-if="alwaysShowAlignment || (!character?.role && character?.alignment)"
      class="token bg-center bg-cover absolute rounded-full shadow-xl border border-black flex justify-center items-center"
      :class="[relatedSize, relatedPos]"
      @click.stop="emit('clickAlignment')"
    >
      <img
        :class="relatedImageSize"
        :src="alignmentImage"
        loading="lazy"
        v-tooltip="alignmentTooltip || undefined"
      />
    </div>
    <slot />
    <div
      v-if="character?.related_role && !hideRelated"
      :id="relatedId"
      class="token related bg-center bg-cover -bottom-3 -left-6 absolute rounded-full shadow-xl border border-black flex justify-center items-center"
      :class="[relatedSize]"
      @click.stop="emit('clickRelated')"
    >
      <img
        v-if="relatedImage"
        class="related-token-image"
        :class="relatedImageSize"
        :src="relatedImage"
        loading="lazy"
        :alt="character?.related || character.related_role?.name || 'Unknown'"
        v-tooltip="relatedTokenTooltip || undefined"
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
          alternate_token_urls?: string[];
          type: string;
          initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
          name?: string;
        };
        related_role?: { token_url: string; name?: string };
      }
    | undefined;
  size?: "sm" | "reminder" | "md" | "lg";
  alwaysShowAlignment?: boolean;
  hideRelated?: boolean;
  hideName?: boolean;
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
      classes += "reminder w-12 h-12 md:w-16 md:h-16";
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

const dynamicTokenClass = computed(() => {
  let classes = imageSize.value;

  // If the character has alternate token URLs, we don't want to apply any filters
  if ((props.character?.role?.alternate_token_urls?.length ?? 0) > 0) {
    return classes;
  }

  if (props.character?.role?.type === "TRAVELER") {
    if (props.character.alignment === "GOOD") {
      classes += " good-traveler";
    } else if (props.character.alignment === "EVIL") {
      classes += " evil-traveler";
    }
  } else if (
    props.character?.alignment &&
    props.character.role &&
    props.character.alignment !== props.character.role.initial_alignment
  ) {
    if (props.character.alignment === "NEUTRAL") {
      classes += " neutral";
    } else if (props.character.role?.initial_alignment === "GOOD") {
      classes += " turned-evil";
    } else if (props.character.role?.initial_alignment === "EVIL") {
      classes += " turned-good";
    }
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

const relatedPos = computed(() => {
  switch (props.size) {
    case "sm":
      return "-bottom-1 md:-bottom-2 -left-1 md:-left-2";
    case "md":
      return "-bottom-3 -right-6";
    case "lg":
      return "-bottom-3 -right-6";
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
  if (!props.character?.role) {
    return undefined;
  }
  if ((props.character?.role?.alternate_token_urls?.length ?? 0) > 0) {
    if (
      (props.character?.alignment === "GOOD" &&
        props.character?.role?.initial_alignment === "EVIL") ||
      (props.character?.alignment === "EVIL" &&
        props.character?.role?.initial_alignment === "GOOD")
    ) {
      return props.character.role.alternate_token_urls?.[0];
    }
    if (props.character?.role?.initial_alignment === "NEUTRAL") {
      if (
        props.character?.alignment === "GOOD" &&
        (props.character.role.alternate_token_urls?.length ?? 0) >= 1
      ) {
        return props.character.role.alternate_token_urls?.[0];
      }
      if (
        props.character?.alignment === "EVIL" &&
        (props.character.role.alternate_token_urls?.length ?? 0) >= 2
      ) {
        return props.character.role.alternate_token_urls?.[1];
      }
    }
  }
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

  .token-image {
    &.neutral {
      filter: sepia(1) brightness(1.5) contrast(1.6);
    }

    &.good-traveler {
      filter: hue-rotate(220deg) brightness(1.3);
    }

    &.evil-traveler {
      filter: hue-rotate(155deg) brightness(0.65) contrast(4);
    }

    &.turned-good {
      filter: hue-rotate(220deg) brightness(1.3);
    }

    &.turned-evil {
      filter: hue-rotate(155deg) brightness(0.65) contrast(4);
    }
  }
}
</style>
