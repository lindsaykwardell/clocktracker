<template>
  <div class="chart-container">
    <div class="flex gap-2 justify-center">
      <div class="text-xl font-dumbledor text-center">{{ options.title }}</div>
      <div v-if="showControls" class="flex gap-2">
        <nuxt-link :to="`/charts/editor?chart_id=${options.id}`">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
          >
            <path
              fill="currentColor"
              d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z"
            />
          </svg>
        </nuxt-link>
        <button @click="emit('deleteChart', options.id)">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 512 512"
          >
            <path
              d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
              fill="currentColor"
            />
            <path d="M249 160h14v241h-14z" fill="currentColor" />
            <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
            <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
    <Bar
      v-if="options.type === 'BAR'"
      :data="chartData"
      :options="chartOptions"
    />
    <Pie
      v-if="options.type === 'PIE'"
      :data="chartData"
      :options="chartOptions"
    />
    <PolarArea
      v-if="options.type === 'POLAR_AREA'"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { GameRecord, WinStatus } from "~/composables/useGames";
import { Bar, Pie, PolarArea } from "vue-chartjs";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";

extend([mixPlugin]);
const { Script, isBaseScript } = useScripts();

const props = defineProps<{
  games: GameRecord[];
  options: {
    id?: number;
    title: string;
    type: string;
    pivot: "ROLE" | "ALIGNMENT" | "SCRIPT" | "GAME_SIZE" | "WIN" | null;
    data: "ROLE" | "ALIGNMENT" | "SCRIPT" | "GAME_SIZE" | "WIN";
    include_tags: string[];
    exclude_tags: string[];
    width: number;
    height: number;
  };
  showControls?: boolean;
}>();

const emit = defineEmits(["deleteChart"]);

const width = computed(() => (props.options.width || 250) + "px");
const height = computed(() => (props.options.height || 250) + "px");

const labels = computed(() => {
  if (props.options.data === "ROLE") {
    return ["Townsfolk", "Outsider", "Minion", "Demon"];
  } else if (props.options.data === "ALIGNMENT") {
    return ["Good", "Evil"];
  } else if (props.options.data === "SCRIPT") {
    return [
      "Trouble Brewing",
      "Bad Moon Rising",
      "Sects and Violets",
      "Custom Script",
    ];
  } else if (props.options.data === "GAME_SIZE") {
    return ["Teensy", "1 Minion", "2 Minions", "3 Minions"];
  } else if (props.options.data === "WIN") {
    return ["Yes", "No"];
  } else {
    return [];
  }
});

const datasets = computed(() => {
  const games = props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      !game.is_storyteller &&
      props.options.include_tags.every((tag) => game.tags.includes(tag)) &&
      props.options.exclude_tags.every((tag) => !game.tags.includes(tag))
  );

  if (props.options.data === "ROLE") {
    return (
      getPivot(
        games,
        [
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "TOWNSFOLK",
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "OUTSIDER",
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "MINION",
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "DEMON",
        ],
        [
          (c) => colord(c).mix(colord("#0000FF"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#ADD8E6"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FFC0CB"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "TOWNSFOLK"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "OUTSIDER"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "MINION"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "DEMON"
            ).length,
          ],
          backgroundColor: ["#0000FF", "#ADD8E6", "#FFC0CB", "#FF0000"],
        },
      ]
    );
  } else if (props.options.data === "ALIGNMENT") {
    return (
      getPivot(
        games,
        [
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "GOOD",
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "EVIL",
        ],
        [
          (c) => colord(c).mix(colord("#0000FF"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  ?.alignment === "GOOD"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  ?.alignment === "EVIL"
            ).length,
          ],
          backgroundColor: ["#0000FF", "#FF0000"],
        },
      ]
    );
  } else if (props.options.data === "SCRIPT") {
    return (
      getPivot(
        games,
        [
          (game) => game.script === Script.TroubleBrewing,
          (game) => game.script === Script.BadMoonRising,
          (game) => game.script === Script.SectsAndViolets,
          (game) => isBaseScript(game.script),
        ],
        [
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FFFF00"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#800080"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#008000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter((game) => game.script === Script.TroubleBrewing)
              .length,
            games.filter((game) => game.script === Script.BadMoonRising).length,
            games.filter((game) => game.script === Script.SectsAndViolets)
              .length,
            games.filter((game) => isBaseScript(game.script)).length,
          ],
          backgroundColor: ["#FF0000", "#FFFF00", "#800080", "#008000"],
        },
      ]
    );
  } else if (props.options.data === "GAME_SIZE") {
    return (
      getPivot(
        games,
        [
          (game) => !!game.player_count && game.player_count <= 6,
          (game) =>
            !!game.player_count &&
            game.player_count > 6 &&
            game.player_count <= 10,
          (game) =>
            !!game.player_count &&
            game.player_count > 10 &&
            game.player_count <= 13,
          (game) => !!game.player_count && game.player_count > 13,
        ],
        [
          (c) => colord(c).mix(colord("#ADD8E6"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#0000FF"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#800080"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter((game) => game.player_count && game.player_count <= 6)
              .length,
            games.filter(
              (game) =>
                game.player_count &&
                game.player_count > 6 &&
                game.player_count <= 10
            ).length,
            games.filter(
              (game) =>
                game.player_count &&
                game.player_count > 10 &&
                game.player_count <= 13
            ).length,
            games.filter((game) => game.player_count && game.player_count > 13)
              .length,
          ],
          backgroundColor: ["#ADD8E6", "#0000FF", "#800080", "#FF0000"],
        },
      ]
    );
  } else if (props.options.data === "WIN") {
    return (
      getPivot(
        games,
        [
          (game) => game.win === WinStatus.WIN,
          (game) => game.win === WinStatus.LOSS,
        ],
        [
          (c) => colord(c).mix(colord("#0000FF"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter((game) => game.win === WinStatus.WIN).length,
            games.filter((game) => game.win === WinStatus.LOSS).length,
          ],
          backgroundColor: ["#0000FF", "#FF0000"],
        },
      ]
    );
  }

  return [];
});

function getPivot(
  games: GameRecord[],
  validators: ((game: GameRecord) => boolean)[],
  mixColors: ((color: string) => string)[]
) {
  if (props.options.pivot === "ROLE") {
    return [
      {
        label: "Townsfolk",
        data: validators.map(
          (validator, index) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "TOWNSFOLK" && validator(game)
            ).length
        ),
        backgroundColor: "#0000FF",
      },
      {
        label: "Outsider",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "OUTSIDER" && validator(game)
            ).length
        ),
        backgroundColor: "#ADD8E6",
      },
      {
        label: "Minion",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "MINION" && validator(game)
            ).length
        ),
        backgroundColor: "#FFC0CB",
      },
      {
        label: "Demon",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]?.role
                  ?.type === "DEMON" && validator(game)
            ).length
        ),
        backgroundColor: "#FF0000",
      },
    ];
  } else if (props.options.pivot === "ALIGNMENT") {
    return [
      {
        label: "Good",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  ?.alignment === "GOOD" && validator(game)
            ).length
        ),
        backgroundColor: "#0000FF",
      },
      {
        label: "Evil",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  ?.alignment === "EVIL" && validator(game)
            ).length
        ),
        backgroundColor: "#FF0000",
      },
    ];
  } else if (props.options.pivot === "SCRIPT") {
    return [
      {
        label: "Trouble Brewing",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.script === Script.TroubleBrewing && validator(game)
            ).length
        ),
        backgroundColor: "#FF0000",
      },
      {
        label: "Bad Moon Rising",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.script === Script.BadMoonRising && validator(game)
            ).length
        ),
        backgroundColor: "#FFFF00",
      },
      {
        label: "Sects and Violets",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.script === Script.SectsAndViolets && validator(game)
            ).length
        ),
        backgroundColor: "#800080",
      },
      {
        label: "Custom Script",
        data: validators.map(
          (validator) =>
            games.filter((game) => isBaseScript(game.script) && validator(game))
              .length
        ),
        backgroundColor: "#008000",
      },
    ];
  } else if (props.options.pivot === "GAME_SIZE") {
    return [
      {
        label: "Teensy",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_count && game.player_count <= 6 && validator(game)
            ).length
        ),
        backgroundColor: "#ADD8E6",
      },
      {
        label: "1 Minion",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_count &&
                game.player_count > 6 &&
                game.player_count <= 10 &&
                validator(game)
            ).length
        ),
        // Blue
        backgroundColor: "#0000FF",
      },
      {
        label: "2 Minions",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_count &&
                game.player_count > 10 &&
                game.player_count <= 13 &&
                validator(game)
            ).length
        ),
        // Purple
        backgroundColor: "#800080",
      },
      {
        label: "3 Minions",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_count && game.player_count > 13 && validator(game)
            ).length
        ),
        // Red
        backgroundColor: "#FF0000",
      },
    ];
  } else if (props.options.pivot === "WIN") {
    return [
      {
        label: "Yes",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.win === WinStatus.WIN && validator(game)
            ).length
        ),
        backgroundColor: "#0000FF",
      },
      {
        label: "No",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.win === WinStatus.LOSS && validator(game)
            ).length
        ),
        backgroundColor: "#FF0000",
      },
    ];
  }

  return null;
}

const chartData = computed(() => ({
  labels: labels.value,
  datasets: datasets.value,
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales:
    props.options.type === "PIE" ||
    props.options.type === "POLAR_AREA"
      ? undefined
      : {
          x: {
            stacked: true,
            ticks: {
              min: 0,
              stepSize: 1,
              max: 4,
            },
          },
          y: {
            stacked: true,
            ticks: {
              min: 0,
              stepSize: 1,
              max: 4,
            },
          },
        },
  plugins: {
    legend: {
      display: false,
    },
  },
}));
</script>

<style scoped>
.chart-container {
  width: v-bind(width);
  height: v-bind(height);
}
</style>
