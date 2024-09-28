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
    <List v-if="options.type === 'LIST'" :data="chartData" />
  </div>
</template>

<script setup lang="ts">
import { Bar, Pie, PolarArea } from "vue-chartjs";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";
import { WinStatus_V2 } from "~/composables/useGames";

extend([mixPlugin]);

const { Script, isBaseScript } = useScripts();

const colors = {
  townsfolk: "#3297F4",
  outsider: "#ADC9FA",
  minion: "#D08C7F",
  demon: "#8C0E12",
  traveler: "#6b21a8",

  good: "#3297F4",
  evil: "#8C0E12",

  win: "#008000",
  loss: "#A00A23",

  tb: "#A00A23",
  bmr: "#F4C43C",
  snv: "#944CAC",
  custom: "#008000",

  teensy: "#ADD8E6",
  small: "#0000FF",
  medium: "#800080",
  large: "#FF0000",
};

type DataType = "ROLE" | "ALIGNMENT" | "SCRIPT" | "GAME_SIZE" | "WIN";

const props = defineProps<{
  games: GameRecord[];
  options: {
    id?: number;
    title: string;
    type: string;
    pivot: DataType | null;
    data: DataType;
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

const chartData = computed(() => {
  const games = props.games.filter(
    (game) =>
      !game.ignore_for_stats &&
      !game.is_storyteller &&
      props.options.include_tags.every((tag) => game.tags.includes(tag)) &&
      props.options.exclude_tags.every((tag) => !game.tags.includes(tag))
  );

  if (props.options.data === "ROLE") {
    const townsfolk = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.role
          ?.type === "TOWNSFOLK"
    ).length;
    const outsider = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.role
          ?.type === "OUTSIDER"
    ).length;
    const minion = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.role
          ?.type === "MINION"
    ).length;
    const demon = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.role
          ?.type === "DEMON"
    ).length;
    const traveler = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.role
          ?.type === "TRAVELER"
    ).length;
    const total = townsfolk + outsider + minion + demon + traveler;
    return {
      labels: [
        `Townsfolk (${Math.round((townsfolk / total) * 100)}%)`,
        `Outsider (${Math.round((outsider / total) * 100)}%)`,
        `Minion (${Math.round((minion / total) * 100)}%)`,
        `Demon (${Math.round((demon / total) * 100)}%)`,
        `Traveler (${Math.round((traveler / total) * 100)}%)`,
      ],
      datasets: getPivot(
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
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "TRAVELER",
        ],
        [
          colors.townsfolk,
          colors.outsider,
          colors.minion,
          colors.demon,
          colors.traveler,
        ]
      ) ?? [
        {
          data: [townsfolk, outsider, minion, demon, traveler],
          backgroundColor: [
            colors.townsfolk,
            colors.outsider,
            colors.minion,
            colors.demon,
            colors.traveler,
          ],
        },
      ],
    };
  } else if (props.options.data === "ALIGNMENT") {
    const good = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.alignment ===
        "GOOD"
    ).length;
    const evil = games.filter(
      (game) =>
        game.player_characters[game.player_characters.length - 1]?.alignment ===
        "EVIL"
    ).length;
    const total = good + evil;
    return {
      labels: [
        `Good (${Math.round((good / total) * 100)}%)`,
        `Evil (${Math.round((evil / total) * 100)}%)`,
      ],
      datasets: getPivot(
        games,
        [
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "GOOD",
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "EVIL",
        ],
        [colors.good, colors.evil]
      ) ?? [
        {
          data: [good, evil],
          backgroundColor: [colors.good, colors.evil],
        },
      ],
    };
  } else if (props.options.data === "SCRIPT") {
    const troubleBrewing = games.filter(
      (game) => game.script === Script.TroubleBrewing
    ).length;
    const badMoonRising = games.filter(
      (game) => game.script === Script.BadMoonRising
    ).length;
    const sectsAndViolets = games.filter(
      (game) => game.script === Script.SectsAndViolets
    ).length;
    const customScript = games.filter(
      (game) => !isBaseScript(game.script)
    ).length;
    const total =
      troubleBrewing + badMoonRising + sectsAndViolets + customScript;
    return {
      labels: [
        `Trouble Brewing (${Math.round((troubleBrewing / total) * 100)}%)`,
        `Bad Moon Rising (${Math.round((badMoonRising / total) * 100)}%)`,
        `Sects and Violets (${Math.round((sectsAndViolets / total) * 100)}%)`,
        `Custom Script (${Math.round((customScript / total) * 100)}%)`,
      ],
      datasets: getPivot(
        games,
        [
          (game) => game.script === Script.TroubleBrewing,
          (game) => game.script === Script.BadMoonRising,
          (game) => game.script === Script.SectsAndViolets,
          (game) => !isBaseScript(game.script),
        ],
        [colors.tb, colors.bmr, colors.snv, colors.custom]
      ) ?? [
        {
          data: [troubleBrewing, badMoonRising, sectsAndViolets, customScript],
          backgroundColor: [colors.tb, colors.bmr, colors.snv, colors.custom],
        },
      ],
    };
  } else if (props.options.data === "GAME_SIZE") {
    const teensy = games.filter(
      (game) => game.player_count && game.player_count <= 6
    ).length;
    const small = games.filter(
      (game) =>
        game.player_count && game.player_count > 6 && game.player_count <= 10
    ).length;
    const medium = games.filter(
      (game) =>
        game.player_count && game.player_count > 10 && game.player_count <= 13
    ).length;
    const large = games.filter(
      (game) => game.player_count && game.player_count > 13
    ).length;
    const total = teensy + small + medium + large;
    return {
      labels: [
        `Teensy (${Math.round((teensy / total) * 100)}%)`,
        `1 Minion (${Math.round((small / total) * 100)}%)`,
        `2 Minions (${Math.round((medium / total) * 100)}%)`,
        `3 Minions (${Math.round((large / total) * 100)}%)`,
      ],
      datasets: getPivot(
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
        [colors.teensy, colors.small, colors.medium, colors.large]
      ) ?? [
        {
          data: [teensy, small, medium, large],
          backgroundColor: [
            colors.teensy,
            colors.small,
            colors.medium,
            colors.large,
          ],
        },
      ],
    };
  } else if (props.options.data === "WIN") {
    const win = games.filter((game) => {
      const lastAlignment =
        game.player_characters[game.player_characters.length - 1]?.alignment;

      return (
        (lastAlignment === "GOOD" && game.win_v2 === WinStatus_V2.GOOD_WINS) ||
        (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.EVIL_WINS)
      );
    }).length;
    const loss = games.filter((game) => {
      const lastAlignment =
        game.player_characters[game.player_characters.length - 1]?.alignment;

      return (
        (lastAlignment === "GOOD" && game.win_v2 === WinStatus_V2.EVIL_WINS) ||
        (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.GOOD_WINS)
      );
    }).length;
    const total = win + loss;
    return {
      labels: [
        `Win (${Math.round((win / total) * 100)}%)`,
        `Loss (${Math.round((loss / total) * 100)}%)`,
      ],
      datasets: getPivot(
        games,
        [
          (game) => {
            const lastAlignment =
              game.player_characters[game.player_characters.length - 1]
                ?.alignment;

            return (
              (lastAlignment === "GOOD" &&
                game.win_v2 === WinStatus_V2.GOOD_WINS) ||
              (lastAlignment === "EVIL" &&
                game.win_v2 === WinStatus_V2.EVIL_WINS)
            );
          },
          (game) => {
            const lastAlignment =
              game.player_characters[game.player_characters.length - 1]
                ?.alignment;

            return (
              (lastAlignment === "GOOD" &&
                game.win_v2 === WinStatus_V2.EVIL_WINS) ||
              (lastAlignment === "EVIL" &&
                game.win_v2 === WinStatus_V2.GOOD_WINS)
            );
          },
        ],
        [colors.win, colors.loss]
      ) ?? [
        {
          data: [win, loss],
          backgroundColor: [colors.win, colors.loss],
        },
      ],
    };
  }

  return {
    labels: [],
    datasets: [],
  };
});

function getPivot(
  games: GameRecord[],
  validators: ((game: GameRecord) => boolean)[],
  dataColors: string[]
) {
  if (props.options.pivot === null) return null;

  const getColor = (categoryColor: string) =>
    props.options.type === "BAR" ? categoryColor : dataColors;

  if (props.options.pivot === "ROLE") {
    const townsfolk = validators.map(
      (validator, index) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "TOWNSFOLK" && validator(game)
        ).length
    );
    const outsider = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "OUTSIDER" && validator(game)
        ).length
    );
    const minion = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "MINION" && validator(game)
        ).length
    );
    const demon = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "DEMON" && validator(game)
        ).length
    );
    const traveler = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]?.role
              ?.type === "TRAVELER" && validator(game)
        ).length
    );

    const total = [
      ...townsfolk,
      ...outsider,
      ...minion,
      ...demon,
      ...traveler,
    ].reduce((acc, curr) => acc + curr, 0);

    return [
      {
        label: `Townsfolk (${Math.round(
          (townsfolk.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: townsfolk,
        backgroundColor: getColor(colors.townsfolk),
      },
      {
        label: `Outsider (${Math.round(
          (outsider.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: outsider,
        backgroundColor: getColor(colors.outsider),
      },
      {
        label: `Minion (${Math.round(
          (minion.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: minion,
        backgroundColor: getColor(colors.minion),
      },
      {
        label: `Demon (${Math.round(
          (demon.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: demon,
        backgroundColor: getColor(colors.demon),
      },
      {
        label: `Traveler (${Math.round(
          (traveler.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: traveler,
        backgroundColor: getColor(colors.traveler),
      },
    ];
  } else if (props.options.pivot === "ALIGNMENT") {
    const good = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "GOOD" && validator(game)
        ).length
    );
    const evil = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_characters[game.player_characters.length - 1]
              ?.alignment === "EVIL" && validator(game)
        ).length
    );
    const total = [...good, ...evil].reduce((acc, curr) => acc + curr, 0);
    return [
      {
        label: `Good (${Math.round(
          (good.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: good,
        backgroundColor: getColor(colors.good),
      },
      {
        label: `Evil (${Math.round(
          (evil.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: evil,
        backgroundColor: getColor(colors.evil),
      },
    ];
  } else if (props.options.pivot === "SCRIPT") {
    const troubleBrewing = validators.map(
      (validator) =>
        games.filter(
          (game) => game.script === Script.TroubleBrewing && validator(game)
        ).length
    );
    const badMoonRising = validators.map(
      (validator) =>
        games.filter(
          (game) => game.script === Script.BadMoonRising && validator(game)
        ).length
    );
    const sectsAndViolets = validators.map(
      (validator) =>
        games.filter(
          (game) => game.script === Script.SectsAndViolets && validator(game)
        ).length
    );
    const customScript = validators.map(
      (validator) =>
        games.filter((game) => !isBaseScript(game.script) && validator(game))
          .length
    );
    const total = [
      ...troubleBrewing,
      ...badMoonRising,
      ...sectsAndViolets,
      ...customScript,
    ].reduce((acc, curr) => acc + curr, 0);
    return [
      {
        label: `Trouble Brewing (${Math.round(
          (troubleBrewing.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: troubleBrewing,
        backgroundColor: getColor(colors.tb),
      },
      {
        label: `Bad Moon Rising (${Math.round(
          (badMoonRising.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: badMoonRising,
        backgroundColor: getColor(colors.bmr),
      },
      {
        label: `Sects and Violets (${Math.round(
          (sectsAndViolets.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: sectsAndViolets,
        backgroundColor: getColor(colors.snv),
      },
      {
        label: `Custom Script (${Math.round(
          (customScript.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: customScript,
        backgroundColor: getColor(colors.custom),
      },
    ];
  } else if (props.options.pivot === "GAME_SIZE") {
    const teensy = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_count && game.player_count <= 6 && validator(game)
        ).length
    );
    const small = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_count &&
            game.player_count > 6 &&
            game.player_count <= 10 &&
            validator(game)
        ).length
    );
    const medium = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_count &&
            game.player_count > 10 &&
            game.player_count <= 13 &&
            validator(game)
        ).length
    );
    const large = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            game.player_count && game.player_count > 13 && validator(game)
        ).length
    );
    const total = [...teensy, ...small, ...medium, ...large].reduce(
      (acc, curr) => acc + curr,
      0
    );
    return [
      {
        label: `Teensy (${Math.round(
          (teensy.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: teensy,
        backgroundColor: getColor(colors.teensy),
      },
      {
        label: `1 Minion (${Math.round(
          (small.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: small,
        backgroundColor: getColor(colors.small),
      },
      {
        label: `2 Minions (${Math.round(
          (medium.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: medium,
        backgroundColor: getColor(colors.medium),
      },
      {
        label: `3 Minions (${Math.round(
          (large.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: large,
        backgroundColor: getColor(colors.large),
      },
    ];
  } else if (props.options.pivot === "WIN") {
    const win = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastAlignment =
            game.player_characters[game.player_characters.length - 1]
              ?.alignment;

          return (
            ((lastAlignment === "GOOD" &&
              game.win_v2 === WinStatus_V2.GOOD_WINS) ||
              (lastAlignment === "EVIL" &&
                game.win_v2 === WinStatus_V2.EVIL_WINS)) &&
            validator(game)
          );
        }).length
    );
    const loss = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastAlignment =
            game.player_characters[game.player_characters.length - 1]
              ?.alignment;

          return (
            ((lastAlignment === "GOOD" &&
              game.win_v2 === WinStatus_V2.EVIL_WINS) ||
              (lastAlignment === "EVIL" &&
                game.win_v2 === WinStatus_V2.GOOD_WINS)) &&
            validator(game)
          );
        }).length
    );
    const total = [...win, ...loss].reduce((acc, curr) => acc + curr, 0);
    return [
      {
        label: `Win (${Math.round(
          (win.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: win,
        backgroundColor: getColor(colors.win),
      },
      {
        label: `Loss (${Math.round(
          (loss.reduce((acc, curr) => acc + curr, 0) / total) * 100
        )}%)`,
        data: loss,
        backgroundColor: getColor(colors.loss),
      },
    ];
  }

  return null;
}

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales:
    props.options.type === "PIE" || props.options.type === "POLAR_AREA"
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
  max-width: v-bind(width);
  max-height: v-bind(height);
}
</style>
