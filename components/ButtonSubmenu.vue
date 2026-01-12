<template>
  <component
    :is="is"
    class="clocktracker-submenu-button flex items-center font-gothic font-medium text-sm transition duration-150 dark:text-white w-full"
    :class="{
      [computedClasses]: true,
    }"
    :disabled="disabled"
  >
    <IconUI v-if="iconId" :id="iconId" size="sm" :color="iconColor" :spin="iconSpin" />
    <slot />
  </component>
</template>

<script setup lang="ts">
  const props = withDefaults(
  defineProps<{
    component?: string;
    disabled?: boolean;
    color?: "primary" | "secondary" | "neutral" | "positive" | "caution" | "negative" | "discord" | "bgg";
    icon?: string;
    iconSpin?: boolean;
    iconColor?: "primary" | "neutral" | "positive" | "caution" | "negative" | "bgg";
  }>(),
  { 
    color: "neutral",
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

  const primary = 
    "text-white/95 bg-purple-500 dark:bg-purple-800";
  const neutral = 
    "text-stone-950 bg-white dark:bg-stone-950";    
  const positive = 
    "text-green-700 bg-white dark:bg-stone-950";
  const caution = 
    "text-amber-700 bg-white dark:bg-stone-950";  
  const negative = 
    "text-red-700 bg-white dark:bg-stone-950";
  const discord = 
    "text-white/95 bg-discord";  
  const bgg =
    "text-white/95 bg-[#3f3a60]"
  
  const primaryHover = 
    "hover:text-purple-100 hover:bg-purple-600 dark:hover:bg-purple-900-dark";
  const neutralHover = 
    "hover:text-stone-950 hover:bg-stone-400 dark:hover:bg-stone-700";  
  const positiveHover = 
    "hover:text-green-950 hover:bg-green-600 dark:hover:bg-green-800-dark";
  const cautionHover = 
    "hover:text-amber-950 hover:bg-amber-600 dark:hover:bg-amber-800-dark";  
  const negativeHover = 
    "hover:text-red-950 hover:bg-red-600 dark:hover:bg-red-800-dark";
  const discordHover = 
    "hover:text-white hover:bg-discord-dark";  
  const bggHover =
    "hover:bg-[#2e2950]";  
  
  const colorScheme = computed(() => {
    if (props.color === "primary") {
      return `${primary} ${primaryHover}`;
    }
    else if (props.color === "neutral") {
      return `${neutral} ${neutralHover}`;
    }
    else if (props.color === "positive") {
      return `${positive} ${positiveHover}`;
    }
    else if (props.color === "caution") {
      return `${caution} ${cautionHover}`;
    }
    else if (props.color === "negative") {
      return `${negative} ${negativeHover}`;
    }
    else if (props.color === "discord") {
      return `${discord} ${discordHover}`;
    }
    else if (props.color === "bgg") {
      return `${bgg} ${bggHover}`;
    }
  });

  const padding = computed(() => {
    return "py-2 px-3";
  });
  
  const spacing = computed(() => {
    return "gap-2";
  });

  const iconId = computed(() =>
    props.icon
  );

  const disabledStyle = computed(() => {
    return props.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  });

  const computedClasses = computed(() => {
    return `${spacing.value} ${padding.value} ${colorScheme.value} ${disabledStyle.value}`;
  });
</script>