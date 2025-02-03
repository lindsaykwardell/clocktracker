<template>
  <Dialog v-model:visible="show" size="sm">
    <template #title>
      <h3 class="text-2xl font-bold font-sorts">Import Games</h3>
    </template>
    <div v-if="show" class="p-4">
      <template v-if="!inFlight">
        <p class="pb-4">
          You can upload a CSV of your games and import them into ClockTracker.
          Below are the steps to upload your games:
        </p>
        <ul class="list-disc list-inside">
          <li>
            <a
              href="/import_template.csv"
              download="import_template.csv"
              class="underline"
            >
              Download Import Template
            </a>
          </li>
          <li>
            Enter your game details into the spreadsheet. Make sure you save it
            as a CSV!
          </li>
          <li>
            <button @click="initiateImport" class="underline">
              Upload the template with your games
            </button>
          </li>
        </ul>
      </template>
      <Loading v-else />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const games = useGames();
const inFlight = ref(false);

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits(["update:visible", "done"]);

const show = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

async function initiateImport() {
  try {
    await games.importGames(() => (inFlight.value = true));
    show.value = false;
    inFlight.value = false;
    emit("done");
  } catch {
    inFlight.value = false;
  }
}
</script>
