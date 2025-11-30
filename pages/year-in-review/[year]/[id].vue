<template>
  <FullScreen v-if="data" class="bg-stone-800 text-white">
    <section class="gap-5">
      <img
        src="/logo.png"
        alt="ClockTracker Logo"
        class="w-40 md:w-52 pb-8 md:pb-20"
      />
      <h1 class="text-center font-sorts">
        <span class="text-3xl md:text-5xl">ClockTracker</span> <br />
        <span class="text-2xl md:text-4xl">Year in Review</span> <br />
        <span class="text-xl md:text-3xl">{{ data.year }}</span>
      </h1>
      <Avatar :value="data.avatar" size="lg" />
      <h2 class="text-center font-sorts text-2xl md:text-3xl">
        {{ data.display_name }}
      </h2>
    </section>
    <section
      v-if="data.games_played > 0"
      :class="{
        'bg-red-950': mostCommonRole?.role.initial_alignment === 'EVIL',
        'bg-blue-950': mostCommonRole?.role.initial_alignment === 'GOOD',
      }"
    >
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Games Played
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center w-2/3">
          <div class="text-lg md:text-3xl md:w-2/3">
            You played {{ data.games_played }}
            {{ data.games_played === 1 ? "game" : "games" }} this year, which is
            <span
              >{{
                Math.round(
                  (Math.abs(data.average_games_played - data.games_played) /
                    data.average_games_played) *
                    100
                )
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
    <section v-if="data.games_storytold > 0" class="bg-primary-darkest">
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Storytelling
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center md:w-2/3">
          <div class="text-lg md:text-3xl md:w-2/3">
            You were storyteller in {{ data.games_storytold }}
            {{ data.games_storytold === 1 ? "game" : "games" }} this year, which
            is
            <span
              >{{
                Math.round(
                  (Math.abs(
                    data.average_games_storytold - data.games_storytold
                  ) /
                    data.average_games_storytold) *
                    100
                )
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
      v-if="data.win_rate > 1 && data.loss_rate > 1"
      :class="{
        'bg-blue-900':
          Math.round((data.win_rate / data.games_played) * 100) > 0.5,
        'bg-red-900':
          Math.round((data.win_rate / data.games_played) * 100) < 0.5,
      }"
    >
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Win / Loss
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center md:w-2/3 flex flex-col gap-5">
          <div class="text-lg md:text-3xl md:w-2/3">
            You won {{ data.win_rate }} games and lost
            {{ data.loss_rate }} games this year, for an average of a
            {{ Math.round((data.win_rate / data.games_played) * 100) }}% win
            rate.
          </div>
          <div class="text-lg md:text-3xl md:w-2/3">
            Of the {{ data.win_rate }} games you won,
            {{ data.win_rate_good }} were as a good character and
            {{ data.win_rate_evil }} were as an evil character.
          </div>
          <div class="text-lg md:text-3xl md:w-2/3">
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
    <section v-if="data.roles.length > 0" class="bg-yellow-800">
      <!-- Most common roles -->
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Most Common Roles
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center flex flex-col gap-5">
          <div class="text-lg md:text-3xl">
            Your most common roles this year were:
          </div>
          <ul
            class="text-lg md:text-3xl flex flex-wrap justify-around items-center"
          >
            <li
              v-for="(role, index) in data.roles.slice(0, 5)"
              :key="index"
              class="w-1/3 flex flex-col items-center gap-1"
            >
              <Token
                :character="{ name: role.role.name, role: role.role }"
                size="md"
              />
              <span class="whitespace-nowrap">
                {{ role.role.name }} ({{ role.count }})
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section v-if="data.roles.length > 0" class="bg-primary-dark">
      <!-- Least common roles -->
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Least Common Roles
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center flex flex-col gap-5">
          <div class="text-lg md:text-3xl">
            And your least common roles this year were:
          </div>
          <ul
            class="text-lg md:text-3xl flex flex-wrap justify-around items-center"
          >
            <li
              v-for="(role, index) in data.roles.toReversed().slice(0, 5)"
              :key="index"
              class="w-1/3 flex flex-col items-center gap-1"
            >
              <Token
                :character="{ name: role.role.name, role: role.role }"
                size="md"
              />
              <span class="whitespace-nowrap">
                {{ role.role.name }} ({{ role.count }})
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section v-if="data.largest_character_change !== null">
      <!-- Largest character change -->
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        Largest Character Change
      </h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center flex flex-col gap-5">
          <img
            :src="getScriptLogo(data.largest_character_change)"
            class="w-36 h-36 md:w-48 md:h-48 m-auto"
          />
          <div class="text-lg md:text-3xl">
            And don't forget this game of
            {{ data.largest_character_change.script }}
            where you changed characters the most this year!
          </div>
          <ul class="text-lg md:text-3xl flex flex-wrap items-center">
            <li
              v-for="(change, index) in data.largest_character_change
                .characters"
              :key="index"
              class="flex items-center gap-1 w-1/3 justify-around"
            >
              <div class="flex flex-col items-center justify-center">
                <Token
                  :character="{ name: change.role.name, role: change.role }"
                  size="md"
                />
                <span class="whitespace-nowrap">
                  {{ change.role.name }}
                </span>
              </div>
              <div
                v-if="
                  index + 1 < data.largest_character_change.characters.length
                "
                class="text-2xl md:text-5xl"
                :class="{
                  'text-blue-800': change.alignment === 'GOOD',
                  'text-red-800': change.alignment === 'EVIL',
                }"
              >
                ➡
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section
      v-if="data.most_common_scripts.length > 0"
      style="
        background: url('/img/trouble-brewing-bg.webp');
        background-position: center;
      "
    >
      <div class="bg-black/45 w-screen h-screen">
        <!-- Most common scripts -->
        <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
          Most Common Scripts
        </h3>
        <div
          class="flex flex-col md:flex-row justify-around items-center gap-12"
        >
          <div class="text-center flex flex-col gap-5">
            <div class="text-lg md:text-3xl">
              Your most common scripts this year were:
            </div>
            <ul
              class="text-lg md:text-3xl flex flex-wrap justify-around items-center"
            >
              <li
                v-for="script in data.most_common_scripts.slice(0, 5)"
                :key="script.script"
                class="w-1/3 flex flex-col items-center gap-1"
              >
                <img
                  :src="getScriptLogo(script)"
                  class="w-36 h-36 md:w-48 md:h-48"
                />
                <span> {{ script.script }} ({{ script.count }}) </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section
      v-if="data.most_common_storytold_scripts.length > 0"
      style="
        background: url('/img/sects-and-violets-bg.webp');
        background-position: center;
      "
    >
      <div class="bg-black/45 w-screen h-screen">
        <!-- Most common scripts -->
        <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
          Most Commonly Storytold Scripts
        </h3>
        <div
          class="flex flex-col md:flex-row justify-around items-center gap-12"
        >
          <div class="text-center flex flex-col gap-5">
            <div class="text-lg md:text-3xl">
              Your most common scripts to storytell this year were:
            </div>
            <ul
              class="text-lg md:text-3xl flex flex-wrap justify-around items-center"
            >
              <li
                v-for="script in data.most_common_storytold_scripts.slice(0, 5)"
                :key="script.script"
                class="w-1/3 flex flex-col items-center gap-1"
              >
                <img
                  :src="getScriptLogo(script)"
                  class="w-36 h-36 md:w-48 md:h-48"
                />
                <span> {{ script.script }} ({{ script.count }}) </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
    <section
      v-if="data.most_common_players"
      class="bg-gradient-to-br from-red-950 via-primary-darkest to-blue-950"
    >
      <!-- Most common players -->
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">Players</h3>
      <div class="flex flex-col md:flex-row justify-around items-center gap-12">
        <div class="text-center flex flex-col gap-5">
          <div class="text-lg md:text-3xl">
            We couldn't forget the players you played with the most this year!
          </div>
          <ul
            class="text-lg md:text-3xl flex flex-wrap justify-around items-center"
          >
            <li
              v-for="player in data.most_common_players.slice(0, 5)"
              class="flex flex-col items-center gap-1"
            >
              <Avatar :value="player.avatar" size="md" />
              <span>
                {{ player.display_name }}
              </span>
            </li>
          </ul>
          <ul
            class="text-lg md:text-3xl flex flex-wrap justify-around items-center max-h-52"
          >
            <li
              v-for="player in data.most_common_players.slice(5)"
              class="flex flex-col items-center gap-1"
            >
              <Avatar :value="player.avatar" size="xs" />
            </li>
          </ul>
        </div>
      </div>
    </section>
    <section>
      <!-- Wrap up and farewell -->
      <h3 class="text-center font-sorts text-3xl md:text-4xl pb-4">
        That's a wrap!
      </h3>

      <div class="text-lg md:text-3xl text-center">
        Thank you for being a part of ClockTracker this year! Let's see what
        adventures await us in {{ data.year + 1 }}!
      </div>

      <div class="text-lg md:text-3xl text-center pt-4">
        Until then, good luck, and don't let the Yaggababble bite!
      </div>

      <img
        src="/logo.png"
        alt="ClockTracker Logo"
        class="w-40 md:w-52 pb-8 md:pb-20"
      />

      <div class="flex justify-around">
        <a
          id="discord"
          href="https://discord.gg/KwMz8ThamT"
          class="text-stone-400 hover:text-stone-500 dark:text-stone-200 dark:hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
          aria-label="Join the ClockTracker Discord server"
        >
          <div class="w-[50px] flex justify-center">
            <Discord />
          </div>
        </a>
        <a
          id="bluesky"
          href="https://bsky.app/profile/clocktracker.app"
          class="text-stone-400 hover:text-stone-500 dark:text-stone-200 dark:hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
          aria-label="Join the ClockTracker Discord server"
        >
          <div class="w-[50px] flex justify-center">
            <Bluesky />
          </div>
        </a>
        <a
          id="kofi"
          href="https://ko-fi.com/clocktracker"
          class="text-stone-400 hover:text-stone-500 dark:text-stone-200 dark:hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
          aria-label="Donate to ClockTracker"
        >
          <div class="w-[50px] flex justify-center">
            <KoFi />
          </div>
        </a>
        <a
          href="https://github.com/lindsaykwardell/clocktracker"
          class="text-stone-400 hover:text-stone-500 dark:text-stone-200 dark:hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
          aria-label="View the ClockTracker source code"
        >
          <div class="w-[50px] flex justify-center">
            <Github />
          </div>
        </a>
      </div>
    </section>
    <section class="gap-5">
      <img
        src="/logo.png"
        alt="ClockTracker Logo"
        class="w-40 md:w-52 pb-8 md:pb-20"
      />
      <h1 class="text-center font-sorts">
        <span class="text-3xl md:text-5xl">ClockTracker</span> <br />
        <span class="text-2xl md:text-4xl">Year in Review</span> <br />
        <span class="text-xl md:text-3xl">{{ data.year }}</span>
      </h1>
      <Avatar :value="data.avatar" size="lg" />
      <h2 class="text-center font-sorts text-2xl md:text-3xl">
        {{ data.display_name }}
      </h2>
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

  const winningRole = data.value.winning_roles.reduce((prev, current) =>
    prev.win_count > current.win_count ? prev : current
  );

  if (!winningRole) {
    return null;
  }

  return {
    role: data.value.roles.find(
      (role) => role.role?.id === winningRole.role_id
    )!.role,
    win_count: winningRole.win_count,
  };
});

const mostLosingRole = computed(() => {
  if (!data.value) {
    return null;
  }

  const losingRole = data.value.losing_roles.reduce((prev, current) =>
    prev.loss_count > current.loss_count ? prev : current
  );

  if (!losingRole) {
    return null;
  }

  return {
    role: data.value.roles.find((role) => role.role?.id === losingRole.role_id)!
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

useHead({
  title: `Year in Review ${data.value?.year} | ${data.value?.display_name}`,
  meta: [
    {
      name: "description",
      content: `Year in Review for ${data.value?.display_name} in ${data.value?.year}`,
    },
    {
      property: "og:title",
      content: `Year in Review ${data.value?.year} | ${data.value?.display_name}`,
    },
    {
      property: "og:description",
      content: `Year in Review for ${data.value?.display_name} in ${data.value?.year}`,
    },
    {
      property: "og:image",
      content: `/api/year_in_review/${data.value?.username}/avatar` || "",
    },
    {
      property: "og:url",
      content: route.fullPath,
    },
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: route.fullPath,
    },
    {
      property: "twitter:title",
      content: `Year in Review ${data.value?.year} | ${data.value?.display_name}`,
    },
    {
      property: "twitter:description",
      content: `Year in Review for ${data.value?.display_name} in ${data.value?.year}`,
    },
    {
      property: "twitter:image",
      content: `/api/year_in_review/${data.value?.username}/avatar` || "",
    },
  ],
});
</script>
