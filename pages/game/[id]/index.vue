<template>
  <StandardTemplate>
    <template
      v-if="game.status === Status.SUCCESS && player.status === Status.SUCCESS"
    >
      <div
        v-if="isMe && me.status === Status.SUCCESS && (isNew || isUpdate)"
        class="bg-blue-100 px-4 py-2 text-blue-800"
      >
        <div class="flex items-center gap-2">
          <img src="/img/role/48x48/good.webp" class="w-6 h-6" />
          <div>
            {{ isNew ? "Game added!" : "Game updated!" }}
            <template v-if="isNew">
              <nuxt-link to="/add-game" class="underline"
                >Add another game</nuxt-link
              >
              or
              <nuxt-link
                :to="`/@${me.data.username}?view=games`"
                class="underline"
              >
                view all games
              </nuxt-link>
            </template>
            <template v-if="isUpdate">
              <nuxt-link
                :to="`/@${me.data.username}?view=games`"
                class="underline"
              >
                View all games
              </nuxt-link>
            </template>
          </div>
        </div>
      </div>
      <section
        class="flex flex-col gap-4 bg-gradient-to-b from-stone-200 to-stone-400 dark:from-stone-100 dark:to-stone-300 text-black w-full lg:w-4/5 m-auto my-4 rounded shadow-lg relative"
      >
        <div
          class="metadata flex flex-col-reverse md:flex-row items-center md:items-start px-4 pt-4"
        >
          <div class="flex-grow flex flex-col w-full">
            <div class="flex flex-col md:flex-row gap-4 items-center">
              <Avatar
                :value="player.data.avatar || ''"
                class="border-2 shadow-xl"
                :class="{
                  'border-blue-600': last_character?.alignment === 'GOOD',
                  'border-red-600': last_character?.alignment === 'EVIL',
                }"
              />
              <div class="flex-grow">
                <h2 class="text-3xl font-sorts">
                  <nuxt-link
                    class="hover:underline"
                    :to="`/@${player.data.username}`"
                  >
                    {{ player.data.display_name }}
                  </nuxt-link>
                </h2>
                <div class="flex flex-col md:flex-row gap-2">
                  <div
                    v-if="game.data.is_storyteller"
                    class="font-sorts text-xl font-bold bottom-[20px]"
                  >
                    Storyteller
                  </div>
                  <div
                    v-for="(character, i) in game.data.player_characters"
                    class="font-sorts text-xl font-bold bottom-[20px]"
                    :class="{
                      'text-blue-800': character.alignment === 'GOOD',
                      'text-red-800': character.alignment === 'EVIL',
                    }"
                  >
                    {{ character.name }}
                    <template v-if="character.related">
                      ({{ character.related }})
                    </template>
                    <template
                      v-if="i !== game.data.player_characters.length - 1"
                    >
                      ➡
                    </template>
                  </div>
                </div>
                <div class="flex gap-1 items-center">
                  <div v-if="isFavorite(game.data)">
                    <Star class="w-5 text-primary" />
                  </div>
                  <time
                    :datetime="dayjs(game.data.date).toISOString()"
                    class="text-sm"
                  >
                    {{ formatDate(game.data.date) }}
                  </time>
                </div>
              </div>
              <div
                v-if="
                  last_character.name || last_character.alignment !== 'NEUTRAL'
                "
                class="font-sorts text-2xl"
              >
                <template v-if="!game.data.is_storyteller">
                  <nuxt-link
                    :to="`/roles/${last_character?.role_id}`"
                    class="hover:underline flex flex-col items-center"
                  >
                    <Token :character="last_character" size="md" />
                  </nuxt-link>
                </template>
                <template v-else>
                  <div class="flex flex-col items-center">
                    <Token :character="last_character" size="md" />
                  </div>
                </template>
              </div>
            </div>
            <div class="flex flex-col md:flex-row gap-4 mt-4">
              <label class="flex gap-3 items-center">
                <span>Script</span>
                <div class="inline-flex gap-1 items-center">
                  <nuxt-link
                    class="hover:underline text-blue-800 hover:text-blue-700"
                    :to="games.getScriptLink(game.data)"
                  >
                    {{ game.data.script }}
                  </nuxt-link>
                  <template
                    v-if="
                      game.data.associated_script?.version &&
                      !isBaseScript(game.data.script)
                    "
                  >
                    <span class="inline-flex items-center rounded-sm bg-black/10 text-gray-800 text-xs font-medium badge">
                      <template v-if="game.data.ls_game_id">
                        Game {{ game.data.associated_script.version }}
                      </template>
                      <template v-else>
                        {{ game.data.associated_script.version }}
                      </template>
                    </span>
                  </template>
                </div>
              </label>
              <label v-if="storytellers.length" class="flex gap-3 items-center">
                <span
                  >Storyteller{{ storytellers.length === 1 ? "" : "s" }}</span
                >
                <div>
                  <template v-for="(storyteller, index) in storytellers">
                    <nuxt-link
                      v-if="
                        isStorytellerAFriend(storyteller) &&
                        storyteller.includes('@')
                      "
                      class="hover:underline text-blue-800 hover:text-blue-700"
                      :to="`/${storyteller}`"
                    >
                      {{ storyteller }}
                    </nuxt-link>
                    <template v-else>{{ storyteller }}</template>
                    <template v-if="index !== storytellers.length - 1"
                      >,
                    </template>
                  </template>
                </div>
              </label>
              <label
                v-if="game.data.player_count"
                class="flex gap-3 items-center"
              >
                <span>Players</span>
                {{ game.data.player_count }}
              </label>
              <label
                v-if="game.data.traveler_count"
                class="flex gap-3 items-center"
              >
                <span>Travelers</span>
                {{ game.data.traveler_count }}
              </label>
            </div>
            <div class="flex flex-col md:flex-row gap-4 mt-4 justify-start">
              <label
                v-if="game.data.community_name"
                class="flex gap-3 items-center"
              >
                <span>Community</span>
                <Avatar
                  v-if="game.data.community?.icon"
                  :value="game.data.community.icon"
                  size="xs"
                  class="border-stone-800 flex-shrink"
                />

                <nuxt-link
                  v-if="game.data.community?.slug"
                  class="hover:underline text-blue-800 hover:text-blue-700"
                  :to="`/community/${game.data.community.slug}`"
                >
                  {{ game.data.community_name }}
                </nuxt-link>
                <div v-else>{{ game.data.community_name }}</div>
              </label>
              <label class="flex gap-3 items-center">
                <span>Location</span>
                {{
                  game.data.location_type === "IN_PERSON"
                    ? "In Person"
                    : "Online"
                }}
                {{ game.data.location ? ` (${game.data.location})` : "" }}
              </label>
              <label
                v-if="game.data?.win_v2 !== WinStatus_V2.NOT_RECORDED"
                class="flex gap-3 items-center"
              >
                <span class="block">Result</span>
                {{
                  game.data?.win_v2 === WinStatus_V2.GOOD_WINS
                    ? "Good Wins"
                    : "Evil Wins"
                }}
              </label>
              <label
                v-if="game.data.ls_game?.campaign"
                class="flex gap-3 items-center"
              >
                <img src="/img/living-scripts.webp" class="w-6 h-6" />
                <span class="block">Campaign</span>
                <a
                  class="hover:underline text-blue-800 hover:text-blue-700"
                  :href="`https://chillclocktower.com/living-script/campaign.php?view=${game.data.ls_game.campaign.id}`"
                  target="_blank"
                >
                  {{ game.data.ls_game.campaign.title }}
                </a>
              </label>
              <label
                v-if="game.data.parent_game"
                class="flex gap-3 items-center"
              >
                <span class="block">Tagged By</span>
                <nuxt-link
                  class="hover:underline text-blue-800 hover:text-blue-700"
                  :to="`/@${game.data.parent_game.user.username}`"
                >
                  {{ game.data.parent_game.user.display_name }}
                </nuxt-link>
              </label>
            </div>            
            <div
              v-if="game.data.demon_bluffs.length || game.data.fabled.length"
              class="flex flex-col md:flex-row gap-4 mt-4 justify-start"
            >
              <label
                v-if="game.data.demon_bluffs.length"
                class="flex gap-3 items-center"
              >
                <span class="block">Demon Bluffs</span>
                <div class="flex flex-wrap gap-2">
                  <a
                    v-for="bluff in game.data.demon_bluffs"
                    :href="`/roles/${bluff.role_id}`"
                    class="block"
                    target="_blank"
                  >
                    <Token :key="bluff.id" :character="bluff" size="sm" />
                  </a>
                </div>
              </label>
              <label
                v-if="game.data.fabled.length"
                class="flex gap-3 items-center"
              >
                <span class="block">
                  <template
                    v-if="
                      game.data.fabled.some((r) => r.role?.type === 'FABLED')
                    "
                  >
                    Fabled
                  </template>
                  <template
                    v-if="
                      game.data.fabled.some((r) => r.role?.type === 'FABLED') &&
                      game.data.fabled.some((r) => r.role?.type === 'LORIC')
                    "
                  >
                    {{ " " }}&{{ " " }}
                  </template>
                  <template
                    v-if="
                      game.data.fabled.some((r) => r.role?.type === 'LORIC')
                    "
                  >
                    Loric
                  </template>
                </span>
                <div class="flex flex-wrap gap-2">
                  <a
                    v-for="fabled in game.data.fabled"
                    :key="fabled.id"
                    :href="`/roles/${fabled.role_id}`"
                    target="_blank"
                    class="block"
                  >
                    <Token :key="fabled.id" :character="fabled" size="sm" />
                  </a>
                </div>
              </label>
            </div>
            <div v-if="game.data.bgg_id" class="flex flex-wrap gap-2 mt-4">
              <a
                class="flex gap-1 items-center hover:underline text-blue-800 hover:text-blue-700"
                target="_blank"
                :href="`https://boardgamegeek.com/play/details/${game.data.bgg_id}`"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  class="text-[#ff5100]"
                >
                  <path
                    fill="currentColor"
                    d="m19.7 4.44l-2.38.64L19.65 0L4.53 5.56l.83 6.67l-1.4 1.34L8.12 24l8.85-3.26l3.07-7.22l-1.32-1.27l.98-7.81Z"
                  />
                </svg>
                BoardGameGeek
              </a>
            </div>
            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="tag in game.data.tags"
                class="bg-stone-300 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
              >
                <span>{{ tag }}</span>
              </span>
              <span
                v-if="game.data.ignore_for_stats"
                class="inline-flex gap-1 items-center px-2 py-1 rounded bg-red-700/60 text-white badge"
              >
                <IconUI id="disabled"/>Ignored for Stats
              </span>
            </div>
          </div>
          <img
            :src="
              game.data.associated_script?.logo ?? scriptLogo(game.data.script)
            "
            class="w-48 md:w-64 h-48 md:h-64"
          />
        </div>
        <div v-if="game.data.notes || game.data.image_urls.length" class="px-4">
          <h3 class="font-sorts text-2xl">Notes and Images</h3>
          <div
            v-if="game.data.notes"
            class="notes bg-stone-100 p-4 shadow-lg my-3"
          >
            <VueMarkdown :source="game.data.notes" />
          </div>
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap gap-5">
              <div v-for="file in game.data.image_urls" :key="file">
                <a
                  :href="fullImageUrl(file)"
                  target="_blank"
                  class="w-full sm:w-1/2 md:w-64 md:h-64"
                >
                  <img
                    :src="fullImageUrl(file)"
                    class="w-full sm:w-1/2 md:w-64 md:h-64 object-cover shadow-lg"
                    crossorigin="anonymous"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="
            game.data.grimoire[0] &&
            game.data.grimoire[0].tokens.some(
              (token) => token.player_name.length > 0 || token.role
            )
          "
          :style="
            game.data.associated_script?.background
              ? { '--bg-image-url' : `url(${game.data.associated_script.background})` }
              : {}
          "
          class="grimoire bg-center bg-cover relative text-white script-bg"
          :class="{
            ...scriptBgClasses(
              game.data.script,
              !!game.data.associated_script?.background
            ),
          }"
        >
          <button
            type="button"
            @click="grimPage -= 1"
            v-if="grimPage !== 0"
            class="absolute bottom-0 left-1 flex items-center font-sorts z-10"
          >
            <span
              class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
            >
              {{ "<" }} Previous page
            </span>
          </button>
          <button
            v-if="grimPage !== game.data.grimoire.length - 1"
            type="button"
            @click="grimPage += 1"
            class="absolute bottom-0 right-1 flex items-center font-sorts z-10"
          >
            <span
              class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
            >
              Next page
              {{ ">" }}
            </span>
          </button>
          <div class="w-screen md:w-full overflow-scroll">
            <Grimoire
              :tokens="game.data.grimoire[grimPage].tokens"
              readonly
              :canClaimSeat="canClaimSeat"
              @claimSeat="claimSeat"
            />
            <div
              v-if="grimPage === game.data.grimoire.length - 1"
              class="winning-team"
              :class="
                game.data?.win_v2 === WinStatus_V2.GOOD_WINS ? 'good' : 'evil'
              "
            >
              <span>
                {{
                  game.data?.win_v2 === WinStatus_V2.GOOD_WINS ? "Good" : "Evil"
                }}
              </span>
              won!
            </div>
          </div>
          <div
            class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800"
          >
            Page {{ grimPage + 1 }} of {{ game.data.grimoire.length }}
          </div>
        </div>
        <Dialog v-model:visible="showSimilarGamesDialog" size="lg">
          <template #title>
            <h2 class="text-2xl font-sorts">Similar Games</h2>
          </template>
          <GameOverviewGrid
            :games="similarGames"
            :onCardClick="confirmMergeGame"
          />
        </Dialog>
        <div v-if="isMe" class="absolute top-1 right-3" id="menu-controls">
          <Menu v-slot="{ open }">
            <MenuButton>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 16 16"
                class="w-6"
              >
                <path
                  fill="#000"
                  d="M3 9.5a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3a1.5 1.5 0 0 1 0 3"
                />
              </svg>
            </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-out"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div v-show="open || showMenuForTour">
                <MenuItems
                  static
                  class="absolute right-0 z-10 bg-stone-100 dark:bg-stone-900 rounded shadow-md whitespace-nowrap flex flex-col items-start min-w-[150px] divide-y divide-stone-500 dark:divide-stone-700 overflow-hidden"
                >
                  <div
                    v-if="
                      game.data.waiting_for_confirmation ||
                      similarGames.length > 0
                    "
                    class="w-full"
                  >
                    <MenuItem v-if="game.data.waiting_for_confirmation">
                      <button
                        @click="confirmGame"
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-2 min-h-[32px]"
                      >
                        Add game to my Profile
                      </button>
                    </MenuItem>
                    <MenuItem v-if="similarGames.length > 0">
                      <button
                        @click="showSimilarGamesDialog = true"
                        :disabled="mergeInFlight"
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-2 min-h-[32px]"
                      >
                        Merge with similar game
                      </button>
                    </MenuItem>
                  </div>
                  <div class="w-full">
                    <MenuItem>
                      <button
                        @click="toggleFavorite"
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-1 py-1"
                      >
                        <Star class="w-5 text-primary" />
                        <div id="favorite-game">Mark as Favorite</div>
                      </button>
                    </MenuItem>
                    <MenuItem v-if="!game.data.waiting_for_confirmation">
                      <nuxt-link
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                        :to="`/game/${route.params.id}/edit`"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 32 32"
                          class="w-4"
                        >
                          <path
                            fill="currentColor"
                            d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-15 15V24h6.4l15-15zm-5-5L24 7.6l-3 3L17.4 7l3-3zM6 22v-3.6l10-10l3.6 3.6l-10 10H6z"
                          />
                        </svg>
                        <div id="edit-game">Edit</div>
                      </nuxt-link>
                    </MenuItem>
                    <MenuItem>
                      <button
                        @click="deleteGame(false)"
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 512 512"
                          class="w-4"
                        >
                          <path
                            d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                            fill="currentColor"
                          />
                          <path d="M249 160h14v241h-14z" fill="currentColor" />
                          <path
                            d="M320 160h-14.6l-10.7 241h14.6z"
                            fill="currentColor"
                          />
                          <path
                            d="M206.5 160H192l10.7 241h14.6z"
                            fill="currentColor"
                          />
                        </svg>
                        <div id="delete-game">
                          <template v-if="game.data.waiting_for_confirmation"
                            >Ignore</template
                          >
                          <template v-else>Delete</template>
                        </div>
                      </button>
                    </MenuItem>
                    <MenuItem v-if="game.data.parent_game_id">
                      <button
                        @click="deleteGame(true)"
                        class="flex gap-1 w-full items-center dark:text-white text-sm px-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 512 512"
                          class="w-4"
                        >
                          <path
                            d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                            fill="currentColor"
                          />
                          <path d="M249 160h14v241h-14z" fill="currentColor" />
                          <path
                            d="M320 160h-14.6l-10.7 241h14.6z"
                            fill="currentColor"
                          />
                          <path
                            d="M206.5 160H192l10.7 241h14.6z"
                            fill="currentColor"
                          />
                        </svg>
                        <template v-if="game.data.waiting_for_confirmation"
                          >Ignore</template
                        >
                        <template v-else>Delete</template> and Untag Myself
                      </button>
                    </MenuItem>
                  </div>
                  <div class="w-full">
                    <MenuItem v-if="canPostToBGG">
                      <button
                        class="bg-[#3f3a60] hover:bg-[#2e2950] transition duration-150 text-white flex items-center w-full text-sm min-h-[32px]"
                        @click="initPostToBGG"
                        :disabled="bggInFlight"
                      >
                        <div class="w-6 ml-1">
                          <img
                            src="/img/bgg.png"
                            class="w-6 h-6 m-auto"
                            :class="{ 'animate-spin': bggInFlight }"
                          />
                        </div>
                        <span v-if="game.data.bgg_id">Delete from BGG</span>
                        <span v-else>Post to BGG</span>
                      </button>
                    </MenuItem>
                    <MenuItem v-if="canPostToBGStats">
                      <a
                        :href="bgStatsLink"
                        class="bg-[#333] transition duration-150 dark:text-white flex items-center w-full gap-1 text-sm min-h-[32px]"
                      >
                        <img
                          src="https://clocktracker.app/img/bgstats.png"
                          class="w-5 h-5 ml-1"
                        />
                        Post to BGStats
                      </a>
                    </MenuItem>
                  </div>
                </MenuItems>
              </div>
            </transition>
          </Menu>
        </div>
        <Tour
          v-if="user?.id && game.data.user_id === user.id"
          :steps="tour"
          tourKey="game-viewer-v2"
          @onTourEnd="showMenuForTour = false"
        />
      </section>
    </template>
    <template v-else>
      <Loading class="h-screen" />
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
import { WinStatus_V2 } from "~/composables/useGames";
import type { GameRecord } from "~/composables/useGames";
import dayjs from "dayjs";
import VueMarkdown from "vue-markdown-render";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { Status } from "~/composables/useFetchStatus";

const { scriptLogo, isBaseScript, scriptBgClasses } = useScripts();
const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const user = useSupabaseUser();
const users = useUsers();
const communities = useCommunities();
const games = useGames();
const friends = useFriends();
const gameId = route.params.id as string;
const { bggInFlight, canPostToBGG, postToBGG } = useBGG();
const mergeInFlight = ref(false);
const me = useMe();

const isNew = route.query.new === "true";
const isUpdate = route.query.updated === "true";

if (isNew || isUpdate) {
  // Update the route query params to remove them
  router.replace({
    query: {
      ...route.query,
      new: undefined,
      updated: undefined,
    },
  });
}

const game = computed(() => games.getGame(gameId));
const player = computed<FetchStatus<User>>(() => {
  if (game.value.status !== Status.SUCCESS) return { status: Status.LOADING };

  return users.getUser(game.value.data.user.username);
});
const grimPage = ref(
  game.value.status === Status.SUCCESS ? game.value.data.grimoire.length - 1 : 0
);
const similarGames = computed(() => games.getSimilarGames(gameId));
const showSimilarGamesDialog = ref(false);

const { canPostToBGStats, link: bgStatsLink } = useBGStats(game);

const isMe = computed(() => {
  if (user.value && game.value.status === Status.SUCCESS) {
    return user.value.id === game.value.data.user_id;
  }

  return false;
});

watchEffect(() => {
  if (
    game.value.status === Status.ERROR ||
    player.value.status === Status.ERROR
  ) {
    showError({
      statusCode: 404,
      message: `Game not found`,
      fatal: true,
    });
  }
});

watchEffect(() => {
  if (game.value.status === Status.SUCCESS) {
    if (player.value.status !== Status.SUCCESS) {
      users.fetchUser(game.value.data.user.username);
    }
    grimPage.value = game.value.data.grimoire.length - 1;
  }
});

const gameMetadata = await useFetch(`/api/games/${gameId}/minimal`);

if (gameMetadata.error.value) {
  throw gameMetadata.error.value;
}

useHead({
  title: `${gameMetadata.data.value!.user!.display_name} | ${
    gameMetadata.data.value!.script
  }`,
  meta: [
    {
      hid: "description",
      name: "description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:title",
      content: `${gameMetadata.data.value!.user!.display_name} | ${
        gameMetadata.data.value!.script
      }`,
    },
    {
      property: "og:description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "og:image",
      content:
        gameMetadata.data.value?.associated_script?.logo ??
        scriptLogo(gameMetadata.data.value!.script as string),
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
      content: `${gameMetadata.data.value!.user!.display_name} | ${
        gameMetadata.data.value!.script
      }`,
    },
    {
      property: "twitter:description",
      content: `Game of ${gameMetadata.data.value!.script} played by ${
        gameMetadata.data.value!.user!.display_name
      } on ${dayjs(gameMetadata.data.value!.date).format("MMMM D, YYYY")}.`,
    },
    {
      property: "twitter:image",
      content:
        gameMetadata.data.value?.associated_script?.logo ??
        scriptLogo(gameMetadata.data.value!.script as string),
    },
  ],
});

const last_character = computed(() => {
  return games.getLastCharater(gameId);
});

function isStorytellerAFriend(storyteller: string) {
  if (friends.isFriend(storyteller.replace("@", "") || "")) {
    return true;
  }

  const storytellerUser = users.getUser(storyteller.replace("@", "") || "");

  // If it's me, I'm a friend of myself.
  if (
    storytellerUser.status === Status.SUCCESS &&
    storytellerUser.data.user_id === user.value?.id
  ) {
    return true;
  }

  return false;
}

const storytellers = computed(() => {
  if (game.value.status !== Status.SUCCESS) return [];

  const storytellerList = [];

  if (game.value.data.is_storyteller) {
    storytellerList.push(`@${game.value.data.user.username}`);
  }

  if (game.value.data.storyteller) {
    storytellerList.push(game.value.data.storyteller);
  }

  return [...storytellerList, ...game.value.data.co_storytellers];
});

const canClaimSeat = computed(() => {
  if (game.value.status !== Status.SUCCESS) return false;

  /** Reasons to disallow claimining the seat:
   * 1. The user is not signed in
   * 2. The user is not a friend of the game creator
   * 3. The user is not in a community with the game creator
   * 4. The user is a storyteller
   * 5. The user is a co-storyteller
   * 6. The user already has a seat in the grimoire
   */

  if (me.value.status !== Status.SUCCESS) return false;

  // Check if the user is a friend of the game creator
  if (
    !friends.isFriend(game.value.data.user.username) &&
    !(
      game.value.data.community?.slug &&
      communities.isMember(
        game.value.data.community.slug,
        me.value.data.user_id
      )
    )
  ) {
    return false;
  }

  // Check if the user is a storyteller or co-storyteller
  if (
    (game.value.data.is_storyteller &&
      game.value.data.user_id === me.value.data.user_id) ||
    game.value.data.storyteller === me.value.data.username ||
    game.value.data.co_storytellers.includes(me.value.data.username)
  ) {
    return false;
  }

  // Check if the user already has a seat in the grimoire
  if (
    game.value.data.grimoire.some((page) =>
      page.tokens.some(
        (token) =>
          me.value.status === Status.SUCCESS &&
          token.player_id === me.value.data.user_id
      )
    )
  ) {
    return false;
  }

  return true;
});

function fullImageUrl(file: string) {
  if (file.startsWith("http")) return file;
  return `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${file}`;
}

async function deleteGame(alsoUntagMyself: boolean) {
  if (
    confirm(
      `Are you sure you want to delete this game${
        alsoUntagMyself ? " and untag yourself" : ""
      }?`
    )
  ) {
    await games.deleteGame(gameId, alsoUntagMyself);

    router.push(`/`);
  }
}

async function confirmGame() {
  if (confirm("Are you sure you want to add this game to your profile?")) {
    const result = await $fetch<GameRecord>(`/api/games/${gameId}/confirm`, {
      method: "POST",
    });

    games.games.set(gameId, { status: Status.SUCCESS, data: result });
  }
}

async function confirmMergeGame(game: GameRecord) {
  if (confirm("Are you sure you want to merge these games?")) {
    mergeInFlight.value = true;
    const result = await $fetch<GameRecord>(`/api/games/${gameId}/merge`, {
      method: "POST",
      body: game,
    });

    games.games.delete(game.id);

    games.games.set(gameId, { status: Status.SUCCESS, data: result });
    mergeInFlight.value = false;
    showSimilarGamesDialog.value = false;
  }
}

const anonymize = ref(false);

watchEffect(() => {
  if (me.value.status === Status.SUCCESS) {
    anonymize.value = me.value.data.privacy === "PRIVATE";
  }
});

async function initPostToBGG() {
  if (game.value.status !== Status.SUCCESS) return;

  await postToBGG(game.value.data, anonymize.value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));
}

function isFavorite(game: GameRecord) {
  const user = users.getUserById(game.user_id);

  if (user.status !== Status.SUCCESS) return false;

  return user.data.favorites.some((f) => f.game_id === game.id);
}

async function toggleFavorite() {
  if (me.value.status === Status.SUCCESS) {
    const result = await $fetch(`/api/games/${gameId}/favorite`, {
      method: "POST",
    });

    if (result.status === "added") {
      me.value.data.favorites.push(result.data);
    } else {
      me.value.data.favorites = me.value.data.favorites.filter(
        (f) => f.game_id !== gameId
      );
    }
  }
}

async function claimSeat(token: { order: number }) {
  if (
    game.value.status !== Status.SUCCESS ||
    me.value.status !== Status.SUCCESS
  ) {
    return;
  }

  if (confirm("Are you sure you want to claim this seat?")) {
    try {
      const result = await $fetch<GameRecord>(
        `/api/games/${gameId}/claim_seat`,
        {
          method: "PUT",
          body: { order: token.order },
        }
      );

      games.games.set(gameId, { status: Status.SUCCESS, data: result });
    } catch (error: any) {
      alert(`There was a problem claiming this seat: ${error.statusMessage}`);
    }
  }
}

onMounted(() => {
  games.fetchGame(route.params.id as string).then(() => {
    if (game.value.status === Status.SUCCESS) {
      games.fetchSimilarGames(game.value.data.id);

      if (game.value.data.community?.slug) {
        communities.fetchCommunity(game.value.data.community.slug);
      }
    }
  });

  if (friends.friends.status !== Status.SUCCESS) {
    friends.fetchFriends();
  }
});

const showMenuForTour = ref(false);

const tour = [
  {
    target: "#menu-controls",
    content:
      "Here you can edit or delete this game, or post it to BoardGameGeek (if you have connected your account).",
    onNext: () => {
      showMenuForTour.value = true;
    },
  },
  {
    target: "#favorite-game",
    content:
      "You can mark this game as a favorite to display it on your profile, as well as find it more easily in your games list.",
  },
  {
    target: "#edit-game",
    content:
      "If you need to make any changes to this game, you can do so here.",
  },
  {
    target: "#delete-game",
    content:
      "You can also delete your game, but be careful! This action is permanent.",
  },
];
</script>

<style scoped>
.metadata label span {
  @apply text-sm text-stone-500;
}

.script-bg {
  background-image: var(--bg-image-url);

  &.is-trouble-brewing {
    --bg-image-url: url("/img/scripts/trouble-brewing-bg.webp");
  }

  &.is-sects-and-violets {
    --bg-image-url: url("/img/scripts/sects-and-violets-bg.webp");
  }

  &.is-bad-moon-rising {
    --bg-image-url: url("/img/scripts/bad-moon-rising-bg.webp");
  }

  &.is-custom-script {
    --bg-image-url: url("/img/scripts/custom-script-bg.webp");
  }

  &.is-unknown-script {
    --bg-image-url: url("/img/scripts/unknown-script-bg.webp");
  }
}

.winning-team {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
  font-size: clamp(1.944rem, 1.7405rem + 0.9044vw, 2.4414rem);
  font-family: "Times New Roman", serif;
  font-weight: 500;
  text-transform: uppercase;
  text-align: center;
  filter: drop-shadow(0 1px 0.25rem #000);
  line-height: 0.8;
  background: radial-gradient(
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0.2),
    rgba(0, 0, 0, 0),
    rgba(0, 0, 0, 0)
  );
  border-radius: 9999px;
  padding: 20px;

  &.evil {
    --color-winner-start: #ee4a05;
    --color-winner-end: #cc1a04;
  }

  &.good {
    --color-winner-start: #4ec4ea;
    --color-winner-end: #3186e4;
  }

  > span {
    display: block;
    font-size: clamp(2.3328rem, 1.5393rem + 3.5267vw, 4.2725rem);
    background-image: linear-gradient(
      0deg,
      var(--color-winner-end),
      var(--color-winner-start)
    );
    background-clip: text;
    color: transparent;
  }
}
</style>

<style>
.grimoire {
  .overflow-scroll {
    /* @todo Background image should be moved to this div, so it scrolls with tokens on mobile */
    /* background-attachment: local, local; */

    /* Compensate scrollbars (and page count) so tokens are centered */
    padding-inline-start: 1rem;
    padding-block-start: 2.5rem;

    /* scrollbar-width: thin; */
    scrollbar-color: oklch(44.4% 0.011 73.639) transparent;
    scrollbar-gutter: stable;
  }
}

.notes {
  h1 {
    @apply text-3xl font-sorts;
  }
  h2 {
    @apply text-2xl font-sorts;
  }
  h3 {
    @apply text-xl font-sorts;
  }
  h4 {
    @apply text-lg font-sorts;
  }
  h5 {
    @apply text-base font-sorts;
  }
  h6 {
    @apply text-sm font-sorts;
  }

  ul {
    @apply list-disc list-inside;
  }
  ol {
    @apply list-decimal list-inside;
  }
  li {
    @apply my-1;
  }
  li ul,
  li ol {
    @apply ml-4;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply my-4;
  }

  p,
  ul,
  ol,
  table,
  pre,
  img {
    @apply my-2;
  }

  table {
    @apply w-full;
    th {
      @apply bg-stone-300 font-bold;
    }
    tr {
      @apply border-b border-stone-300;
    }
    tr:nth-child(even) {
      @apply bg-stone-200;
    }
    td {
      @apply p-1;
    }
  }
  a {
    @apply text-blue-600 hover:underline;
  }
  hr {
    @apply my-4 border-stone-300;
  }
}
</style>
