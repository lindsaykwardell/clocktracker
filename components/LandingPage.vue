<template>
  <main
    class="w-full flex flex-col items-center justify-center gap-12 py-12 bg-gradient-to-b from-stone-800 via-stone-800 to-stone-950 text-white"
  >
    <img src="/logo.png" class="w-2/3 sm:w-[400px]" alt="ClockTracker" />
    <div class="flex flex-col gap-2">
      <Button
        component="nuxt-link"
        to="/login"
        icon="mail"
        size="lg"
        color="primary"
        wide
      >
        <span>Continue with e-mail</span>
      </Button>
      <LoginWithDiscord />
    </div>
    <h1
      class="text-xl sm:text-2xl md:text-4xl font-bold font-sorts text-center"
    >
      Tell Your Clocktower Story
    </h1>
    <section
      class="w-11/12 md:max-w-[800px] bg-stone-900 text-xl p-4 border border-stone-950 shadow-xl"
    >
      <p>
        ClockTracker is a tool to record games of Blood on the Clocktower and
        connect with friends. Join hundreds of players in tracking your games,
        sharing your experiences, and improving your bluffs.
      </p>
    </section>
    <section
      class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
    >
      <img src="/img/home-grid.png" class="aspect-video w-96 object-cover" />
      <p class="text-lg w-11-12 md:w-1/2">
        Record your games and share them with your friends. Look back at the
        games you've played, and remember the best experiences you've had with
        your friends.
      </p>
    </section>
    <section
      class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
    >
      <img src="/img/home-games.png" class="aspect-video w-96 object-cover" />
      <p class="text-lg w-11-12 md:w-1/2">
        Share your games with your friends, and see what games they have played!
        Record your roles throughout the game, which script was played, and
        other details.
      </p>
    </section>
    <section
      class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
    >
      <img
        src="/img/home-notes-images.png"
        class="aspect-video w-96 object-cover"
      />
      <p class="text-lg w-11-12 md:w-1/2">
        You can also add notes about the game, upload images to remember your
        favorite moments, and record a full grimoire of the game.
      </p>
    </section>
    <section
      class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
    >
      <img src="/img/home-stats.png" class="aspect-video w-96 object-cover" />
      <p class="text-lg w-11-12 md:w-1/2">
        Don’t let the data define you, use it and improve your game. Track what
        scripts and roles you play, and see how you perform over time.
      </p>
    </section>
    <section
      class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
    >
      <img
        src="/img/home-follow.png"
        class="aspect-video w-96 object-cover object-top"
      />
      <p class="text-lg w-11-12 md:w-1/2">
        Follow your friends and see what scripts they've been trying out! You
        can also follow your favorite creators and see what they've been up to
        recently to bring back to your own games.
      </p>
    </section>
    <h1
      class="text-xl sm:text-2xl md:text-4xl font-bold font-sorts text-center"
    >
      What will your story be?
    </h1>
    <div class="flex flex-col gap-2">
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
  </main>
  <footer class="pb-4 text-center text-stone-500 bg-stone-950">
    This project is not affiliated with The Pandemonium Institute. All roles are
    the property of Steven Medway and The Pandemonium Institute.
  </footer>
</template>
