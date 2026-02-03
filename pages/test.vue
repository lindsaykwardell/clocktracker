<template>
  <StandardTemplate>
    <div class="min-h-screen p-8 flex flex-col gap-8 w-1/2 mx-auto">
      <header class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold">Button Overview</h1>
      </header>

      <section class="space-y-3">
        <div class="space-y-4">
          <div
            v-for="variant in variants"
            :key="variant"
            class="space-y-2"
          >
            <h2 class="text-lg font-semibold">
              {{ labelize(variant) }}
            </h2>
            <div class="flex flex-wrap gap-3 items-center">
              <Button
                v-for="color in colors"
                :key="`${variant}-${color}`"
                icon="star"
                iconSize="lg"
                display="icon-before"
                :color="color"
                :variant="variant"
              >
                {{ labelize(color) }}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Sizes</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            v-for="size in sizes"
            :key="size"
            icon="star"
            display="icon-before"
            color="secondary"
            :size="size"
          >
            {{ sizeLabel(size) }}
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">States</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button icon="star" display="icon-before" color="positive">
            Default
          </Button>
          <Button icon="star" display="icon-before" color="positive" active>
            Active
          </Button>
          <Button icon="star" display="icon-before" color="positive" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Wide</h2>
        <div class="flex flex-col gap-3 max-w-md">
          <Button color="primary" wide>
            Wide button
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Icon Display</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            v-for="display in displays"
            :key="display"
            icon="star"
            iconSize="lg"
            :display="display"
          >
            {{ labelize(display) }}
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Icon Shapes</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button icon="star" display="icon-only" size="lg">
            Square
          </Button>
          <Button icon="star" display="icon-only" size="lg" circular>
            Circle
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Icon Styling</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            v-for="iconColor in iconColors"
            :key="iconColor"
            icon="star"
            iconSize="lg"
            :iconColor="iconColor"
            display="icon-before"
            color="neutral"
          >
            {{ labelize(iconColor) }}
          </Button>
          <Button icon="star" iconSize="lg" iconSpin color="neutral">
            Spinning
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Image Button</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button image="investigator" color="primary">
            Color Image
          </Button>
          <Button image="investigator" color="neutral">
            Neutral image
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Count</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button
            color="neutral"
            icon="star"
            display="icon-before"
            count="3"
            countLabel="3 new items"
          >
            With count
          </Button>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Removable Tag</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Button removableTag color="neutral">
            Removable
          </Button>
          <Button removableTag color="secondary">
            Selected
          </Button>
        </div>
      </section>

      <header class="space-y-2 text-center pt-6">
        <h1 class="text-2xl font-semibold">Badge Overview</h1>
      </header>

      <section class="space-y-3">
        <div class="space-y-4">
          <div
            v-for="variant in badgeVariants"
            :key="variant"
            class="space-y-2"
          >
            <h2 class="text-lg font-semibold">
              {{ labelize(variant) }}
            </h2>
            <div class="flex flex-wrap gap-3 items-center">
              <Badge
                v-for="color in badgeColors"
                :key="`${variant}-${color}`"
                :color="color"
                :variant="variant"
              >
                {{ labelize(color) }}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Sizes</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Badge
            v-for="size in badgeSizes"
            :key="size"
            color="neutral"
            :size="size"
          >
            {{ sizeLabel(size) }}
          </Badge>
        </div>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Icon + Shape</h2>
        <div class="flex flex-wrap gap-3 items-center">
          <Badge color="positive" icon="star">
            Icon
          </Badge>
          <Badge color="positive" icon="star" circular />
          <Badge color="neutral" icon="star" bold>
            Bold
          </Badge>
        </div>
      </section>
    </div>
  </StandardTemplate>  
</template>

<script setup lang="ts">
const colors = [
  "primary",
  "secondary",
  "neutral",
  "neutral-on-dark",
  "contrast",
  "black",
  "positive",
  "caution",
  "negative",
  "discord",
  "bgg",
] as const;

const variants = [
  "filled",
  "soft",
  "outline",
  "link",
  "link-underline",
] as const;

const sizes = ["xs", "xs-sm", "sm", "sm-md", "md", "lg"] as const;

const displays = ["icon-before", "icon-after", "icon-only"] as const;

const iconColors = [
  "primary",
  "neutral",
  "positive",
  "caution",
  "negative",
  "bgg",
] as const;

const badgeColors = [
  "primary",
  "neutral",
  "positive",
  "caution",
  "negative",
  "scripts",
  "games",
  "admins",
  "digital",
] as const;

const badgeVariants = ["filled", "soft", "overlay"] as const;

const badgeSizes = ["xs", "sm", "sm-md", "md", "lg"] as const;

const labelize = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const sizeLabel = (value: string) => {
  switch (value) {
    case "xs":
      return "Extra Small";
    case "xs-sm":
      return "Responsive Small";
    case "sm":
      return "Small";
    case "sm-md":
      return "Responsive Medium";
    case "md":
      return "Medium";
    case "lg":
      return "Large";
    default:
      return labelize(value);
  }
};
</script>
