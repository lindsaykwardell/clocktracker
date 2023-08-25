<template>
  <div>
    <Bar
      v-if="options.type === 'bar'"
      :data="chartData"
      :options="chartOptions"
    />
    <Pie
      v-if="options.type === 'pie'"
      :data="chartData"
      :options="chartOptions"
    />
    <PolarArea
      v-if="options.type === 'polar'"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { GameRecord } from "composables/useGames";
import { Bar, Pie, PolarArea } from "vue-chartjs";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";

extend([mixPlugin]);
const { Script, isBaseScript } = useScripts();

const props = defineProps<{
  games: GameRecord[];
  options: {
    type: string;
    pivot: "role" | "alignment" | "script" | "game_size" | "win" | null;
    data_field: "role" | "alignment" | "script" | "game_size" | "win";
  };
}>();

function getLabels(type: string) {
  if (type === "role") {
    return ["Townsfolk", "Outsider", "Minion", "Demon"];
  } else if (type === "alignment") {
    return ["Good", "Evil"];
  } else if (type === "script") {
    return [
      "Trouble Brewing",
      "Bad Moon Rising",
      "Sects and Violets",
      "Custom Script",
    ];
  } else if (type === "game_size") {
    return ["Teensey", "1 Minion", "2 Minions", "3 Minions"];
  } else if (type === "win") {
    return ["Yes", "No"];
  } else {
    return [];
  }
}

const datasets = computed(() => {
  const games = props.games.filter(
    (game) => !game.ignore_for_stats && !game.is_storyteller
  );

  if (props.options.data_field === "role") {
    return (
      getPivot(
        games,
        [
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "TOWNSFOLK",
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "OUTSIDER",
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
              ?.type === "MINION",
          (game) =>
            game.player_characters[game.player_characters.length - 1].role
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
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "TOWNSFOLK"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "OUTSIDER"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "MINION"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "DEMON"
            ).length,
          ],
          backgroundColor: ["#0000FF", "#ADD8E6", "#FFC0CB", "#FF0000"],
        },
      ]
    );
  } else if (props.options.data_field === "alignment") {
    return (
      getPivot(
        games,
        [
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "GOOD",
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              .alignment === "EVIL",
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
                  .alignment === "GOOD"
            ).length,
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  .alignment === "EVIL"
            ).length,
          ],
          backgroundColor: ["#0000FF", "#FF0000"],
        },
      ]
    );
  } else if (props.options.data_field === "script") {
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
  } else if (props.options.data_field === "game_size") {
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
  } else if (props.options.data_field === "win") {
    return (
      getPivot(
        games,
        [(game) => game.win, (game) => !game.win],
        [
          (c) => colord(c).mix(colord("#0000FF"), 0.15).toHex(),
          (c) => colord(c).mix(colord("#FF0000"), 0.15).toHex(),
        ]
      ) ?? [
        {
          data: [
            games.filter((game) => game.win).length,
            games.filter((game) => !game.win).length,
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
  if (props.options.pivot === "role") {
    return [
      {
        label: "Townsfolk",
        data: validators.map(
          (validator, index) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "TOWNSFOLK" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#0000FF")),
      },
      {
        label: "Outsider",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "OUTSIDER" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#ADD8E6")),
      },
      {
        label: "Minion",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "MINION" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FFC0CB")),
      },
      {
        label: "Demon",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1].role
                  ?.type === "DEMON" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FF0000")),
      },
    ];
  } else if (props.options.pivot === "alignment") {
    return [
      {
        label: "Good",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  .alignment === "GOOD" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#0000FF")),
      },
      {
        label: "Evil",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_characters[game.player_characters.length - 1]
                  .alignment === "EVIL" && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FF0000")),
      },
    ];
  } else if (props.options.pivot === "script") {
    return [
      {
        label: "Trouble Brewing",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.script === Script.TroubleBrewing && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FF0000")),
      },
      {
        label: "Bad Moon Rising",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) => game.script === Script.BadMoonRising && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FFFF00")),
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
        backgroundColor: mixColors.map((mixColor) => mixColor("#800080")),
      },
      {
        label: "Custom Script",
        data: validators.map(
          (validator) =>
            games.filter((game) => isBaseScript(game.script) && validator(game))
              .length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#008000")),
      },
    ];
  } else if (props.options.pivot === "game_size") {
    return [
      {
        label: "Teensey",
        data: validators.map(
          (validator) =>
            games.filter(
              (game) =>
                game.player_count && game.player_count <= 6 && validator(game)
            ).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#ADD8E6")),
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
        backgroundColor: mixColors.map((mixColor) => mixColor("#0000FF")),
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
        backgroundColor: mixColors.map((mixColor) => mixColor("#800080")),
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
        backgroundColor: mixColors.map((mixColor) => mixColor("#FF0000")),
      },
    ];
  } else if (props.options.pivot === "win") {
    return [
      {
        label: "Yes",
        data: validators.map(
          (validator) =>
            games.filter((game) => game.win && validator(game)).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#0000FF")),
      },
      {
        label: "No",
        data: validators.map(
          (validator) =>
            games.filter((game) => !game.win && validator(game)).length
        ),
        backgroundColor: mixColors.map((mixColor) => mixColor("#FF0000")),
      },
    ];
  }

  return null;
}

const chartData = computed(() => ({
  labels: getLabels(props.options.data_field),
  datasets: datasets.value.map((dataset) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor,
  })),
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
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
