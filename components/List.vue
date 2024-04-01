<template>
  <div>
    <ul> 
      <li v-for="(item, i) in constructedData" :key="item.label">
        {{ i + 1 }}.
        <span>{{ item.label}}</span>
        ({{ item.amount }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">

// These definitions are a little weird but they are designed to 
// provide a similar api to chartjs 
const props = defineProps<{
  data: {
    datasets: {
      data: number[];
    }[]
    labels: string[]
  }
}>()

const constructedData = computed(() => {
  if (props.data.datasets[0].data.length !== props.data.labels.length) {
    throw new Error("Invalid data passed to list component")
  }
  const data = props.data.datasets[0].data.map((amount, index) => {
    return {
      amount,
      label: props.data.labels[index]
    }
  });
  return data.sort((a, b) => b.amount - a.amount)
})
</script>
