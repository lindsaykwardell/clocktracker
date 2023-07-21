<template>
  <div
    v-if="character"
    class="token bg-center bg-cover relative rounded-full shadow-xl border border-black flex justify-center items-center"
    :class="tokenSize"
  >
    <img
      :class="imageSize"
      :src="image"
      loading="lazy"
    />
    <div
      v-if="character.related"
      class="token bg-center bg-cover absolute bottom-0 right-0 rounded-full shadow-xl border border-black flex justify-center items-center"
      :class="relatedSize"
    >
      <img
        :class="relatedImageSize"
        :src="roles.toImage(character.related || '')"
        loading="lazy"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Character } from "@prisma/client";

const roles = useRoles();

const props = defineProps<{
  character: (Character & { role?: { token_url: string } }) | undefined;
  size: "sm" | "md" | "lg";
}>();

const tokenSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-8 h-8 md:w-12 md:h-12";
    case "md":
      return "w-20 h-20 md:w-28 md:h-28";
    case "lg":
      return "w-36 h-36 md:w-48 md:h-48";
  }
});

const imageSize = computed(() => {
  switch (props.size) {
    case "sm":
      return "md:w-12 md:h-12";
    case "md":
      return "md:w-20 md:h-20";
    case "lg":
      return "w-32 h-32 md:w-40 md:`h-40";
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
</script>

<style scoped>
.token {
  background-image: url("/img/token-bg.png");
}
</style>
