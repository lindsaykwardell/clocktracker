<template>
  <template v-if="!user">
    <main
      class="w-full flex flex-col items-center justify-center gap-12 py-12 bg-gradient-to-b from-stone-800 via-stone-800 to-stone-950"
    >
      <img src="/logo.png" class="w-2/3 sm:w-[400px]" alt="ClockTracker" />
      <div class="flex flex-col gap-2">
        <LoginWithDiscord />
        <nuxt-link
          to="/login"
          class="text-center text-lg w-[300px] bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
        >
          <Email />
          <span>Login with Email</span>
        </nuxt-link>
      </div>
      <h1
        class="text-xl sm:text-2xl md:text-4xl font-bold font-dumbledor text-center"
      >
        Tell Your Clocktower Story
      </h1>
      <section
        class="w-11/12 md:max-w-[800px] bg-stone-900 text-lg p-4 border border-stone-950 shadow-xl"
      >
        <p>
          ClockTracker is an app to help you track your games of Blood on the
          Clocktower. It allows you to record your games, and see what your
          friends have been playing. You can also see what scripts and roles
          you've been playing, and how you've been performing over time.
        </p>
      </section>
      <section
        class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
      >
        <img src="/img/home-grid.png" class="aspect-video w-96 object-cover" />
        <p class="text-lg w-11-12 md:w-1/2">
          Record your games and share them with your friends. See what games you
          have played over time, and remember the best experiences you've had
          with your friends.
        </p>
      </section>
      <section
        class="w-11/12 md:max-w-[1000px] flex flex-col md:flex-row gap-4 justify-between items-center"
      >
        <img src="/img/home-games.png" class="aspect-video w-96 object-cover" />
        <p class="text-lg w-11-12 md:w-1/2">
          Share your games with your friends, and see what games they have
          played! Record your roles throughout the game, which script was
          played, and other details.
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
          Don’t let the data define you, use it and improve your game. Track
          what scripts and roles you play, and see how you perform over time.
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
        class="text-xl sm:text-2xl md:text-4xl font-bold font-dumbledor text-center"
      >
        What will your story be?
      </h1>
      <div class="flex flex-col gap-2">
        <LoginWithDiscord />
        <nuxt-link
          to="/login"
          class="text-center text-lg w-[300px] bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded flex justify-center gap-4 items-center"
        >
          <Email />
          <span>Login with Email</span>
        </nuxt-link>
      </div>
    </main>
    <footer class="pb-4 text-center text-stone-500 bg-stone-950">
      This project is not affiliated with The Pandemonium Institute. All roles
      are the property of Steven Medway and The Pandemonium Institute.
    </footer>
  </template>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

definePageMeta({
  middleware: "guest",
});

watchEffect(() => {
  if (user.value) {
    router.push("/welcome");
  }
});
</script>
