<template>
  <div class="flex relative">
    <nav
      class="flex flex-col gap-3 p-2 rounded md:rounded-none rounded-l-none md:pb-0 fixed md:sticky top-0 md:h-screen bg-stone-900 md:w-[150px] z-50"
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
        <nuxt-link to="/" class="flex items-center gap-4">
          <img
            src="/logo-ct-sm.png"
            class="w-[75px] rounded-full"
            alt="ClockTracker"
          />
        </nuxt-link>
        <template v-if="user">
          <NavLink to="/" icon="innkeeper"> My Profile </NavLink>
          <NavLink to="/search" icon="investigator"> Search </NavLink>
          <NavLink
            to="/friends"
            icon="eviltwin"
            :notificationCount="friends.getRequestCount(user.id)"
          >
            Friends
          </NavLink>
          <NavLink to="/add-game" icon="mezepheles"> Add Game </NavLink>
          <NavLink to="/settings" icon="tinker"> Settings </NavLink>
          <NavLink to="/logout" icon="balloonist"> Logout </NavLink>
        </template>
        <template v-else>
          <NavLink to="/login" icon="balloonist"> Login </NavLink>
        </template>
        <div class="flex-grow" />
        <a
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
</template>

<script setup lang="ts">
const user = useSupabaseUser();
const friends = useFriends();

const showMenu = ref(false);
</script>
