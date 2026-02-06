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
      :src="sizedImage"
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
        :id="curveId"
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
        <textPath data-v-deec739a="" :xlink:href="`#${curveId}`">
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
        :src="sizedAlignmentImage"
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
        :src="sizedRelatedImage"
        loading="lazy"
        :alt="character?.related || character.related_role?.name || 'Unknown'"
        v-tooltip="relatedTokenTooltip || undefined"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoleImage } from "~/composables/useRoleImage";

const props = defineProps<{
  character?:
    | {
        alignment?: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
        name?: string;
        related?: string | null;
        role_id?: string | null;
        related_role_id?: string | null;
        role?: {
          id: string;
          token_url?: string;
          type: string;
          initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
          name?: string;
          custom_role?: boolean;
        };
        related_role?: { token_url?: string; id?: string; name?: string };
      }
    | undefined;
  size?: "sm" | "reminder" | "md" | "front" | "lg";
  alwaysShowAlignment?: boolean;
  hideRelated?: boolean;
  hideName?: boolean;
  outline?: boolean;
  relatedId?: string;
  curveId?: string;
  reminderText?: string;
  tokenTooltip?: any;
  relatedTokenTooltip?: any;
  alignmentTooltip?: any;
}>();

const emit = defineEmits(["clickRelated", "clickRole", "clickAlignment"]);

let curveIdSeed = 0;
const curveId = ref("");
const curveIdBase = computed(() => {
  if (props.curveId) return props.curveId;
  const base =
    props.character?.role?.id ||
    props.character?.role_id ||
    props.character?.name ||
    props.character?.role?.name ||
    props.relatedId ||
    "token";
  return `curve-${hashString(base)}`;
});
const curveIdSuffix = ref("");

watchEffect(() => {
  curveId.value = curveIdSuffix.value
    ? `${curveIdBase.value}-${curveIdSuffix.value}`
    : curveIdBase.value;
});

onMounted(() => {
  if (!props.curveId) {
    curveIdSuffix.value = Math.random().toString(36).slice(2, 8);
  }
});

function hashString(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
const {
  alignmentSuffix,
  isRoleAssetUrl,
  roleBaseUrlFromId,
  roleBaseUrlFromRole,
  sizeAdjustedUrl,
} = useRoleImage();

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
    case "front":
      classes += "w-32 h-32 md:w-40 md:h-40";
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

  // If the character uses alignment-specific art, don't apply filters.
  if (usesAlignmentVariant.value) {
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
    case "front":
      return "w-24 h-24 md:w-36 md:h-36";
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

const baseRoleImage = computed(() => {
  const tokenUrl = props.character?.role?.token_url?.trim();
  const inferredCustom =
    props.character?.role?.custom_role ??
    (tokenUrl ? !isRoleAssetUrl(tokenUrl) : false);
  if (inferredCustom) {
    return roleBaseUrlFromRole(props.character?.role);
  }
  return (
    roleBaseUrlFromId(props.character?.role?.id) ??
    roleBaseUrlFromId(props.character?.role_id) ??
    tokenUrl
  );
});

// If we're using alignment-specific art, skip shader/filter overlays.
const usesAlignmentVariant = computed(() => {
  const base = baseRoleImage.value;
  if (!isRoleAssetUrl(base)) {
    return false;
  }
  return alignmentSuffix(props.character?.role, props.character?.alignment) !== "";
});

const image = computed(() => {
  if (!props.character?.role && !props.character?.role_id) {
    return undefined;
  }
  const base = baseRoleImage.value;
  if (base) {
    if (isRoleAssetUrl(base)) {
      const normalizedBase = base.replace(/\.(png|webp)$/i, "");
      return `${normalizedBase}${alignmentSuffix(
        props.character?.role,
        props.character.alignment
      )}`;
    }
    return base;
  }
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.webp";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.webp";
  }
});

const relatedImage = computed(() => {
  if (props.character?.related_role?.token_url) {
    return props.character.related_role.token_url;
  }
  if (props.character?.related_role?.id) {
    return roleBaseUrlFromId(props.character.related_role.id);
  }
  const derivedRelated = roleBaseUrlFromId(
    props.character?.related_role_id
  );
  if (derivedRelated) {
    return derivedRelated;
  }
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.webp";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.webp";
  }
});

const alignmentImage = computed(() => {
  if (props.character?.alignment === "GOOD") {
    return "/img/role/good.webp";
  }
  if (props.character?.alignment === "EVIL") {
    return "/img/role/evil.webp";
  } 
  else {
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

const sizedImage = computed(() =>
  sizeAdjustedUrl(image.value, props.size, "webp")
);
const sizedRelatedImage = computed(() =>
  sizeAdjustedUrl(relatedImage.value, props.size, "webp")
);
const sizedAlignmentImage = computed(() =>
  sizeAdjustedUrl(alignmentImage.value, props.size, "webp")
);

</script>

<style scoped>
.token {
  background-image: url("/img/token-bg.webp");

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
