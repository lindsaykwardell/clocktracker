<template>
  <DashboardTemplate>
    <section class="py-6">
      <h2 class="font-piratesbay text-4xl text-center">Add Game</h2>
      <form class="max-w-[1000px] m-auto py-6" @submit.prevent="submitGame">
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Setup</legend>
          <label>
            <span class="block">Date</span>
            <input
              type="date"
              v-model="date"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
          <label>
            <span class="block">Script</span>
            <input
              type="text"
              list="scripts"
              v-model="script"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
            <datalist id="scripts">
              <option
                v-for="script in baseScripts"
                :value="script"
                :key="script"
              >
                {{ script }}
              </option>
            </datalist>
          </label>
          <label>
            <span class="block">Location Type</span>
            <select
              v-model="locationType"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="IN_PERSON">In Person</option>
              <option value="ONLINE">Online</option>
            </select>
          </label>
          <label>
            <span class="block">Location</span>
            <input
              type="text"
              v-model="location"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
          <label>
            <span class="block">Players</span>
            <input
              type="number"
              v-model="playerCount"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Player Setup</legend>
          <label>
            <span class="block">Initial Character</span>
            <input
              type="text"
              list="characters"
              v-model="initialCharacter"
              class="block w-full border border-stone-500 rounded-md p-2"
            />
            <datalist id="characters">
              <option v-for="role in roles" :value="role" :key="role">
                {{ role }}
              </option>
            </datalist>
          </label>
          <label>
            <span class="block">Alignment</span>
            <select
              v-model="alignment"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="GOOD">Good</option>
              <option value="EVIL">Evil</option>
            </select>
          </label>
        </fieldset>
        <fieldset
          class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
        >
          <legend>Game Results</legend>
          <label>
            <span class="block">Final 3?</span>
            <select
              v-model="final3"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <span class="block">Win?</span>
            <select
              v-model="win"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
        </fieldset>
        <fieldset class="border rounded border-stone-500 p-4 my-3">
          <legend>Notes</legend>
          <textarea
            v-model="notes"
            class="block w-full border border-stone-500 rounded-md p-2"
            rows="5"
          ></textarea>
        </fieldset>
        <button
          type="submit"
          class="block w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded"
        >
          Add Game
        </button>
      </form>
    </section>
  </DashboardTemplate>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
definePageMeta({
  middleware: "auth",
});

useHead({
  title: "Add Game",
});

const router = useRouter();
const { roles } = useRoles();
const { baseScripts } = useScripts();

// Generate bindings for the v-model to connect to for the above inputs
const date = ref("");
const script = ref("");
const locationType = ref<"ONLINE" | "IN_PERSON">("IN_PERSON");
const location = ref("");
const playerCount = ref(0);
const initialCharacter = ref("");
const alignment = ref<"GOOD" | "EVIL">("GOOD");
const final3 = ref("false");
const win = ref("false");
const notes = ref("");

async function submitGame() {
  const { error } = await useFetch("/api/games", {
    method: "POST",
    body: JSON.stringify({
      date: dayjs(date.value).toISOString(),
      script: script.value,
      location_type: locationType.value,
      location: location.value,
      player_count: playerCount.value,
      player_characters: [
        {
          name: initialCharacter.value,
          alignment: alignment.value,
        },
      ],
      final3: final3.value === "true",
      win: win.value === "true",
      notes: notes.value,
    }),
  });

  if (error.value) {
    console.error(error.value);
  } else {
    router.push("/dashboard");
  }
}
</script>

<style scoped>
input,
select {
  color: black;
  height: 2.5rem;
}

textarea {
  color: black;
}

label {
  flex: 1 1 0%;
}
</style>
