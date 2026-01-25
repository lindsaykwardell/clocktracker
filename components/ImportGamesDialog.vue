<template>
  <Dialog v-model:visible="show" size="sm">
    <template #title>
      <h3 class="text-2xl font-bold font-sorts">Import Games</h3>
    </template>
    <div v-if="show" class="p-4">
      <template v-if="!inFlight">
        <p class="mb-4">
          You can upload a CSV of your games and import them into ClockTracker.
          Below are the steps to upload your games:
        </p>
        <ol class="flex flex-col gap-4">
          <li>
            <h4 class="text-lg font-semibold font-sorts">Step 1</h4>
            <p class="mb-2">
              Download the CSV import template.
            </p>
            <Button
              component="a"
              href="/import_template.csv"
              download="import_template.csv"
              icon="download"
            >
              Download template
            </Button>
          </li>
          <li>
            <h4 class="text-lg font-semibold font-sorts">Step 2</h4>
            <p>Enter your game details into the spreadsheet. Make sure you save it
            as a CSV file!</p>
          </li>
          <li>
            <h4 class="text-lg font-semibold font-sorts">Step 3</h4>
            <p class="mb-2">Upload the template with your games below.</p>
            <Button 
              @click="initiateImport" 
              icon="upload"
              color="primary"
            >
              Upload template
            </Button>
          </li>
        </ol>
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
