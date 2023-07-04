<template>
  <header class="sticky top-0 bg-stone-900 p-2 flex items-center gap-4">
    <img
      src="https://www.pdxbotc.com/img/demon-head.png"
      class="w-[75px]"
      alt="Demon Head"
    />
    <h1 class="font-piratesbay text-stone-200 text-3xl hidden md:block">
      ClockTracker
    </h1>
    <div class="flex-grow flex justify-end gap-4">
      <nuxt-link
        to="/"
        class="text-stone-200 hover:text-stone-100 hover:underline flex gap-2 items-center"
      >
        <div class="w-[50px] overflow-hidden">
          <img
            src="https://wiki.bloodontheclocktower.com/images/0/0c/Icon_innkeeper.png"
            class="max-w-[125%]"
            alt=""
          />
        </div>
        <span class="hidden md:inline">Home</span>
      </nuxt-link>
      <nuxt-link
        to="/add-game"
        class="text-stone-200 hover:text-stone-100 hover:underline flex gap-2 items-center"
      >
        <div class="w-[50px] overflow-hidden">
          <img
            src="https://wiki.bloodontheclocktower.com/images/f/f2/Icon_mezepheles.png"
            class="max-w-[125%]"
            alt=""
          />
        </div>
        <span class="hidden md:inline">Add Game</span>
      </nuxt-link>
      <!-- <nuxt-link
        to="/settings"
        class="text-stone-200 hover:text-stone-100 hover:underline flex gap-2 items-center"
      >
        <div class="w-[50px] overflow-hidden">
          <img
            src="https://wiki.bloodontheclocktower.com/images/9/98/Icon_tinker.png"
            class="max-w-[125%]"
            alt=""
          />
        </div>
        Settings
      </nuxt-link> -->
    </div>
  </header>
  <NuxtPage />
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);
</script>

<style>
body {
  @apply bg-stone-800 font-raleway text-stone-100;
}

.router-link-active {
  @apply underline;
}
</style>
