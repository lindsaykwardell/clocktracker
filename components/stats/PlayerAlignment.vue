<template>
  <div>
    <h2 class="font-sorts text-center text-xl lg:text-2xl mb-2 lg:mb-4">
      Alignment Insights
    </h2>

    <div class="grid gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div class="lg:col-span-3 xl:col-span-1 p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40">
        <!-- <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Starting Alignment
        </h3> -->
        <template v-if="evilBias">
          <div  class="flex flex-col text-center after:content-[''] after:mx-auto after:my-3 after:w-8 after:h-[1px] after:bg-stone-400">
            <div class="text-center text-balance max-w-64 mx-auto">
              <template v-if="evilBias.diffRate >= 0.40">
                {{ props.isMe ? 'Your hands' : `This player's hands` }} are a magnet for <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> tokens.
              </template>
              <template v-else-if="evilBias.diffRate >= 0.20">
                It's statistically suspicious how often {{ props.isMe ? 'you draw' : `this player draws` }} an <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> token.
              </template>
              <template v-else-if="evilBias.diffRate >= 0.05">
                {{ props.isMe ? 'You show' : `This player shows` }} a slight pull toward <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> tokens.
              </template>
              <template v-else-if="evilBias.diffRate <= -0.05 && evilBias.diffRate > -0.20">
                {{ props.isMe ? 'You show' : `This player shows` }} a slight pull toward <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> tokens.
              </template>
              <template v-else-if="evilBias.diffRate <= -0.20">
                {{ props.isMe ? 'Your hands' : `This player's hands` }} seem blessed, <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> tokens find {{ props.isMe ? 'you' : `them` }} often.
              </template>
              <template v-else>
                {{ props.isMe ? 'You land' : `This player draws` }} <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> and
                <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span> tokens exactly as probability predicts.
              </template>

            </div>
          </div>

          <div class="text-center text-sm text-pretty space-y-2">
            <p>
              Based on the {{ evilBias?.games }} games {{ props.isMe ? 'you' : `this player` }} played,
              {{ props.isMe ? 'you were' : `this player was` }} expected to draw
              an Evil token {{ evilBias?.expectedEvil.toFixed(1) }} times.
            </p>
            <p>
              <template v-if="evilBias.diffRate === 0">
                {{ props.isMe ? 'You' : `This player` }} drew an Evil token {{ evilBias?.actualEvil }} times,
                which is exactly as probability predicts.
              </template>
              <template v-else-if="evilBias.diffRate < 0.05 && evilBias.diffRate > -0.05">
                {{ props.isMe ? 'You' : `This player` }} drew an Evil token {{ evilBias?.actualEvil }} times,
                which is only a small difference of
                <span class="font-semibold" :style="`color: ${evilBias?.diffRate > 0 ? chartColors.evil : chartColors.good}`">
                  {{ (evilBias?.diffRate > 0 ? '+' : '') + Math.round(evilBias?.diffRate * 100) }}%
                </span>
              </template>
              <template v-else>
                {{ props.isMe ? 'You' : `This player` }} actually drew an Evil token {{ evilBias?.actualEvil }} times,
                which is a difference of
                <span class="font-semibold" :style="`color: ${evilBias?.diffRate > 0 ? chartColors.evil : chartColors.good}`">
                  {{ (evilBias?.diffRate > 0 ? '+' : '') + Math.round(evilBias?.diffRate * 100) }}%
                </span>
              </template>
            </p>
          </div>
        </template>
        <div v-else class="text-center text-balance max-w-64 mx-auto">
          Not enough data.
        </div>
      </div>

      <div class="relative p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col">
        <template v-if="statsDebug.enabled.value">
          <Button
            @click="showSwitchDebug = true"
            title="Debug: games behind the alignment switches"
            variant="filled"
            color="positive"
            icon="bug"
            display="icon-only"
            circular
            size="xs"
            class="absolute top-1 left-1 z-10"
          >
            Debug: alignment switches
          </Button>
          <StatsDebugDialog
            v-model:visible="showSwitchDebug"
            title="Alignment switches: games"
            :summary="alignmentSwitchStats ? `${alignmentSwitchStats.switches} switches in ${alignmentSwitchStats.gamesWithSwitch} of ${alignmentSwitchStats.trackedGames} tracked games.` : 'Not enough data.'"
            :rows="switchDebugRows"
          />
        </template>
        <!-- <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Switching Alignment
        </h3> -->
        <div class="flex flex-col text-center after:content-[''] after:mx-auto after:my-3 after:w-8 after:h-[1px] after:bg-stone-400">
          <div class="text-center text-balance max-w-64 mx-auto">
            <template
              v-if="alignmentSwitchStats"
            >
              {{ props.isMe ? `You've` : `This player has` }} switched alignment
              <span class="text-nowrap">{{ alignmentSwitchStats.switches }} time<template v-if="alignmentSwitchStats.switches !== 1">s</template></span>
              <template v-if="alignmentSwitchStats.maxSwitchesInGame > 1">, <span class="text-nowrap">{{
                  alignmentSwitchStats.maxSwitchesInGame === 2
                    ? 'twice'
                    : alignmentSwitchStats.maxSwitchesInGame + ' times'
                }}</span> in one game even!
              </template>
              <template v-else>. </template>
            </template>
            <span v-else>
              Not enough data.
            </span>
          </div>
        </div>

        <div
          v-if="alignmentSwitchStats && alignmentSwitchStats.gamesWithSwitch > 0"
          class="flex flex-col text-center"
        >
          <div class="text-center text-sm text-pretty space-y-2">
            <!-- GOOD SWITCHES -->
            <p v-if="alignmentSwitchStats.switchedToGoodGames > 0">
              <!-- Intro -->
              {{ props.isMe ? 'You' : 'This player' }} finished {{ alignmentSwitchStats.switchedToGoodGames }} game<span v-if="alignmentSwitchStats.switchedToGoodGames !== 1">s</span>
              after switching to the <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span> team.

              <!-- Lost all -->
              <template v-if="alignmentSwitchStats.switchedWinGood === 0">
                Good absolutely did not return the favor, resulting in a clean sweep of losses.
              </template>

              <!-- Won all -->
              <template v-else-if="alignmentSwitchStats.switchedWinGood === alignmentSwitchStats.switchedToGoodGames">
                Every single switch paid off, ending in a perfect run of wins.
              </template>

              <!-- Won few -->
              <template v-else-if="alignmentSwitchStats.switchedWinGood * 2 < alignmentSwitchStats.switchedToGoodGames">
                The results were mostly underwhelming, with {{ alignmentSwitchStats.switchedToGoodGames - alignmentSwitchStats.switchedWinGood }}
                of those games slipping away.
              </template>

              <!-- Equal -->
              <template v-else-if="alignmentSwitchStats.switchedWinGood * 2 === alignmentSwitchStats.switchedToGoodGames">
                This worked out evenly, just as many wins as losses.
              </template>

              <!-- Won many -->
              <template v-else>
                The odds leaned in your favour, securing {{ alignmentSwitchStats.switchedWinGood }}
                well-earned win<span v-if="alignmentSwitchStats.switchedWinGood !== 1">s</span>.
              </template>
            </p>

            <!-- EVIL SWITCHES -->
            <p v-if="alignmentSwitchStats.switchedToEvilGames > 0">
              <!-- Intro sentence -->
              {{ props.isMe ? 'You' : 'This player' }} fell in with <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>
              by the end of {{ alignmentSwitchStats.switchedToEvilGames }} game<span v-if="alignmentSwitchStats.switchedToEvilGames !== 1">s</span>.

              <!-- Lost all -->
              <template v-if="alignmentSwitchStats.switchedWinEvil === 0">
                <template v-if="alignmentSwitchStats.switchedToEvilGames > 1">
                  Those shifts proved regrettable, ending in losses across the board.
                </template>
                <template v-else>
                  That shift proved regrettable, ending in a loss.
                </template>
              </template>

              <!-- Won all -->
              <template v-else-if="alignmentSwitchStats.switchedWinEvil === alignmentSwitchStats.switchedToEvilGames">
                <template v-if="alignmentSwitchStats.switchedToEvilGames > 1">
                  The dark side treated those decisions exceptionally well, delivering wins in every game.
                </template>
                <template v-else>
                  The dark side treated that decision exceptionally well, delivering a win.
                </template>
              </template>

              <!-- Won few -->
              <template v-else-if="alignmentSwitchStats.switchedWinEvil * 2 < alignmentSwitchStats.switchedToEvilGames">
                Those switches didn't always land, with {{ alignmentSwitchStats.switchedToEvilGames - alignmentSwitchStats.switchedWinEvil }}
                defeat<span v-if="alignmentSwitchStats.switchedToEvilGames - alignmentSwitchStats.switchedWinEvil !== 1">s</span>
                overshadowing the outcome.
              </template>

              <!-- Equal -->
              <template v-else-if="alignmentSwitchStats.switchedWinEvil * 2 === alignmentSwitchStats.switchedToEvilGames">
                This came out perfectly even, wins and losses matched.
              </template>

              <!-- Won many -->
              <template v-else>
                These gambles paid off more often than not, yielding {{ alignmentSwitchStats.switchedWinEvil }}
                solid win<span v-if="alignmentSwitchStats.switchedWinEvil !== 1">s</span>.
              </template>
            </p>
          </div>
        </div>
      </div>

      <div class="relative p-4 border rounded-lg dark:border-stone-700/50 bg-stone-300/30 dark:bg-stone-900/40 flex flex-col">
        <template v-if="statsDebug.enabled.value">
          <Button
            @click="showStreakDebug = true"
            title="Debug: games behind the alignment streaks"
            variant="filled"
            color="positive"
            icon="bug"
            display="icon-only"
            circular
            size="xs"
            class="absolute top-1 left-1 z-10"
          >
            Debug: alignment streaks
          </Button>
          <StatsDebugDialog
            v-model:visible="showStreakDebug"
            title="Alignment streaks: games"
            :summary="streakDebugSummary"
            :rows="streakDebugRows"
          />
        </template>
        <!-- <h3 class="font-sorts text-center text-lg lg:text-xl mb-2 md:mb-3">
          Alignment Streaks
        </h3> -->
        <div v-if="alignmentStreaks">
          <div class="flex flex-col after:content-[''] after:mx-auto after:my-3 after:w-8 after:h-[1px] after:bg-stone-400">
            <div class="text-center text-balance max-w-64 mx-auto">
              <div v-if="alignmentStreaks.current">
                {{ props.isMe ? "You've" : 'This player has' }} finished the last
                <span class="text-nowrap">{{ alignmentStreaks.current.length }} game<span v-if="alignmentStreaks.current.length > 1">s</span></span>
                on the
                <span class="font-semibold" :style="`color: ${alignmentStreaks.current.alignment === 'GOOD' ? chartColors.good : chartColors.evil}`">
                  {{ alignmentStreaks.current.alignment === 'GOOD' ? 'Good' : 'Evil' }}
                </span> team.
              </div>
              <div v-else>
                No current streak.
              </div>
            </div>
          </div>
          <div class="flex flex-col text-center">
            <div class="text-center text-sm text-pretty space-y-2">
              <p>
                {{ props.isMe ? 'Your' : "This player's" }} longest stretch as <span class="font-semibold" :style="`color: ${chartColors.good}`">Good</span>
                ran for {{ alignmentStreaks.longest.good }} game<span v-if="alignmentStreaks.longest.good !== 1">s</span>.
              </p>
              <p>
                {{ props.isMe ? 'Your' : "This player's" }} longest streak on the side of <span class="font-semibold" :style="`color: ${chartColors.evil}`">Evil</span>
                lasted {{ alignmentStreaks.longest.evil }} game<span v-if="alignmentStreaks.longest.evil !== 1">s</span>.
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-sm text-stone-400">
          Not enough data.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Game, Character } from "~/server/generated/prisma/client";
import type { GameRecord } from "~/composables/useGames";
import { chartColors } from "~/composables/useChartColors";
import { useStatsDebug } from "~/composables/useStatsDebug";

const statsDebug = useStatsDebug();
const showSwitchDebug = ref(false);
const showStreakDebug = ref(false);

type Alignment = "GOOD" | "EVIL" | null;

type GrimoireToken = {
  alignment?: Alignment | null;
  grimoire_participant_id?: string | null;
  role_id?: string | null;
  player_id?: string | null;
  player_name?: string | null;
  player?: { username?: string | null } | null;
  role?: {
    type?: string | null;
    initial_alignment?: Alignment | null;
  } | null;
};

type GrimoirePage = {
  tokens?: GrimoireToken[];
};

type GameWithChars = Game & {
  ignore_for_stats?: boolean | null;
  win_v2?: string | null;
  player_count?: number | null;
  traveler_count?: number | null;
  grimoire?: GrimoirePage[] | null;
  grimoire_events?: {
    grimoire_page: number;
    participant_id: string | null;
    event_type: string;
    new_alignment?: string | null;
  }[] | null;
  user?: {
    username?: string | null;
  } | null;
  player_characters: (Character & {
    name: string | null;
    alignment?: Alignment;
    role_id?: string | null;
    role?: {
      type?: string | null;
      token_url?: string | null;
      initial_alignment?: Alignment;
    } | null;
    related_role?: {
      token_url?: string | null;
    } | null;
  })[];
};

const props = defineProps<{
  games: GameRecord[];
  isMe?: boolean;
}>();

// Cast GameRecord[] to the wider local type for internal use.
const internalGames = computed(() => props.games as unknown as GameWithChars[]);

type AlignmentSwitchStats = {
  trackedGames: number;
  switches: number;
  maxSwitchesInGame: number;
  switchesGoodToEvil: number;
  switchesEvilToGood: number;
  gamesWithSwitch: number;
  switchedToGoodGames: number;
  switchedToEvilGames: number;
  switchedWinGood: number;
  switchedWinEvil: number;
};

type EvilBias = {
  games: number;
  actualEvil: number;
  expectedEvil: number;
  actualRate: number;
  expectedRate: number;
  diffRate: number;
};

type AlignmentStreaks = {
  current: { alignment: Exclude<Alignment, null>; length: number } | null;
  longest: { good: number; evil: number };
};

const orderedGames = computed(() => {
  return [...internalGames.value]
    .map((game, index) => ({
      game,
      index,
      dateTs: getGameDateTimestamp(game),
      createdTs: getCreatedTimestamp(game),
    }))
    .sort((a, b) => {
      // Primary: game date (ascending).
      const da = a.dateTs ?? Infinity;
      const db = b.dateTs ?? Infinity;
      if (da !== db) return da - db;

      // Secondary: creation timestamp (ascending).
      const ca = a.createdTs ?? Infinity;
      const cb = b.createdTs ?? Infinity;
      if (ca !== cb) return ca - cb;

      // Fallback: assume incoming order is newest -> oldest, so reverse index
      // to get chronological order.
      return b.index - a.index;
    })
    .map((entry) => entry.game);
});

const alignmentSwitchStats = computed<AlignmentSwitchStats | null>(() => {
  let trackedGames = 0;
  let switches = 0;
  let maxSwitchesInGame = 0;
  let switchesGoodToEvil = 0;
  let switchesEvilToGood = 0;
  let gamesWithSwitch = 0;
  let switchedToGoodGames = 0;
  let switchedToEvilGames = 0;
  let switchedWinGood = 0;
  let switchedWinEvil = 0;

  for (const game of orderedGames.value) {
    if (game.ignore_for_stats) continue;

    const timeline = getAlignmentTimeline(game);
    if (!timeline.length) continue;

    trackedGames++;

    let gameSwitches = 0;
    let lastSwitchTo: Alignment | null = null;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i] && timeline[i] !== timeline[i - 1]) {
        gameSwitches++;
        const from = timeline[i - 1];
        const to = timeline[i];

        if (from === "GOOD" && to === "EVIL") switchesGoodToEvil++;
        if (from === "EVIL" && to === "GOOD") switchesEvilToGood++;
        lastSwitchTo = to;
      }
    }

    switches += gameSwitches;
    if (gameSwitches > 0) {
      gamesWithSwitch++;
      maxSwitchesInGame = Math.max(maxSwitchesInGame, gameSwitches);

      const result = game.win_v2;
      const goodWins = result === "GOOD_WINS";
      const evilWins = result === "EVIL_WINS";

      if (lastSwitchTo === "GOOD") {
        switchedToGoodGames++;
        if (goodWins) {
          switchedWinGood++;
        }
      }

      if (lastSwitchTo === "EVIL") {
        switchedToEvilGames++;
        if (evilWins) {
          switchedWinEvil++;
        }
      }
    }
  }

  if (!trackedGames) return null;

  return {
    trackedGames,
    switches,
    maxSwitchesInGame,
    switchesGoodToEvil,
    switchesEvilToGood,
    gamesWithSwitch,
    switchedToGoodGames,
    switchedToEvilGames,
    switchedWinGood,
    switchedWinEvil,
  };
});

const alignmentStreaks = computed<AlignmentStreaks | null>(() => {
  const longest = { good: 0, evil: 0 };
  let current: AlignmentStreaks["current"] = null;

  let runningAlignment: Alignment = null;
  let runningLength = 0;

  for (const game of orderedGames.value) {
    if (game.ignore_for_stats) continue;

    const endAlignment = getEndingAlignment(game);
    if (!endAlignment) continue;

    if (runningAlignment === endAlignment) {
      runningLength++;
    } else {
      runningAlignment = endAlignment;
      runningLength = 1;
    }

    if (endAlignment === "GOOD") {
      if (runningLength > longest.good) {
        longest.good = runningLength;
      }
    } else if (endAlignment === "EVIL") {
      if (runningLength > longest.evil) {
        longest.evil = runningLength;
      }
    }
  }

  if (runningAlignment && runningLength > 0) {
    current = { alignment: runningAlignment, length: runningLength };
  }

  if (!longest.good && !longest.evil) {
    return null;
  }

  return {
    current,
    longest,
  };
});

const evilBias = computed<EvilBias | null>(() => {
  let games = 0;
  let actualEvil = 0;
  let expectedEvil = 0;

  for (const game of orderedGames.value) {
    if (game.ignore_for_stats) continue;

    const playerCount = game.player_count ?? 0;
    if (playerCount <= 0) continue;

    const alignment = getInitialAlignment(game);
    if (!alignment) continue;

    const evilSlots = evilSlotsForPlayers(playerCount);
    if (evilSlots <= 0) continue;

    games++;

    if (alignment === "EVIL") {
      actualEvil++;
    }

    expectedEvil += evilSlots / playerCount;
  }

  if (!games) return null;

  const actualRate = actualEvil / games;
  const expectedRate = expectedEvil / games;

  return {
    games,
    actualEvil,
    expectedEvil,
    actualRate,
    expectedRate,
    diffRate: actualRate - expectedRate,
  };
});

function findPlayerToken(page: GrimoirePage | null | undefined, game: GameWithChars) {
  if (!page?.tokens?.length) return null;

  const username = game.user?.username ?? null;

  return (
    page.tokens.find(
      (t) =>
        (username &&
          (t.player?.username === username ||
            t.player_name === username ||
            t.player_name === `@${username}`)) ||
        t.player_id === (game as unknown as { user_id?: string }).user_id
    ) ?? null
  );
}

function alignmentFromToken(token?: GrimoireToken | null): Alignment {
  if (!token) return null;

  const alignment = token.alignment as Alignment;
  if (alignment === "GOOD" || alignment === "EVIL") {
    return alignment;
  }

  const roleAlignment = token.role?.initial_alignment as Alignment;
  if (roleAlignment === "GOOD" || roleAlignment === "EVIL") {
    return roleAlignment;
  }

  return null;
}

/**
 * A player who starts on the other side of their character (an evil
 * Townsfolk from the Bounty Hunter) switched during setup. Returns the
 * character's own alignment, so the timeline starts there and counts that
 * switch. Travellers choose their side, so they never switch at setup. Same
 * rule as the page 1 ALIGNMENT_CHANGE events.
 */
function setupSwitchFrom(
  role: { type?: string | null; initial_alignment?: Alignment | string | null } | null | undefined,
  alignment: Alignment
): Alignment {
  if (!role || !alignment || role.type === "TRAVELER") return null;
  const initial = role.initial_alignment;
  if (initial !== "GOOD" && initial !== "EVIL") return null;
  return initial !== alignment ? initial : null;
}

function getAlignmentsFromGrimoire(game: GameWithChars): Alignment[] {
  const alignments: Alignment[] = [];
  const pages = game.grimoire ?? [];

  for (const page of pages) {
    const token = findPlayerToken(page, game);
    const alignment = alignmentFromToken(token);
    if (alignment) {
      if (!alignments.length) {
        const from = setupSwitchFrom(token?.role, alignment);
        if (from) alignments.push(from);
      }
      alignments.push(alignment);
    }
  }

  return alignments;
}

function getCharacterAlignments(game: GameWithChars): Alignment[] {
  const alignments: Alignment[] = [];

  for (const character of game.player_characters) {
    if (character.role?.type === "FABLED" || character.role?.type === "LORIC") continue;

    const alignment = character.alignment as Alignment;
    if (alignment === "GOOD" || alignment === "EVIL") {
      if (!alignments.length) {
        const from = setupSwitchFrom(character.role, alignment);
        if (from) alignments.push(from);
      }
      alignments.push(alignment);
    }
  }

  return alignments;
}

/**
 * The player's alignments through a game from its grimoire events: the
 * alignment on the first page they're on, then every later alignment change.
 * Starting on the other side of their character (an evil Townsfolk from the
 * Bounty Hunter) counts as a switch at setup. Returns null when the game has no
 * events or the player has no seat, so the caller falls back to the pages.
 */
function getAlignmentsFromEvents(game: GameWithChars): Alignment[] | null {
  const events = game.grimoire_events ?? [];
  const pages = game.grimoire ?? [];
  if (!events.length || !pages.length) return null;

  let firstPage = -1;
  let start: Alignment = null;
  let setupFrom: Alignment = null;
  const participantIds = new Set<string>();
  pages.forEach((page, pageIndex) => {
    const token = findPlayerToken(page, game);
    if (!token) return;
    if (token.grimoire_participant_id) participantIds.add(token.grimoire_participant_id);
    if (firstPage === -1) {
      firstPage = pageIndex;
      start = alignmentFromToken(token);
      setupFrom = setupSwitchFrom(token.role, start);
    }
  });
  if (firstPage === -1 || !participantIds.size || !start) return null;

  const changes = events
    .filter(
      (event) =>
        event.event_type === "ALIGNMENT_CHANGE" &&
        event.grimoire_page > firstPage &&
        !!event.participant_id &&
        participantIds.has(event.participant_id) &&
        (event.new_alignment === "GOOD" || event.new_alignment === "EVIL")
    )
    .sort((a, b) => a.grimoire_page - b.grimoire_page)
    .map((event) => event.new_alignment as Alignment);

  return setupFrom ? [setupFrom, start, ...changes] : [start, ...changes];
}

function getAlignmentTimelineWithSource(game: GameWithChars): {
  timeline: Alignment[];
  source: "events" | "grimoire pages" | "your roles";
} {
  const fromEvents = getAlignmentsFromEvents(game);
  if (fromEvents) return { timeline: fromEvents, source: "events" };

  const fromGrimoire = getAlignmentsFromGrimoire(game);
  if (fromGrimoire.length) return { timeline: fromGrimoire, source: "grimoire pages" };

  return { timeline: getCharacterAlignments(game), source: "your roles" };
}

function getAlignmentTimeline(game: GameWithChars): Alignment[] {
  return getAlignmentTimelineWithSource(game).timeline;
}

// Debug mode: every game with its alignment timeline and where it came from.
const switchDebugRows = computed(() => {
  if (!showSwitchDebug.value) return [];
  return [...orderedGames.value].reverse().map((game) => {
    const { timeline, source } = getAlignmentTimelineWithSource(game);
    let switches = 0;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i] && timeline[i] !== timeline[i - 1]) switches++;
    }
    const reason = game.ignore_for_stats
      ? "Ignored for stats"
      : !timeline.length
        ? "No alignment found"
        : switches
          ? `From ${source}`
          : `No switch (from ${source})`;
    return {
      id: String(game.id),
      date: new Date(game.date).toLocaleDateString(),
      script: game.script,
      value: game.ignore_for_stats || !timeline.length ? "-" : `${switches}`,
      counts: !game.ignore_for_stats && switches > 0,
      reason,
      details: timeline.length
        ? [timeline.map((alignment) => (alignment ?? "?").toLowerCase()).join(" > ")]
        : [],
    };
  });
});

// Debug mode: every game with the alignment it ended on and its place in a
// streak, walked the same way as alignmentStreaks (oldest first; ignored games
// and games without an alignment are skipped without breaking a streak).
const streakDebug = computed(() => {
  if (!showStreakDebug.value) return null;

  type Entry = { game: GameWithChars; alignment: Alignment; run: number; group: number; reason?: string };
  type Run = { alignment: Exclude<Alignment, null>; entries: Entry[] };
  const entries: Entry[] = [];
  const runs: Run[] = [];

  for (const game of orderedGames.value) {
    if (game.ignore_for_stats) {
      entries.push({ game, alignment: null, run: 0, group: runs.length - 1, reason: "Ignored for stats" });
      continue;
    }
    const alignment = getEndingAlignment(game);
    if (!alignment) {
      entries.push({ game, alignment: null, run: 0, group: runs.length - 1, reason: "No alignment found" });
      continue;
    }
    const last = runs.at(-1);
    const entry: Entry = { game, alignment, run: 0, group: 0 };
    if (last && last.alignment === alignment) {
      last.entries.push(entry);
    } else {
      runs.push({ alignment, entries: [entry] });
    }
    entry.run = runs.at(-1)!.entries.length;
    entry.group = runs.length - 1;
    entries.push(entry);
  }

  // The first streak that reached the longest length, as the stat counts it.
  const longestRun = (alignment: "GOOD" | "EVIL") =>
    runs
      .filter((run) => run.alignment === alignment)
      .reduce<Run | null>(
        (best, run) => (!best || run.entries.length > best.entries.length ? run : best),
        null
      );
  return {
    entries,
    current: runs.at(-1) ?? null,
    longestGood: longestRun("GOOD"),
    longestEvil: longestRun("EVIL"),
  };
});

const streakDebugSummary = computed(() => {
  const streaks = alignmentStreaks.value;
  if (!streaks) return "Not enough data.";
  const current = streaks.current
    ? `Current: ${streaks.current.length} as ${streaks.current.alignment === "GOOD" ? "Good" : "Evil"}.`
    : "No current streak.";
  return `${current} Longest: Good ${streaks.longest.good}, Evil ${streaks.longest.evil}.`;
});

const streakDebugRows = computed(() => {
  const debug = streakDebug.value;
  if (!debug) return [];
  return [...debug.entries].reverse().map((entry) => {
    const label = entry.alignment === "GOOD" ? "Good" : entry.alignment === "EVIL" ? "Evil" : null;
    // In a longest streak: those get the border and the larger row.
    const inLongestStreak = [debug.longestGood, debug.longestEvil].some((run) =>
      run?.entries.includes(entry)
    );
    return {
      id: String(entry.game.id),
      date: new Date(entry.game.date).toLocaleDateString(),
      script: entry.game.script,
      value: label ? `#${entry.run}` : "-",
      counts: !!label,
      reason: entry.reason ?? (label ? `Ended as ${label}` : null),
      icon: label ? `/img/role/48x48/${entry.alignment === "GOOD" ? "good" : "evil"}_thumb.webp` : undefined,
      iconAlt: label ?? undefined,
      // Marks the longest streaks; the rest are smaller.
      accent: inLongestStreak
        ? entry.alignment === "GOOD" ? chartColors.good : chartColors.evil
        : undefined,
      minor: !!label && !inLongestStreak,
      // One block per streak; skipped games sit in the streak they fall in.
      group: String(entry.group),
    };
  });
});

function getEndingAlignment(game: GameWithChars): Alignment {
  const timeline = getAlignmentTimeline(game);
  if (!timeline.length) return null;
  return timeline.at(-1) ?? null;
}

function getInitialAlignment(game: GameWithChars): Alignment {
  const firstPage = game.grimoire?.[0];
  const tokenAlignment = alignmentFromToken(findPlayerToken(firstPage, game));
  if (tokenAlignment) return tokenAlignment;

  const firstCharacter = game.player_characters.at(0);
  const alignment = firstCharacter?.alignment as Alignment;
  if (alignment === "GOOD" || alignment === "EVIL") {
    return alignment;
  }

  return null;
}

function evilSlotsForPlayers(playerCount: number): number {
  if (playerCount <= 0) return 0;
  if (playerCount <= 9) return 2;
  if (playerCount <= 12) return 3;
  return 4;
}

function getGameDateTimestamp(game: GameWithChars): number | null {
  const raw =
    (game as unknown as { data?: { date?: string | number | Date } })?.data?.date ??
    (game as unknown as { date?: string | number | Date })?.date;
  if (!raw) return null;
  const date = new Date(raw as any);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getCreatedTimestamp(game: GameWithChars): number | null {
  const raw = (game as unknown as { created_at?: string | number | Date })?.created_at;
  if (!raw) return null;
  const date = new Date(raw as any);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function formatDebugDate(game: GameWithChars): string {
  const d =
    (game as unknown as { data?: { date?: string | number | Date } })?.data?.date ??
    (game as unknown as { date?: string | number | Date })?.date ??
    (game as unknown as { ended_at?: string | number | Date })?.ended_at ??
    (game as unknown as { created_at?: string | number | Date })?.created_at ??
    (game as unknown as { updated_at?: string | number | Date })?.updated_at;

  if (!d) return "unknown";
  const date = new Date(d as any);
  return Number.isNaN(date.getTime()) ? String(d) : date.toISOString();
}
</script>
