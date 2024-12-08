<template>
  <FullScreen v-if="data">
    <section class="gap-5">
      <img
        src="/logo.png"
        alt="ClockTracker Logo"
        class="w-40 md:w-52 pb-8 md:pb-20"
      />
      <h1 class="text-center font-dumbledor">
        <span class="text-3xl md:text-5xl">ClockTracker</span> <br />
        <span class="text-2xl md:text-4xl">Year in Review</span> <br />
        <span class="text-xl md:text-3xl">{{ data.year }}</span>
      </h1>
      <Avatar :value="data.avatar" size="lg" />
      <h2 class="text-center font-dumbledor text-2xl md:text-3xl">
        {{ data.display_name }}
      </h2>
    </section>
    <section
      class="gap-20"
      :class="{
        'bg-red-950': mostCommonRole?.role.initial_alignment === 'EVIL',
        'bg-blue-950': mostCommonRole?.role.initial_alignment === 'GOOD',
      }"
    >
      <h3 class="text-center font-dumbledor text-4xl">Games Played</h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center w-2/3">
          <div class="text-xl md:text-3xl md:w-2/3">
            You played {{ data.games_played }}
            {{ data.games_played === 1 ? "game" : "games" }} this year, which is
            <span
              >{{
                Math.round(data.games_played - data.average_games_played)
              }}%</span
            >
            {{
              data.games_played - data.average_games_played > 0
                ? "more"
                : "less"
            }}
            than the average of
            {{ Math.round(data.average_games_played) }}.
          </div>
        </div>
        <div class="flex justify-center flex-col items-center md:w-1/3">
          <Token
            :character="{
              name: mostCommonRole?.role.name,
              role: mostCommonRole?.role,
            }"
            :size="gamesPlayedTokenSize"
          />
          <div class="md:text-2xl text-center">
            Your most common role was {{ mostCommonRole?.role.name }}
          </div>
        </div>
      </div>
    </section>
    <section v-if="data.games_storytold > 0" class="gap-20 bg-primary-darkest">
      <h3 class="text-center font-dumbledor text-4xl">Storytelling</h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center md:w-2/3">
          <div class="text-xl md:text-3xl md:w-2/3">
            You were storyteller in {{ data.games_storytold }}
            {{ data.games_storytold === 1 ? "game" : "games" }} this year, which
            is
            <span
              >{{
                Math.round(data.games_storytold - data.average_games_storytold)
              }}%</span
            >
            {{
              data.games_storytold - data.average_games_storytold > 0
                ? "more"
                : "less"
            }}
            than the average of
            {{ Math.round(data.average_games_storytold) }}.
          </div>
        </div>
        <div class="flex justify-center flex-col items-center md:w-1/3">
          <img
            v-if="mostCommonlyStorytoldScript"
            :src="getScriptLogo(mostCommonlyStorytoldScript)"
            class="w-36 h-36 md:w-48 md:h-48"
          />
          <div class="md:text-2xl text-center">
            Your most common script to storytell was
            {{ mostCommonlyStorytoldScript?.script }}
          </div>
        </div>
      </div>
    </section>
    <section
      class="gap-20"
      :class="{
        'bg-blue-900':
          Math.round((data.win_rate / data.games_played) * 100) > 0.5,
        'bg-red-900':
          Math.round((data.win_rate / data.games_played) * 100) < 0.5,
      }"
    >
      <h3 class="text-center font-dumbledor text-4xl">Win / Loss</h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center md:w-2/3 flex flex-col gap-5">
          <div class="text-xl md:text-3xl md:w-2/3">
            You won {{ data.win_rate }} games and lost
            {{ data.loss_rate }} games this year, for an average of a
            {{ Math.round((data.win_rate / data.games_played) * 100) }}% win
            rate.
          </div>
          <div class="text-xl md:text-3xl md:w-2/3">
            You won {{ data.win_rate_good }} games as a good character and
            {{ data.win_rate_evil }} games as an evil character.
          </div>
          <div class="text-xl md:text-3xl md:w-2/3">
            You won the most games in {{ wonMostInMonth?.month }} with
            {{ wonMostInMonth?.win }} wins. Keep it up!
          </div>
        </div>
        <div class="flex justify-center flex-col items-center md:w-1/3 gap-5">
          <div class="flex justify-around items-end w-full">
            <Token
              :character="{
                name: mostWinningRole?.role.name,
                role: mostWinningRole?.role,
              }"
              size="lg"
              class="drop-shadow-glow"
            />
            <Token
              :character="{
                name: mostLosingRole?.role.name,
                role: mostLosingRole?.role,
              }"
              size="md"
              class="sepia"
            />
          </div>
          <div class="md:text-2xl text-center">
            You won the most as the {{ mostWinningRole?.role.name }} ({{
              mostWinningRole?.win_count
            }}
            {{ mostWinningRole?.win_count === 1 ? "game" : "games" }}) <br />and
            lost the most as the {{ mostLosingRole?.role.name }} ({{
              mostLosingRole?.loss_count
            }}
            {{ mostLosingRole?.loss_count === 1 ? "game" : "games" }}).
          </div>
        </div>
      </div>
    </section>
  </FullScreen>
</template>

<script setup lang="ts">
const route = useRoute();

const id = route.params.id as string;
const { data, error } = await useFetch(`/api/year_in_review/${id}`);
const { scriptLogo } = useScripts();

const gamesPlayedTokenSize = computed(() => {
  if (!data.value) {
    return "sm";
  }

  if (data.value.games_played < data.value.average_games_played / 2) {
    return "sm";
  } else if (data.value.games_played < data.value.average_games_played) {
    return "md";
  } else {
    return "lg";
  }
});

const mostCommonRole = computed(() => {
  if (!data.value) {
    return null;
  }

  return data.value.roles[0];
});

const mostCommonlyStorytoldScript = computed(() => {
  if (!data.value) {
    return null;
  }

  return data.value.most_common_storytold_scripts[0];
});

function getScriptLogo(script: { script: string; logo: string | null }) {
  return script.logo ?? scriptLogo(script.script);
}

const mostWinningRole = computed(() => {
  if (!data.value) {
    return null;
  }

  const winningRole = data.value.winning_roles[0];

  if (!winningRole) {
    return null;
  }

  return {
    role: data.value.roles.find((role) => role.role.id === winningRole.role_id)!
      .role,
    win_count: winningRole.win_count,
  };
});

const mostLosingRole = computed(() => {
  if (!data.value) {
    return null;
  }

  const losingRole = data.value.losing_roles[0];

  if (!losingRole) {
    return null;
  }

  return {
    role: data.value.roles.find((role) => role.role.id === losingRole.role_id)!
      .role,
    loss_count: losingRole.loss_count,
  };
});

const wonMostInMonth = computed(() => {
  if (!data.value) {
    return null;
  }

  // Find the month with the most wins

  let month = Object.keys(data.value.games_by_month).map((m) => {
    return {
      ...data.value!.games_by_month[m],
      month: m,
    };
  })[0];

  Object.keys(data.value.games_by_month).forEach((m) => {
    if (data.value!.games_by_month[m].win > month.win) {
      month = { ...data.value!.games_by_month[m], month: m };
    }
  });

  return month;
});
</script>
