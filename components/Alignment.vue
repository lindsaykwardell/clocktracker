<template>
  <div>
    <h3 class="font-piratesbay text-2xl text-center">Alignment</h3>
    <Pie id="alignment" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { Pie } from "vue-chartjs";

const props = defineProps({
  games: {
    type: Array,
    required: true,
  },
});

const alignment = computed(() => {
  const val = { good: 0, evil: 0 };

  for (const game of props.games) {
    if (game.alignment === "Good") {
      val.good++;
    } else {
      val.evil++;
    }
  }

  return val;
});

const chartData = computed(() => ({
  labels: ["Good", "Evil"],
  datasets: [
    {
      data: [alignment.value.good, alignment.value.evil],
      hoverOffset: 4,
      backgroundColor: ["blue", "red"],
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
}));
</script>
