<template>
  <main class="min-h-screen bg-stone-950 text-white">
    <!-- Hero -->
    <section class="relative flex flex-col items-center justify-center gap-8 px-6 py-20 md:py-32 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-950 to-stone-950" />
      <div class="relative z-10 flex flex-col items-center gap-8 max-w-2xl text-center">
        <img
          src="/logo.png"
          class="w-48 sm:w-64 drop-shadow-2xl"
          alt="ClockTracker"
        />
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold font-sorts leading-tight">
          Tell Your Clocktower Story
        </h1>
        <p class="text-lg text-stone-400 max-w-lg">
          Track your games of Blood on the Clocktower, connect with friends,
          and watch your story unfold.
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <Button
            component="nuxt-link"
            to="/login"
            icon="mail"
            size="lg"
            color="primary"
            wide
          >
            Continue with e-mail
          </Button>
          <LoginWithDiscord />
        </div>
      </div>
    </section>

    <!-- Stats banner -->
    <section class="border-y border-stone-800 bg-stone-900/50">
      <div
        class="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-stone-800 py-8"
      >
        <div class="text-center px-4">
          <div class="text-2xl md:text-3xl font-bold text-purple-400 font-sorts">
            {{ playerCount }}+
          </div>
          <div class="text-sm text-stone-400 mt-1">Players</div>
        </div>
        <div class="text-center px-4">
          <div class="text-2xl md:text-3xl font-bold text-blue-400 font-sorts">
            {{ gameCount }}+
          </div>
          <div class="text-sm text-stone-400 mt-1">Games Recorded</div>
        </div>
        <div class="text-center px-4">
          <div class="text-2xl md:text-3xl font-bold text-amber-400 font-sorts">
            {{ scriptCount }}+
          </div>
          <div class="text-sm text-stone-400 mt-1">Scripts Played</div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-5xl mx-auto px-6 py-16 md:py-24">
      <h2 class="text-2xl md:text-3xl font-sorts font-bold text-center mb-12">
        Everything You Need to Track Your Games
      </h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="group rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden hover:border-stone-700 transition-colors">
          <img
            src="/img/home-grid.png"
            class="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            alt="Game history grid"
          />
          <div class="p-5">
            <h3 class="text-lg font-sorts font-bold mb-2">Record Every Game</h3>
            <p class="text-stone-400 text-sm leading-relaxed">
              Log your roles, scripts, and results. Look back on your games and
              relive your best moments with your group.
            </p>
          </div>
        </div>
        <div class="group rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden hover:border-stone-700 transition-colors">
          <img
            src="/img/home-stats.png"
            class="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            alt="Player statistics"
          />
          <div class="p-5">
            <h3 class="text-lg font-sorts font-bold mb-2">Track Your Stats</h3>
            <p class="text-stone-400 text-sm leading-relaxed">
              See your win rates, favorite roles, and performance over time.
              Use data to sharpen your game without letting it define you.
            </p>
          </div>
        </div>
        <div class="group rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden hover:border-stone-700 transition-colors">
          <img
            src="/img/home-notes-images.png"
            class="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            alt="Notes and images"
          />
          <div class="p-5">
            <h3 class="text-lg font-sorts font-bold mb-2">Notes, Images & Grimoires</h3>
            <p class="text-stone-400 text-sm leading-relaxed">
              Add notes about your games, upload photos to capture the moment,
              and record a full grimoire for every session.
            </p>
          </div>
        </div>
        <div class="group rounded-xl border border-stone-800 bg-stone-900/40 overflow-hidden hover:border-stone-700 transition-colors">
          <img
            src="/img/home-follow.png"
            class="w-full aspect-video object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
            alt="Friends and community"
          />
          <div class="p-5">
            <h3 class="text-lg font-sorts font-bold mb-2">Connect with Friends</h3>
            <p class="text-stone-400 text-sm leading-relaxed">
              Follow your friends, join communities, and see what scripts
              everyone's been playing. Share your story together.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="px-6 py-16 md:py-24 text-center bg-gradient-to-t from-stone-950 to-stone-900/50">
      <h2 class="text-2xl md:text-4xl font-sorts font-bold mb-4">
        What will your story be?
      </h2>
      <p class="text-stone-400 mb-8 max-w-md mx-auto">
        Join hundreds of players already tracking their Clocktower games.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          component="nuxt-link"
          to="/login"
          color="primary"
          icon="mail"
          size="lg"
          wide
        >
          Continue with e-mail
        </Button>
        <LoginWithDiscord />
      </div>
    </section>

    <!-- Footer -->
    <footer class="pb-6 pt-4 text-center text-sm text-stone-600 border-t border-stone-900">
      This project is not affiliated with The Pandemonium Institute. All roles
      are the property of Steven Medway and The Pandemonium Institute.
    </footer>
  </main>
</template>

<script setup lang="ts">
const { data: counts } = await useFetch("/api/landing-stats", {
  default: () => ({ players: 0, games: 0, scripts: 0 }),
});

const playerCount = computed(() => roundDown(counts.value.players));
const gameCount = computed(() => roundDown(counts.value.games));
const scriptCount = computed(() => roundDown(counts.value.scripts));

function roundDown(n: number): string {
  if (n >= 1000) return Math.floor(n / 1000) + "k";
  if (n >= 100) return Math.floor(n / 100) * 100 + "";
  if (n >= 10) return Math.floor(n / 10) * 10 + "";
  return n + "";
}
</script>
