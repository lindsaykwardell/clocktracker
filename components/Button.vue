<template>
  <component
    :is="is"
    class="clocktracker-button flex justify-center items-center font-gothic font-sm text-center whitespace-nowrap transition duration-150 dark:text-white rounded"
    :class="{
      [computedClasses]: true,
      'font-semibold': !removableTag,
      'w-full max-w-[16rem]': wide,
      'rounded-full aspect-square leading-none': circular,
    }"
    :disabled="disabled"
  >
    <IconUI v-if="iconId && displayMode === 'icon-before'" :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
    <template v-if="iconId && displayMode === 'icon-only'">
      <span class="sr-only">
        <slot />
      </span>
      <IconUI v-if="iconId && displayMode === 'icon-only'" :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
    </template>
    <template v-else>
      <slot />
    </template>
    <IconUI v-if="iconId && displayMode === 'icon-after'" :id="iconId" :size="iconSize" :color="iconColor" :spin="iconSpin" />
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    component?: string;
    disabled?: boolean;
    hasIcon?: boolean;
    tag?: boolean;

    active?: boolean;
    variant?: "filled" | "soft" | "outline" | "ghost";
    size?: "x-small" | "mobile-small" | "small" | "medium" | "large";
    color?: "primary" | "secondary" | "neutral" | "neutral-on-dark" | "contrast" | "positive" | "caution" | "negative" | "discord" | "bgg";
    wide?: boolean;
    circular?: boolean;
    removableTag?: boolean;
    icon?: string;
    iconSpin?: boolean;
    iconColor?: "primary" | "neutral" | "positive" | "caution" | "negative" | "bgg";
    display?: "icon-before" | "icon-only" | "icon-after";
}>(),
  { 
    variant:"filled",
    color: "neutral",
    size: "medium",
    display: "icon-before",
  }
);

const nuxtLink = resolveComponent("nuxt-link");

const is = computed(() => {
  switch (props.component) {
    case "nuxt-link":
      return nuxtLink;
    case undefined:
      return "button";
    default:
      return props.component;
  }
});

const filled = "border border-transparent shadow"
const ghost = "border border-transparent bg-transparent hover:shadow"

const primaryFilled = 
  "text-white/95 bg-purple-500 dark:bg-purple-800";
const neutralFilled = 
  "text-stone-950 bg-stone-300 dark:bg-stone-600"; 
const neutralOnDarkFilled =
  "text-stone-300 bg-stone-600"     
const positiveFilled = 
  "text-green-950 bg-green-500 dark:bg-green-800";
const cautionFilled = 
  "text-amber-950 bg-amber-500 dark:bg-amber-800";  
const negativeFilled = 
  "text-red-950 bg-red-500 dark:bg-red-800";
const contrastFilled = 
  "text-black dark:text-white bg-white dark:bg-black";  
const discordFilled = 
  "text-white/95 bg-discord";  
const bggFilled =
  "text-white/95 bg-[#3f3a60]"

const primaryHover = 
  "hover:text-purple-100 hover:bg-purple-600 dark:hover:bg-purple-900-dark";
const neutralHover = 
  "hover:text-stone-950 hover:bg-stone-400 dark:hover:bg-stone-700"; 
const neutralOnDarkHover =
  "hover:text-stone-300 hover:bg-stone-700"     
const positiveHover = 
  "hover:text-green-950 hover:bg-green-600 dark:hover:bg-green-900-dark";
const cautionHover = 
  "hover:text-amber-950 hover:bg-amber-600 dark:hover:bg-amber-900-dark";  
const negativeHover = 
  "hover:text-red-950 hover:bg-red-600 dark:hover:bg-red-900-dark";
const contrastHover = 
  "hover:text-white hover:bg-purple-600";  
const discordHover = 
  "hover:text-white hover:bg-discord-dark";  
const bggHover =
  "hover:bg-[#2e2950]";

const primaryActive = 
  "text-white/95 bg-purple-600 dark:bg-purple-900-dark";
const neutralActive = 
  "text-stone-950 bg-stone-400 dark:bg-stone-700"; 
const neutralOnDarkActive =
  "text-stone-300 bg-stone-700"     
const positiveActive = 
  "text-green-950 bg-green-600 dark:bg-green-900-dark";
const cautionActive = 
  "text-amber-950 bg-amber-600 dark:bg-amber-900-dark";  
const negativeActive = 
  "text-red-950 bg-red-600 dark:bg-red-900-dark";
const contrastActive = 
  "text-white/95 bg-purple-600";  
const discordActive = 
  "text-white/95 bg-discord-dark";  
const bggActive =
  "text-white/95 bg-[#2e2950]"    

const colorScheme = computed(() => {
  if (props.active) {
    if (props.color === "primary") {
      return `${primaryActive} ${filled}`;
    }
    else if (props.color === "neutral") {
      return `${neutralActive} ${filled}`;
    }
    else if (props.color === "neutral-on-dark") {
      return `${neutralOnDarkActive} ${filled}`;
    }
    else if (props.color === "positive") {
      return `${positiveActive} ${filled}`;
    }
    else if (props.color === "caution") {
      return `${cautionActive} ${filled}`;
    }
    else if (props.color === "negative") {
      return `${negativeActive} ${filled}`;
    }
    else if (props.color === "contrast") {
      return `${contrastActive} ${filled}`;
    }
    else if (props.color === "discord") {
      return `${discordActive} ${filled}`;
    }
    else if (props.color === "bgg") {
      return `${bggActive} ${filled}`;
    }
  }
  else if (props.variant === "filled") {
    if (props.color === "primary") {
      return `${primaryFilled} ${primaryHover} ${filled}`;
    }
    else if (props.color === "neutral") {
      return `${neutralFilled} ${neutralHover} ${filled}`;
    }
    else if (props.color === "neutral-on-dark") {
      return `${neutralOnDarkFilled} ${neutralOnDarkHover} ${filled}`;
    }
    else if (props.color === "positive") {
      return `${positiveFilled} ${positiveHover} ${filled}`;
    }
    else if (props.color === "caution") {
      return `${cautionFilled} ${cautionHover} ${filled}`;
    }
    else if (props.color === "negative") {
      return `${negativeFilled} ${negativeHover} ${filled}`;
    }
    else if (props.color === "contrast") {
      return `${contrastFilled} ${contrastHover} ${filled}`;
    }
    else if (props.color === "discord") {
      return `${discordFilled} ${discordHover} ${filled}`;
    }
    else if (props.color === "bgg") {
      return `${bggFilled} ${bggHover} ${filled}`;
    }
  } 
  else if (props.variant === "ghost") {
    if (props.color === "primary") {
      return `${primaryHover} ${ghost}`;
    }
    else if (props.color === "neutral") {
      return `${neutralHover} ${ghost}`;
    }
    else if (props.color === "neutral-on-dark") {
      return `${neutralOnDarkHover} ${ghost}`;
    }
    else if (props.color === "positive") {
      return `${positiveHover} ${ghost}`;
    }
    else if (props.color === "caution") {
      return `${cautionHover} ${ghost}`;
    }
    else if (props.color === "negative") {
      return `${negativeHover} ${ghost}`;
    }
    else if (props.color === "contrast") {
      return `${contrastHover} ${ghost}`;
    }
    else if (props.color === "discord") {
      return `${discordHover} ${ghost}`;
    }
    else if (props.color === "bgg") {
      return `${bggHover} ${ghost}`;
    }
  }
});

const fontSize = computed(() => {
  switch (props.size) {
    case "x-small":
      return "text-xs";
    case "mobile-small":
      return "text-sm md:text-base";
    case "small":
      return "text-sm";
    case "large":
      return "text-lg";
    default:
      return "text-base";
  }
});

const iconSize = computed(() => {
  if (props.removableTag) {
    return "md";
  } 
  else {
    switch (props.size) {
      case "x-small":
        return "xs";
      case "mobile-small":
      case "small":
        return "sm";
      case "large":
        return "lg";
      default:
        return "md";
    }
  }
});

const padding = computed(() => {
  if (props.display === 'icon-only') {
    switch (props.size) {
      case "x-small":
        return "";
      case "mobile-small":
      case "small":
        return "p-1";
      case "large":
        return "p-2";
      default:
        return "p-1";
    }
  }
  else {
    switch (props.size) {
      case "x-small":
        return "";
      case "mobile-small":
        return "py-1 px-2 md:py-2 md:px-4";
      case "small":
        return "py-1 px-2";
      case "large":
        return "py-3 px-6";
      default:
        return "py-2 px-4";
    }
  }
});

const spacing = computed(() => {
  if (props.removableTag) {
    return "gap-1";
  }
  else if (props.icon) {
    switch (props.size) {
      case "mobile-small":
      case "small":
        return "gap-1";
      case "large":
        return "gap-3";
      default:
        return "gap-2";
    }
  }
  else {
    return "gap-2";
  }
});

const displayMode = computed(() =>
  props.removableTag ? "icon-after" : props.display
);

const iconId = computed(() =>
  props.removableTag ? "x" : props.icon
);

const disabledStyle = computed(() => {
  return props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
});

const computedClasses = computed(() => {
  return `${spacing.value} ${padding.value} ${fontSize.value} ${colorScheme.value} ${disabledStyle.value}`;
});
</script>
