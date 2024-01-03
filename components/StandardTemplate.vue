<template>
  <div class="flex relative">
    <nav
      class="flex flex-col gap-3 p-2 rounded md:rounded-none rounded-l-none md:pb-0 fixed md:sticky top-0 md:h-screen bg-stone-900 md:w-[175px] z-50"
      :class="{
        'h-screen w-screen': showMenu,
      }"
    >
      <button @click="showMenu = !showMenu" class="md:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
        >
          <path
            fill="currentColor"
            d="M4 6h24v2H4zm0 18h24v2H4zm0-12h24v2H4zm0 6h24v2H4z"
          />
        </svg>
      </button>
      <section
        class="h-full pb-3"
        :class="{
          'hidden md:flex flex-col items-center': !showMenu,
          'flex flex-col items-center': showMenu,
        }"
      >
        <nuxt-link
          id="clocktracker-icon"
          to="/"
          class="flex items-center gap-4"
        >
          <img
            src="/logo-ct-sm.png"
            class="w-[75px] rounded-full"
            alt="ClockTracker"
          />
        </nuxt-link>
        <template v-if="user">
          <NavLink id="my-profile" to="/" icon="innkeeper">
            My Profile
          </NavLink>
          <NavLink id="search" to="/search" icon="investigator">
            Search
          </NavLink>
          <NavLink id="add-game" to="/add-game" icon="mezepheles">
            Add Game
          </NavLink>
          <NavLink
            id="friends"
            to="/friends"
            icon="eviltwin"
            :notificationCount="friends.getRequestCount(user.id)"
          >
            Friends
          </NavLink>
          <NavLink id="communities" to="/community" icon="cultleader">
            Communities
          </NavLink>
          <NavLink id="settings" to="/settings" icon="tinker">
            Settings
          </NavLink>
          <NavLink to="/logout" icon="balloonist"> Logout </NavLink>
        </template>
        <template v-else>
          <NavLink to="/login" icon="balloonist"> Login </NavLink>
        </template>
        <div class="flex-grow" />
        <a
          id="discord"
          href="https://discord.gg/KwMz8ThamT"
          class="text-stone-200 hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
        >
          <div class="w-[50px] flex justify-center">
            <Discord />
          </div>
          <span class="w-16">Community</span>
        </a>
        <a
          href="https://ko-fi.com/pdxbotc"
          class="text-stone-200 hover:text-stone-100 hover:underline flex gap-2 items-center whitespace-nowrap w-full py-1"
        >
          <div class="w-[50px] flex justify-center">
            <KoFi />
          </div>
          <span class="w-16">Donate</span>
        </a>
      </section>
    </nav>
    <main class="flex-grow">
      <slot />
    </main>
  </div>
  <Tour v-if="user" :steps="tour" tourKey="new-community-nav-item" />
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const friends = useFriends();

const showMenu = ref(false);

const tour: Step[] = [
  {
    target: "#clocktracker-icon",
    content:
      "Welcome to ClockTracker! You can see your friends, communities, and games here. Let's walk through some of the features available to you.",
  },
  {
    target: "#my-profile",
    content:
      "This is your profile. You can see your recorded games and personalized stats here.",
  },
  {
    target: "#search",
    content:
      "You can search for users and communities, and connect with the people that you play with.",
  },
  {
    target: "#add-game",
    content:
      "You can add a game and record as much or as little data about your playthrough as you would like. You can use the base scripts, one of the community scripts, or just add whatever characters you want from a custom script.",
  },
  {
    target: "#friends",
    content:
      "You can see your friends here. You can also see friend requests and send friend requests.",
  },
  {
    target: "#communities",
    content:
      "Communities are a new feature to connect with your friends. You can create a community and invite your friends to join. Once you have a community, you can see what scripts your friends have been playing and discuss them.",
  },
  {
    target: "#settings",
    content:
      "You can change your settings here. You can change your display name, username, password, as well as connect ClockTracker to sites like BoardGameGeek.",
  },
  {
    target: "#discord",
    content:
      "You can join the ClockTracker Discord server here. You can ask questions, report bugs, or just chat with other ClockTracker users.",
  },
  {
    target: "#anchor-center",
    content:
      "That's it! You're ready to start using ClockTracker. If you have any questions, feel free to reach out on Discord.",
  },
];
</script>
