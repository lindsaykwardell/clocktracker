<template>
  <div class="chart-container">
    <div class="flex gap-2 justify-center mb-2 lg:mb-4">
      <div class="font-sorts text-center text-lg lg:text-xl">
        {{ options.title }}
      </div>
      <div v-if="showControls" class="flex gap-1 chart-actions">
        <nuxt-link 
          :to="`/charts/editor?chart_id=${options.id}`"
          class="flex inline-flex items-center"
          title="Edit chart"
        >
          <IconUI id="edit" :rounded="true" size="sm" />
        </nuxt-link>
        <button 
          @click="emit('deleteChart', options.id)"
          title="Delete chart"
        >
          <IconUI id="x-lg" :rounded="true" size="sm" />
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
    <List 
      v-if="options.type === 'LIST'" 
      :data="chartData" 
    />
  </div>
</template>

<script setup lang="ts">
import { Bar, Pie, PolarArea } from "vue-chartjs";
import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";

extend([mixPlugin]);

const { Script, isBaseScript } = useScripts();
const me = useMe()

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
    storyteller_only?: boolean;
  };
  showControls?: boolean;
}>();

function is_storyteller(game: GameRecord) {
  if (me.value.status !== Status.SUCCESS) return false;
  return game.is_storyteller || game.storyteller === me.value.data.username || game.co_storytellers.includes(me.value.data.username)
} 

const emit = defineEmits(["deleteChart"]);

const width = computed(() => (props.options.width || 250) + "px");
const height = computed(() => (props.options.height || 250) + "px");

const chartData = computed(() => {
  // Base filter for all games
    const baseFilteredGames = props.games.filter((game) => {
    if (game.ignore_for_stats) return false;

    // Tag filters
    if (!props.options.include_tags.every((tag) => game.tags.includes(tag))) {
      return false;
    }

    if (!props.options.exclude_tags.every((tag) => !game.tags.includes(tag))) {
      return false;
    }

    // Split storyteller vs non-storyteller completely
    if (props.options.storyteller_only) {
      // Only storyteller / co-storyteller games
      return is_storyteller(game);
    }

    // Only non-storyteller games for player stats
    return !is_storyteller(game);
  });

  // Filter games based on the data type we're displaying
  const games = baseFilteredGames.filter((game) => {
    const lastCharacter =
      game.player_characters[game.player_characters.length - 1];

    switch (props.options.data) {
      case "ROLE":
        // For storyteller games, we don't need a character - they're counted separately
        return is_storyteller(game) || !!lastCharacter?.role?.type;
      case "ALIGNMENT":
        return !!lastCharacter?.alignment;
      case "WIN":
        // For storyteller games, we don't need a character - they're counted separately
        if (props.options.storyteller_only) {
          return !!game.win_v2;
        }

        return !!lastCharacter?.alignment && !!game.win_v2;
      default:
        return true;
    }
  });

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
    const storyteller = games.filter((game) => is_storyteller(game)).length;
    const total =
      townsfolk + outsider + minion + demon + traveler + storyteller;
    return {
      labels: [
        `Townsfolk`,
        `Outsider`,
        `Minion`,
        `Demon`,
        `Traveler`,
        `Storyteller`,
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
          (game) => is_storyteller(game),
        ],
        [
          chartColors.townsfolk,
          chartColors.outsider,
          chartColors.minion,
          chartColors.demon,
          chartColors.traveler,
          chartColors.storyteller,
        ]
      ) ?? [
        {
          data: [townsfolk, outsider, minion, demon, traveler, storyteller],
          backgroundColor: [
            chartColors.townsfolk,
            chartColors.outsider,
            chartColors.minion,
            chartColors.demon,
            chartColors.traveler,
            chartColors.storyteller,
          ],
        },
      ],
    };
  } else if (props.options.data === "ALIGNMENT") {
    const good = games.filter((game) => {
      const lastCharacter =
        game.player_characters[game.player_characters.length - 1];
      return lastCharacter?.alignment === "GOOD";
    }).length;
    const evil = games.filter((game) => {
      const lastCharacter =
        game.player_characters[game.player_characters.length - 1];
      return lastCharacter?.alignment === "EVIL";
    }).length;
    const total = good + evil;
    return {
      labels: [`Good`, `Evil`],
      datasets: getPivot(
        games,
        [
          (game) => {
            const lastCharacter =
              game.player_characters[game.player_characters.length - 1];
            return lastCharacter?.alignment === "GOOD";
          },
          (game) => {
            const lastCharacter =
              game.player_characters[game.player_characters.length - 1];
            return lastCharacter?.alignment === "EVIL";
          },
        ],
        [chartColors.good, chartColors.evil]
      ) ?? [
        {
          data: [good, evil],
          backgroundColor: [chartColors.good, chartColors.evil],
        },
      ],
    };
  } else if (props.options.data === "SCRIPT") {
    // Base script
    const troubleBrewing = games.filter(
      (game) => game.script === Script.TroubleBrewing
    ).length;
    const badMoonRising = games.filter(
      (game) => game.script === Script.BadMoonRising
    ).length;
    const sectsAndViolets = games.filter(
      (game) => game.script === Script.SectsAndViolets
    ).length;

    // Custom scripts
    const customScript = games.filter(
      (game) =>
        !!game.script &&
        game.script.trim().length > 0 &&
        !isBaseScript(game.script)
    ).length;

    // No script / empty script
    const unknownScript = games.filter(
      (game) => !game.script || !game.script.trim().length
    ).length;

    // @todo Is this still relevant? Seems unused.
    const total = troubleBrewing + badMoonRising + sectsAndViolets + customScript + unknownScript;

    return {
      labels: [
        `Trouble Brewing`,
        `Bad Moon Rising`,
        `Sects & Violets`,
        `Custom`,
        `Unknown`,
      ],
      datasets: getPivot(
        games,
        [
          (game) => game.script === Script.TroubleBrewing,
          (game) => game.script === Script.BadMoonRising,
          (game) => game.script === Script.SectsAndViolets,
          (game) =>
            !!game.script &&
            game.script.trim().length > 0 &&
            !isBaseScript(game.script),
          (game) => !game.script || !game.script.trim().length,
        ],
        [chartColors.tb, chartColors.bmr, chartColors.snv, chartColors.custom, chartColors.unknown]
      ) ?? [
        {
          data: [troubleBrewing, badMoonRising, sectsAndViolets, customScript, unknownScript],
          backgroundColor: [chartColors.tb, chartColors.bmr, chartColors.snv, chartColors.custom, chartColors.unknown],
        },
      ],
    };
  } else if (props.options.data === "GAME_SIZE") {
    const teensy = games.filter(
      (game) => game.player_count && game.player_count <= 6
    ).length;
    const small = games.filter(
      (game) =>
        game.player_count && game.player_count > 6 && game.player_count < 10
    ).length;
    const medium = games.filter(
      (game) =>
        game.player_count && game.player_count >= 10 && game.player_count < 13
    ).length;
    const large = games.filter(
      (game) => game.player_count && game.player_count >= 13
    ).length;
    const total = teensy + small + medium + large;
    return {
      labels: [`Teensy`, `1 Minion`, `2 Minions`, `3 Minions`],
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
        [chartColors.teensy, chartColors.small, chartColors.medium, chartColors.large]
      ) ?? [
        {
          data: [teensy, small, medium, large],
          backgroundColor: [
            chartColors.teensy,
            chartColors.small,
            chartColors.medium,
            chartColors.large,
          ],
        },
      ],
    };
  } else if (props.options.data === "WIN") {
    // For storyteller games, show good vs evil wins instead of personal win/loss
    if (props.options.storyteller_only) {
      const goodWins = games.filter(
        (game) => game.win_v2 === WinStatus_V2.GOOD_WINS
      ).length;
      const evilWins = games.filter(
        (game) => game.win_v2 === WinStatus_V2.EVIL_WINS
      ).length;
      const total = goodWins + evilWins;
      return {
        labels: [`Good Wins`, `Evil Wins`],
        datasets: getPivot(
          games,
          [
            (game) => game.win_v2 === WinStatus_V2.GOOD_WINS,
            (game) => game.win_v2 === WinStatus_V2.EVIL_WINS,
          ],
          [chartColors.good, chartColors.evil]
        ) ?? [
          {
            data: [goodWins, evilWins],
            backgroundColor: [chartColors.good, chartColors.evil],
          },
        ],
      };
    } else {
      // Original logic for player games (personal win/loss)
      const win = games.filter((game) => {
        const lastAlignment =
          game.player_characters[game.player_characters.length - 1]?.alignment;

        return (
          (lastAlignment === "GOOD" &&
            game.win_v2 === WinStatus_V2.GOOD_WINS) ||
          (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.EVIL_WINS)
        );
      }).length;
      const loss = games.filter((game) => {
        const lastAlignment =
          game.player_characters[game.player_characters.length - 1]?.alignment;

        return (
          (lastAlignment === "GOOD" &&
            game.win_v2 === WinStatus_V2.EVIL_WINS) ||
          (lastAlignment === "EVIL" && game.win_v2 === WinStatus_V2.GOOD_WINS)
        );
      }).length;
      const total = win + loss;
      return {
        labels: [`Win`, `Loss`],
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
          [chartColors.win, chartColors.loss]
        ) ?? [
          {
            data: [win, loss],
            backgroundColor: [chartColors.win, chartColors.loss],
          },
        ],
      };
    }
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
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.role?.type === "TOWNSFOLK" && validator(game);
        }).length
    );
    const outsider = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.role?.type === "OUTSIDER" && validator(game);
        }).length
    );
    const minion = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.role?.type === "MINION" && validator(game);
        }).length
    );
    const demon = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.role?.type === "DEMON" && validator(game);
        }).length
    );
    const traveler = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.role?.type === "TRAVELER" && validator(game);
        }).length
    );
    const storyteller = validators.map(
      (validator) =>
        games.filter((game) => game.is_storyteller && validator(game)).length
    );

    const total = [
      ...townsfolk,
      ...outsider,
      ...minion,
      ...demon,
      ...traveler,
      ...storyteller,
    ].reduce((acc, curr) => acc + curr, 0);

    return [
      {
        label: `Townsfolk`,
        data: townsfolk,
        backgroundColor: getColor(chartColors.townsfolk),
      },
      {
        label: `Outsider`,
        data: outsider,
        backgroundColor: getColor(chartColors.outsider),
      },
      {
        label: `Minion`,
        data: minion,
        backgroundColor: getColor(chartColors.minion),
      },
      {
        label: `Demon`,
        data: demon,
        backgroundColor: getColor(chartColors.demon),
      },
      {
        label: `Traveler`,
        data: traveler,
        backgroundColor: getColor(chartColors.traveler),
      },
      {
        label: `Storyteller`,
        data: storyteller,
        backgroundColor: getColor(chartColors.storyteller),
      },
    ];
  } else if (props.options.pivot === "ALIGNMENT") {
    const good = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.alignment === "GOOD" && validator(game);
        }).length
    );
    const evil = validators.map(
      (validator) =>
        games.filter((game) => {
          const lastCharacter =
            game.player_characters[game.player_characters.length - 1];
          return lastCharacter?.alignment === "EVIL" && validator(game);
        }).length
    );
    const total = [...good, ...evil].reduce((acc, curr) => acc + curr, 0);
    return [
      {
        label: `Good`,
        data: good,
        backgroundColor: getColor(chartColors.good),
      },
      {
        label: `Evil`,
        data: evil,
        backgroundColor: getColor(chartColors.evil),
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
        games.filter(
          (game) =>
            !!game.script &&
            game.script.trim().length > 0 &&
            !isBaseScript(game.script) &&
            validator(game)
        ).length
    );

    const unknownScript = validators.map(
      (validator) =>
        games.filter(
          (game) =>
            (!game.script || !game.script.trim().length) && validator(game)
        ).length
    );
    const total = [
      ...troubleBrewing,
      ...badMoonRising,
      ...sectsAndViolets,
      ...customScript,
      ...unknownScript,
    ].reduce((acc, curr) => acc + curr, 0);
    return [
      {
        label: `Trouble Brewing`,
        data: troubleBrewing,
        backgroundColor: getColor(chartColors.tb),
      },
      {
        label: `Bad Moon Rising`,
        data: badMoonRising,
        backgroundColor: getColor(chartColors.bmr),
      },
      {
        label: `Sects and Violets`,
        data: sectsAndViolets,
        backgroundColor: getColor(chartColors.snv),
      },
      {
        label: `Custom Script`,
        data: customScript,
        backgroundColor: getColor(chartColors.custom),
      },
      {
        label: `Unknown Script`,
        data: unknownScript,
        backgroundColor: getColor(chartColors.unknown),
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
        label: `Teensy`,
        data: teensy,
        backgroundColor: getColor(chartColors.teensy),
      },
      {
        label: `1 Minion`,
        data: small,
        backgroundColor: getColor(chartColors.small),
      },
      {
        label: `2 Minions`,
        data: medium,
        backgroundColor: getColor(chartColors.medium),
      },
      {
        label: `3 Minions`,
        data: large,
        backgroundColor: getColor(chartColors.large),
      },
    ];
  } else if (props.options.pivot === "WIN") {
    // For storyteller games, show good vs evil wins instead of personal win/loss
    if (props.options.storyteller_only) {
      const goodWins = validators.map(
        (validator) =>
          games.filter(
            (game) => game.win_v2 === WinStatus_V2.GOOD_WINS && validator(game)
          ).length
      );
      const evilWins = validators.map(
        (validator) =>
          games.filter(
            (game) => game.win_v2 === WinStatus_V2.EVIL_WINS && validator(game)
          ).length
      );
      const total = [...goodWins, ...evilWins].reduce(
        (acc, curr) => acc + curr,
        0
      );
      return [
        {
          label: `Good Wins`,
          data: goodWins,
          backgroundColor: getColor(chartColors.good),
        },
        {
          label: `Evil Wins`,
          data: evilWins,
          backgroundColor: getColor(chartColors.evil),
        },
      ];
    } else {
      // Original logic for player games (personal win/loss)
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
          label: `Win`,
          data: win,
          backgroundColor: getColor(chartColors.win),
        },
        {
          label: `Loss`,
          data: loss,
          backgroundColor: getColor(chartColors.loss),
        },
      ];
    }
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
