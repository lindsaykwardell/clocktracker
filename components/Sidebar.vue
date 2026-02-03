<template>
  <div
    @click="toggleSidebar"
    id="overlay"
    class="w-screen h-screen fixed top-0 left-0 z-30 transition duration-300"
    :class="{
      'bg-black/25': !showMenu,
      'bg-transparent pointer-events-none': showMenu,
    }"
  ></div>
  <nav 
    id="sidebar"
    :class="showMenu ? 'closed' : 'open'"
  >
    <ul>
      <li>
        <div class="logo">
          <nuxt-link
            to="/"
            title="Home"
          >
            <ImageUI image="logo-ct" class="logo-ct w-[48px]"/>
          </nuxt-link>
          <span class="font-sorts logo-text flex flex-col gap-1">
            Clocktracker
            <div class="flex gap-1">
              <Socials size="xs" />
            </div>
          </span>
        </div>
      </li>

      <li v-if="me.status === Status.SUCCESS">
        <YearInReviewLink id="year-in-review" sidebar />
      </li>

      <li>
        <NavLink 
          id="dashboard" 
          to="/" 
          icon="innkeeper"
          title="Home"
        >
          Home
        </NavLink>
      </li>

      <template v-if="me.status === Status.SUCCESS">
        <li>
          <NavLink 
            id="add-game" 
            to="/add-game" 
            icon="mezepheles"
            title="Add Game"
          >
            Add Game
          </NavLink>
        </li>
        <li>
          <!-- @todo Maybe we should add a tagged games count? -->
          <NavLink
            id="my-games"
            :to="`/@${me.data.username}?view=games`"
            icon="bureaucrat"
            title="My Games"
          >
            <span>My Games</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            id="my-stats"
            :to="`/@${me.data.username}?view=stats`"
            icon="mathematician"
            title="My Stats"
          >
            <span>My Stats</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            id="friends"
            to="/friends"
            icon="eviltwin"
            title="My Friends"
            :notificationCount="friends.getRequestCount(me.data.user_id)"
          >
            My Friends
          </NavLink>
        </li>
        <li>
          <NavLink 
            id="communities" 
            to="/community" 
            icon="cultleader"
            title="My Communities"
          >
            My Communities
          </NavLink>
        </li>
        <!-- <li>
          <NavLink 
            id="events" 
            to="/events" 
            icon="mutant"
            title="My Events"
          >
            My Events
          </NavLink>
        </li> -->
      </template>
      <!-- @todo Add a link to a scripts overview page -->
      <!-- <li>
        <NavLink 
          id="scripts" 
          to="/scripts" 
          icon="steward"
          title="Scripts"
        >
          Scripts
        </NavLink>
      </li> -->
      <li>
        <NavLink 
          id="search" 
          to="/search" 
          icon="investigator"
          title="Search"
        >
          Search
        </NavLink>
      </li>
    </ul>
    <ul class="sidebar-bottom">
      <template v-if="me.status === Status.SUCCESS">
        <li>
          <NavLink 
            id="settings" 
            to="/settings" 
            icon="engineer"
            title="Settings"
          >
            Settings
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/logout" 
            icon="vigormortis"
            title="Logout"
          >
            Logout
          </NavLink>
        </li>
      </template>
      <template v-else>
        <NavLink 
          to="/login" 
          icon="ravenkeeper"
          title="Login"
        >
          Login
        </NavLink>
      </template>
      <li v-if="me.status === Status.SUCCESS">
        <nuxt-link
          id="my-profile"
          :to="`/@${me.data.username}`"
          :title="me.data.display_name"
        >
          <Avatar :value="me.data.avatar" size="sidebar" aria-hidden="true" />
          <span>
            {{ me.data.display_name }}
          </span>
        </nuxt-link>
      </li>
      <li
        v-if="me.status === Status.LOADING"
        class="flex items-center gap-2 p-2"
      >
        <Avatar value="/img/default.png" size="sidebar" aria-hidden="true" />
        <span>Loading...</span>
     </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
  const { showMenu, toggleSidebar } = useSidebarState();
  const me = useMe();
  const friends = useFriends();

</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
}
</style>

<style>
#sidebar {
  @apply flex flex-col;
  @apply bg-white dark:bg-black border-r border-stone-300 dark:border-stone-700/50;

  box-sizing: border-box;
  block-size: 100vh;
  block-size: 100dvh;
  inline-size: 250px;
  padding: 1rem 1em;
  position: sticky;
  inset-block-start: 0;
  align-self: start;
  overflow-x: hidden;
  overflow-y: auto;
  text-wrap: nowrap;
  transition-property: inline-size, min-inline-size, padding;
  transition-duration: 300ms;
  transition-timing-function: ease-in-out;
  scrollbar-width: thin;
  scrollbar-color: theme(colors.stone.200) transparent;
  scrollbar-gutter: stable;

  &:where(.dark, .dark *) {
    scrollbar-color: theme(colors.stone.800) transparent;
  }

  &.closed {
    padding: 0.5rem 5px;
    inline-size: 60px;

    .ct-badge {
      --size: calc(var(--tailwind-spacing) * 4);
      --badge-p: 0;
      --fontsize: .625rem;

      position: absolute;
      inset-block-end: -.25rem;
      inset-inline-start: 50%;
      transform: translateX(-50%);
    }
  }
}

#overlay {
  display: none;
}

@media(max-width: 640px){
  #sidebar {
    inline-size: calc(100dvw - 4rem);
    min-inline-size: 80dvw;
  }
}

@media(max-width: 800px){
  #sidebar {
    position: fixed;
    inline-size: calc(100dvw - 4rem);
    min-inline-size: unset;
    max-inline-size: 20rem;
    inset-block: 0;
    z-index: 9999;
    
    &.closed {
      inline-size: 0;
      min-inline-size: 0;
      padding: 0;
    }
  }

  #overlay {
    display: block;
  }

  /* Prevent scroll when open */
  html:has(#sidebar.open),
  body:has(#sidebar.open) {
    height: 100dvh !important;
    overflow: hidden !important;
  }
}

#sidebar ul {
  list-style: "";
}

#sidebar > ul > li {
  margin-block-end: 0.5rem;

  &:has(#sidebar-toggle) {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    margin-block-end: 0;
    padding-inline-start: 0.5rem;
  }
}

#sidebar ul li.active > a {
  color: var(--color-base-200);
}

#sidebar a, 
#sidebar .logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

#sidebar {
  .logo {
    margin-block-end: 1rem;
  }

  .logo-text {
    font-weight: 600;
    font-size: 1.125rem;
  }
}

#sidebar li > a {
  position: relative;
  border-radius: .5em;
  padding: .5rem;
  text-decoration: none;

  > span {
    flex-grow: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }
}

#sidebar li > a:not(.yir-bg) {
  color: var(--color-base-content);

  &:hover {
    background-color: theme(colors.purple.200);

    &:where(.dark, .dark *) {
      background-color: theme(colors.purple.950);
    }
  }
}

#sidebar img,
#sidebar svg {
  flex-shrink: 0;
  fill: var(--color-base-content);
}

#sidebar > ul.sidebar-bottom {
  @apply border-t border-stone-300 dark:border-stone-700/50;

  margin-block-start: auto;
  padding-block-start: .5rem;

  > li:last-child {
    margin-block-end: 0;
  }
}
</style>
