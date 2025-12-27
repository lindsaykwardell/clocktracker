<template>
  <form class="max-w-[1000px] m-auto py-6" @submit.prevent="emit('submit')">
    <fieldset
      class="flex flex-col gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Setup</legend>
      <div class="w-full flex flex-col md:flex-row gap-5">
        <label v-if="!editingMultipleGames" class="flex-1">
          <span class="block">Date</span>
          <Input type="date" v-model="game.date" required />
        </label>
        <label class="flex-1">
          <span class="block">Script</span>
          <div class="flex items-center gap-1">
            <div v-if="game.script" class="flex-grow">{{ game.script }}</div>
            <Button
              type="button"
              id="select-script"
              @click="showScriptDialog = !showScriptDialog"
              font-size="md"
              :class="{
                'w-full': !game.script,
                'flex-shrink': game.script,
              }"
            >
              <div class="w-[30px] overflow-hidden">
                <img src="/img/role/investigator.png" />
              </div>
              <template v-if="editingMultipleGames">Not updated</template>
              <template v-else-if="game.script === ''">Select Script</template>
            </Button>
          </div>
          <SelectScriptDialog
            v-model:visible="showScriptDialog"
            :scriptSelected="!!game.script"
            @selectScript="selectScript"
            @selectLSGame="selectLSGame"
          />
        </label>
        <div
          v-if="
            !isBaseScript(game.script) &&
            (scriptVersions.length > 1 || fetchingScriptVersions) &&
            game.ls_game_id === null
          "
          class="flex flex-col gap-1"
        >
          <label>
            <span class="block"> Script Version </span>
            <Input
              mode="select"
              v-if="!fetchingScriptVersions"
              v-model="game.script_id"
            >
              <option v-for="version in scriptVersions" :value="version.id">
                {{ version.version }}
              </option>
            </Input>
            <div v-else>Loading...</div>
          </label>
        </div>
        <div class="flex-1 flex flex-col justify-start">
          <label>
            <span class="block">Storyteller</span>
            <TaggedUserInput
              v-model:value="game.storyteller"
              :users="potentialCoStorytellers"
              :placeholder="editingMultipleGames ? 'Not updated' : ''"
            />
          </label>
          <div class="flex gap-3">
            <label class="flex whitespace-nowrap items-center gap-2">
              <input type="checkbox" v-model="game.is_storyteller" />
              <span class="block">I was a Storyteller</span>
            </label>
            <label
              v-if="editingMultipleGames"
              class="flex whitespace-nowrap items-center gap-2"
              :class="{
                'pointer-events-none': noChangeToIsStoryteller,
              }"
            >
              <input type="checkbox" v-model="noChangeToIsStoryteller" />
              <span class="block">Not updated</span>
            </label>
          </div>
        </div>
        <div class="flex-1 flex flex-col gap-1 justify-center">
          <div v-for="(st, index) in game.co_storytellers" class="flex gap-2">
            <TaggedUserInput
              v-model:value="game.co_storytellers[index]"
              :users="potentialCoStorytellers"
            />
            <button
              type="button"
              @click="game.co_storytellers.splice(index, 1)"
            >
              X
            </button>
          </div>
          <button
            type="button"
            @click="game.co_storytellers.push('')"
            class="w-full"
          >
            Add Storyteller
          </button>
        </div>
      </div>
      <div class="w-full flex flex-wrap gap-5">
        <label class="w-full md:w-auto">
          <span class="block">Privacy</span>
          <Input mode="select" v-model="game.privacy">
            <option v-if="editingMultipleGames" value="">Not updated</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="FRIENDS_ONLY">Friends Only</option>
          </Input>
        </label>
        <label class="w-full md:w-auto">
          <span class="block">Location Type</span>
          <Input mode="select" v-model="game.location_type">
            <option v-if="editingMultipleGames" :value="undefined">
              Not updated
            </option>
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In Person</option>
          </Input>
        </label>
        <label
          v-if="game.location_type === 'IN_PERSON'"
          class="w-full md:w-auto md:flex-1"
        >
          <span class="block">Location</span>
          <Input type="text" v-model="game.location" list="locations" />
          <datalist id="locations">
            <option v-for="location in myLocations" :value="location"></option>
          </datalist>
        </label>
        <label class="w-full md:w-auto md:flex-1">
          <span class="block">Community</span>
          <div class="flex gap-2">
            <Avatar
              v-if="game.community_id"
              :value="
                myCommunities.find((c) => c.id === game.community_id)?.icon
              "
              size="xs"
              class="border-stone-800 flex-shrink"
            />
            <SelectedCommunityInput
              v-model:value="game.community_name"
              :communities="myCommunities"
              inputClass="w-full border border-stone-500 rounded-md p-2 h-[2.5rem] text-lg bg-stone-600 disabled:bg-stone-700"
              :placeholder="editingMultipleGames ? 'Not updated' : ''"
            />
          </div>
        </label>
        <label class="w-1/3 md:w-auto">
          <span class="block">Players</span>
          <Input mode="select" v-model="game.player_count">
            <option :value="null">
              <template v-if="editingMultipleGames">Not updated</template>
            </option>
            <option v-for="i in 16" :value="i + 4">{{ i + 4 }}</option>
          </Input>
        </label>
        <label class="w-1/3 md:w-auto">
          <span class="block">Travelers</span>
          <Input mode="select" v-model="game.traveler_count">
            <option :value="null">
              <template v-if="editingMultipleGames">Not updated</template>
            </option>
            <option v-for="i in 5" :value="i">{{ i }}</option>
          </Input>
        </label>
        <label
          v-if="!editingMultipleGames"
          class="w-1/3 md:w-auto flex flex-col gap-2 items-center"
        >
          <span class="block">Record Grimoire</span>
          <Toggle v-model="advancedModeEnabled" />
        </label>
      </div>
    </fieldset>
    <fieldset
      id="game-results"
      class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Results</legend>
      <fieldset class="flex gap-4">
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win_v2"
            :value="WinStatus_V2.GOOD_WINS"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap"> Good wins </span>
        </label>
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win_v2"
            :value="WinStatus_V2.EVIL_WINS"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap"> Evil wins </span>
        </label>
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win_v2"
            :value="WinStatus_V2.NOT_RECORDED"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap"> Not recorded </span>
        </label>
        <label v-if="editingMultipleGames" class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win_v2"
            :value="undefined"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap"> Not updated </span>
        </label>
        <label v-if="!editingMultipleGames" class="flex gap-2 items-center">
          <input type="checkbox" v-model="game.ignore_for_stats" />
          <span class="block whitespace-nowrap">Ignore for stats</span>
        </label>
      </fieldset>
    </fieldset>
    <fieldset
      v-if="!advancedModeEnabled && !game.is_storyteller"
      class="flex justify-center md:justify-normal flex-wrap gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Your Roles</legend>

      <div
        v-for="(character, i) in game.player_characters"
        class="relative rounded p-4 flex justify-center items-center aspect-square"
      >
        <button
          type="button"
          v-if="i !== 0"
          @click="removeCharacter(i)"
          class="absolute top-1 right-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 512 512"
          >
            <path
              d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
              fill="currentColor"
            />
            <path d="M249 160h14v241h-14z" fill="currentColor" />
            <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
            <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
          </svg>
        </button>
        <Token
          :character="character"
          alwaysShowAlignment
          size="lg"
          class="cursor-pointer"
          @clickRole="openRoleSelectionDialog(character, 'role')"
          @clickRelated="openRoleSelectionDialog(character, 'related_role')"
          @clickAlignment="toggleAlignment(character)"
          id="player-role"
          relatedId="related-player-role"
          tokenTooltip="The role this player had in the game"
          :relatedTokenTooltip="{
            content:
              '<div class=\'w-[250px]\'>The related role this player saw (if applicable). Example: The Drunk sees the Empath, or the Pixie sees the Snake Charmer</div>',
            html: true,
          }"
        />
      </div>
      <div class="rounded p-4 flex justify-center items-center aspect-square">
        <Token outline size="lg" class="font-sorts">
          <button type="button" @click="addCharacter" class="w-full h-full">
            Add Character
          </button>
        </Token>
      </div>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames && advancedModeEnabled"
      class="flex justify-center md:justify-normal flex-wrap gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Grimoire</legend>
      <div
        v-if="!game.player_count"
        :style="
          customBackground
            ? { '--bg-image-url' : `url(${customBackground})` }
            : {}
        "
        class="grimoire pt-3 relative bg-center bg-cover w-full h-[200px] flex justify-center items-center script-bg"
        :class="{
          ...scriptBgClasses(game.script, !!customBackground),
        }"
      >
        <div
          class="font-sorts text-white bg-black/60 p-4 text-xl rounded shadow-md text-center"
        >
          <p class="p-2">Select player count to begin</p>
          <p class="p-2">OR</p>
          <div class="flex justify-center">
            <Button
              primary
              type="button"
              @click="showCopyGrimoireDialog = true"
            >
              Copy an existing grimoire
            </Button>
          </div>
        </div>
      </div>
      <div
        v-else
        :style="
          customBackground
            ? { '--bg-image-url' : `url(${customBackground})` }
            : {}
        "
        class="grimoire pt-3 relative bg-center bg-cover w-full script-bg"
        :class="{
          ...scriptBgClasses(game.script, !!customBackground),
        }"
      >
        <Button
          v-if="game.grimoire.length > 1"
          @click.prevent="deletePage"
          class="absolute top-1 right-1 z-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 512 512"
          >
            <path
              d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
              fill="currentColor"
            />
            <path d="M249 160h14v241h-14z" fill="currentColor" />
            <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
            <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
          </svg>
          <span class="hidden md:inline">Delete page</span>
        </Button>
        <Button
          type="button"
          @click="pageBackward"
          v-if="grimPage !== 0"
          class="absolute bottom-1 left-1 font-sorts"
          font-size="sm"
        >
          <span> {{ "<" }} Previous page </span>
        </Button>
        <Button
          type="button"
          @click="pageForward"
          class="absolute bottom-1 right-1 font-sorts"
          font-size="sm"
        >
          <span v-if="grimPage <= game.grimoire.length - 1">
            {{
              grimPage === game.grimoire.length - 1 ? "Add page" : "Next page"
            }}
            {{ ">" }}
          </span>
        </Button>
        <div class="w-screen md:w-auto max-w-[966px] overflow-scroll">
          <Grimoire
            :tokens="game.grimoire[grimPage].tokens"
            :availableRoles="orderedRoles"
            :excludePlayers="storytellerNames"
            @selectedMe="applyMyRoleToGrimoire"
          />
        </div>
        <div
          class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800 text-white"
        >
          Page {{ grimPage + 1 }} of {{ game.grimoire.length }}
        </div>
      </div>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames"
      class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover"
    >
      <legend>Additional Details</legend>
      <details :open="game.demon_bluffs.length > 0">
        <summary class="cursor-pointer">Demon Bluffs</summary>
        <div class="flex justify-center md:justify-normal flex-wrap gap-5">
          <div
            v-for="(character, i) in game.demon_bluffs"
            class="relative border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
          >
            <button
              type="button"
              @click="removeDemonBluff(i)"
              class="absolute top-1 right-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
            <Token
              :character="character"
              size="md"
              class="cursor-pointer"
              @clickRole="
                openRoleSelectionDialog(character, 'role', 'demon_bluffs')
              "
              id="player-role"
              hideRelated
            />
          </div>
          <div
            v-if="game.demon_bluffs.length < 3"
            class="border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
          >
            <Token outline size="md" class="font-sorts">
              <button
                type="button"
                @click="addDemonBluff"
                class="w-full h-full p-1 text-sm"
              >
                Add Demon Bluff
              </button>
            </Token>
          </div>
        </div>
      </details>
      <details :open="game.fabled.length > 0">
        <summary class="cursor-pointer">Fabled</summary>
        <div class="flex justify-center md:justify-normal flex-wrap gap-5">
          <div
            v-for="(character, i) in game.fabled"
            class="relative border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
          >
            <button
              type="button"
              @click="removeFabled(i)"
              class="absolute top-1 right-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 512 512"
              >
                <path
                  d="M400 113.3h-80v-20c0-16.2-13.1-29.3-29.3-29.3h-69.5C205.1 64 192 77.1 192 93.3v20h-80V128h21.1l23.6 290.7c0 16.2 13.1 29.3 29.3 29.3h141c16.2 0 29.3-13.1 29.3-29.3L379.6 128H400v-14.7zm-193.4-20c0-8.1 6.6-14.7 14.6-14.7h69.5c8.1 0 14.6 6.6 14.6 14.7v20h-98.7v-20zm135 324.6v.8c0 8.1-6.6 14.7-14.6 14.7H186c-8.1 0-14.6-6.6-14.6-14.7v-.8L147.7 128h217.2l-23.3 289.9z"
                  fill="currentColor"
                />
                <path d="M249 160h14v241h-14z" fill="currentColor" />
                <path d="M320 160h-14.6l-10.7 241h14.6z" fill="currentColor" />
                <path d="M206.5 160H192l10.7 241h14.6z" fill="currentColor" />
              </svg>
            </button>
            <Token
              :character="character"
              size="md"
              class="cursor-pointer"
              @clickRole="openRoleSelectionDialog(character, 'role', 'fabled')"
              id="player-role"
              hideRelated
            />
          </div>
          <div
            class="border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
          >
            <Token outline size="md" class="font-sorts">
              <button
                type="button"
                @click="addFabled"
                class="w-full h-full p-1 text-sm"
              >
                Add Fabled
              </button>
            </Token>
          </div>
        </div>
      </details>
    </fieldset>
    <fieldset class="border rounded border-stone-500 p-4 my-3">
      <legend>Notes</legend>
      <ExpandingTextarea
        v-if="!editingMultipleGames"
        v-model="game.notes"
        class="block w-full border border-stone-500 rounded-md p-2 min-h-[10rem]"
      />
      <label class="block py-2">
        <span class="block">Add Tag</span>
        <Input
          type="text"
          v-model="tagsInput"
          @keydown.enter.prevent="addTag"
          list="tags"
          placeholder="Enter a tag, then press enter"
        />
        <datalist id="tags">
          <option
            v-for="tag in myTags.filter((tag) => !game.tags.includes(tag))"
            :value="tag"
          />
        </datalist>
      </label>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="(tag, index) in game.tags"
          font-size="sm"
          @click.prevent="game.tags.splice(index, 1)"
        >
          {{ tag }}
        </Button>
      </div>
    </fieldset>
    <fieldset class="border rounded border-stone-500 p-4 my-3">
      <legend>External Links</legend>
      <div class="w-full flex flex-col md:flex-row gap-5">
        <label class="flex-1">
          <span class="block">BoardGameGeek Game URL</span>
          <div class="flex items-center">
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
            <Input
              type="text"
              v-model="bggIdInput"
              pattern="https:\/\/boardgamegeek\.com\/play\/details\/\d+"
            />
          </div>
          <div v-if="!bggIdIsValid" class="text-red-500">
            Invalid BoardGameGeek URL. Format should be:
            https://boardgamegeek.com/play/details/[game id]
          </div>
        </label>
      </div>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames"
      class="border rounded border-stone-500 p-4 my-3"
    >
      <legend>Images</legend>
      <div class="flex flex-col gap-5">
        <Button type="button" @click="uploadFile" font-size="md" tertiary>
          Upload Images
        </Button>
        <div class="flex flex-wrap gap-5">
          <div v-for="file in game.image_urls" :key="file">
            <img
              crossorigin="anonymous"
              :src="file"
              class="w-64 h-64 object-cover"
            />
            <button type="button" @click="removeFile(file)">Remove</button>
          </div>
        </div>
      </div>
    </fieldset>
    <Button
      type="submit"
      id="save-game"
      class="w-[300px] m-auto"
      primary
      :disabled="inFlight"
    >
      <template v-if="inFlight">
        <Spinner />
        Saving...
      </template>
      <template v-else>Save Game</template>
    </Button>
  </form>
  <Tour :steps="tour" tourKey="game-editor" />
  <TokenDialog
    v-model:visible="showRoleSelectionDialog"
    :availableRoles="visibleRoles"
    @selectRole="selectRoleForToken"
    :alwaysShowFabled="tokenSet === 'fabled'"
    :hideTravelers="tokenSet !== 'player_characters'"
  />
  <Dialog v-model:visible="showCopyGrimoireDialog" size="xl">
    <template #title>
      <h2 class="text-2xl font-bold">Copy Existing Grimoire</h2>
      <p class="text-lg text-stone-400 py-4">
        Click on a game to copy the grimoire data to this game.
        (Grimoire data includes player count, player data, 
        location, community, ...)
      </p>
    </template>

    <div class="text-black dark:text-stone-200">
      <GameOverviewList :games="myGames" readonly :onClick="copyGrimoire" />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import type { Alignment } from "@prisma/client";
import type { RoleType } from "~/composables/useRoles";
import naturalOrder from "natural-order";
import { useLocalStorage } from "@vueuse/core";
import { WinStatus_V2, type GameRecord } from "~/composables/useGames";
import dayjs from "dayjs";

const props = defineProps<{
  inFlight: boolean;
  editingMultipleGames?: boolean;
  game: {
    date: string;
    script: string;
    script_id: number | null;
    bgg_id: number | null;
    ls_game_id: number | null;
    storyteller: string;
    co_storytellers: string[];
    is_storyteller: boolean | undefined;
    location_type: undefined | "ONLINE" | "IN_PERSON";
    location: string;
    community_name: string;
    community_id: number | null;
    player_count: number | null;
    traveler_count: number | null;
    player_characters: {
      name: string;
      role_id: string | null;
      alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
      showRelated: boolean;
      related: string;
      related_role_id: string | null;
      role?: {
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      };
      related_role?: { token_url: string };
    }[];
    demon_bluffs: {
      name: string;
      role_id: string | null;
      role?: {
        token_url: string;
        type: string;
      };
    }[];
    fabled: {
      name: string;
      role_id: string | null;
      role?: {
        token_url: string;
        type: string;
      };
    }[];
    win_v2: WinStatus_V2 | undefined;
    notes: string;
    image_urls: string[];
    grimoire: {
      tokens: {
        id?: number;
        alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
        order: number;
        is_dead: boolean;
        used_ghost_vote: boolean;
        role_id: string | null;
        role?: {
          token_url: string;
          type: string;
          initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
          name?: string;
        };
        related_role_id: string | null;
        related_role?: { token_url: string; name?: string };
        player_name: string;
        player_id?: string | null;
        reminders: { reminder: string; token_url: string }[];
      }[];
    }[];
    ignore_for_stats: boolean;
    tags: string[];
    privacy: string;
  };
}>();

const emit = defineEmits(["submit"]);

const tour: Step[] = [
  {
    target: "#select-script",
    content: "Select a script to use for this game.",
  },
  {
    target: "#player-count",
    content: "Enter the number of players in the game.",
  },
  {
    target: "#game-results",
    content: "Select whether you won or lost the game.",
    placement: Placement.TOP_START,
  },
  {
    target: "#player-role",
    content: "Select your character role in the game.",
  },
  {
    target: "#related-player-role",
    content:
      "If your role is related to another (such as Drunk), you can enter a related role here.",
  },
  {
    target: "#save-game",
    content:
      "When you've finished entering the game details, you're ready to save!",
  },
];

type Character = {
  name: string;
  role_id: string | null;
  alignment?: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
  showRelated?: boolean;
  related?: string;
  related_role_id?: string | null;
  role?: {
    token_url: string;
    alternate_token_urls?: string[];
    initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
    type: string;
  };
  related_role?: { token_url: string };
};

const user = useSupabaseUser();
const me = useMe();
const games = useGames();
const friends = useFriends();
const { isBaseScript, fetchScriptVersions, scriptBgClasses } = useScripts();
const allRoles = useRoles();
const route = useRoute();

const showScriptDialog = ref(false);
const showRoleSelectionDialog = ref(false);
const advancedModeEnabled_ = useLocalStorage("advancedModeEnabled", "false");
const grimoireOverride = ref(false); // Override to show grimoire without changing user preference
const roles = ref<
  {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: Alignment;
    reminders: { id: number; reminder: string; role_id: string }[];
  }[]
>([]);
const scriptVersions = ref<{ id: number; version: string }[]>([]);
const fetchingScriptVersions = ref(false);
const tokenMode = ref<"role" | "related_role">("role");
const tokenSet = ref<"player_characters" | "demon_bluffs" | "fabled">(
  "player_characters"
);

// Grimoire
const showCopyGrimoireDialog = ref(false);
const grimPage = ref(props.game.grimoire.length - 1);
const tagsInput = ref("");
const bggIdInput = ref("");
const bggIdIsValid = ref(true);
const customBackground = ref<string | null>(null);

watch(bggIdInput, () => {
  // Validate the URL
  const validUrl = new RegExp(
    /https:\/\/boardgamegeek.com\/play\/details\/\d+$/
  );

  if (bggIdInput.value.match(validUrl)) {
    bggIdIsValid.value = true;
    const bggId = bggIdInput.value.match(/\d+$/);
    if (bggId) {
      props.game.bgg_id = parseInt(bggId[0]);
    }
  } else {
    props.game.bgg_id = null;
    if (bggIdInput.value.length > 0) {
      bggIdIsValid.value = false;
    }
  }
});

let focusedToken: Partial<Character> | null = null;

const noChangeToIsStoryteller = computed({
  get: () => props.game.is_storyteller === undefined,
  set: () => {
    if (props.game.is_storyteller !== undefined) {
      props.game.is_storyteller = undefined;
    }
  },
});

const advancedModeEnabled = computed({
  get: () => grimoireOverride.value || advancedModeEnabled_.value === "true",
  set: (value) => {
    // When user manually toggles, update both the override and the saved preference
    grimoireOverride.value = value;
    advancedModeEnabled_.value = value ? "true" : "false";
  },
});

const visibleRoles = computed(() => {
  return roles.value.filter((role) => {
    switch (tokenSet.value) {
      case "player_characters":
        return true;
      case "demon_bluffs":
        return role.type === "TOWNSFOLK" || role.type === "OUTSIDER";
      case "fabled":
        return role.type === "FABLED";
    }
  });
});

const myTags = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return games.getTagsByPlayer(me.value.data.username);
  }
  return [];
});

const myCommunities = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    const taggedCommunities = me.value.data.communities!.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    }));

    const allCommunityNames = games
      .getCommunityNamesByPlayer(me.value.data.username)
      .filter((name) => !taggedCommunities.some((c) => c.name === name))
      .map((name) => ({
        id: null,
        name,
        icon: "/img/default.png",
      }));

    return [...taggedCommunities, ...allCommunityNames];
  }
  return [];
});

const myLocations = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return games.getLocationsByPlayer(me.value.data.username);
  }
  return [];
});

const myGames = computed(() => {
  if (me.value.status !== Status.SUCCESS) {
    return [];
  }

  const myGames = games.getByPlayer(me.value.data.username);

  if (myGames.status === Status.SUCCESS) {
    return myGames.data;
  } else {
    return [];
  }
});

const communityMembersWhoArentFriends = computed(() =>
  friends.getCommunityMembers.filter(
    (member) =>
      !friends.getFriends.find((friend) => friend.user_id === member.user_id)
  )
);

const potentiallyTaggedPlayers = computed(() => {
  return [...friends.getFriends, ...communityMembersWhoArentFriends.value].map(
    (player) => ({
      ...player,
      username: `@${player?.username}`,
    })
  );
});

const potentialCoStorytellers = computed(() => {
  return allTaggablePlayers.value.filter(
    (player) =>
      !player ||
      (!props.game.grimoire.some(({ tokens }) =>
        tokens.find((token) => token.player_name === player.username)
      ) &&
        !props.game.co_storytellers.find(
          (costoryteller) => costoryteller === player.username
        ))
  );
});

const previouslyTaggedPlayers = computed(() => {
  if (me.value.status !== Status.SUCCESS) {
    return [];
  }

  return games
    .getPreviouslyTaggedByPlayer(me.value.data.username)
    .map((player) => ({
      username: player,
      display_name: "",
      user_id: null,
      avatar: "/img/default.png",
    }));
});

const allTaggablePlayers = computed(() => {
  return [
    ...potentiallyTaggedPlayers.value,
    ...previouslyTaggedPlayers.value,
  ].filter(
    (player, index, array) =>
      player &&
      array.findIndex(
        (p) => p.user_id === player.user_id && p.username === player.username
      ) === index
  );
});

const storytellerNames = computed(() => {
  return [props.game.storyteller, ...props.game.co_storytellers];
});

const orderedRoles = computed(() =>
  naturalOrder(roles.value).orderBy("asc").sort(["name"])
);

function addCharacter() {
  props.game.player_characters.push({
    name: "",
    alignment: props.game.player_characters[0]?.alignment || "NEUTRAL",
    related: "",
    showRelated: false,
    role_id: null,
    related_role_id: null,
    role: {
      token_url: "/1x1.png",
      type: "",
      initial_alignment: "NEUTRAL",
    },
    related_role: {
      token_url: "/1x1.png",
    },
  });

  openRoleSelectionDialog(
    props.game.player_characters[props.game.player_characters.length - 1],
    "role"
  );
}

function addDemonBluff() {
  props.game.demon_bluffs.push({
    name: "",
    role_id: null,
    role: {
      token_url: "/1x1.png",
      type: "",
    },
  });

  openRoleSelectionDialog(
    props.game.demon_bluffs[props.game.demon_bluffs.length - 1],
    "role",
    "demon_bluffs"
  );
}

function addTag() {
  if (tagsInput.value) {
    props.game.tags.push(tagsInput.value);
    tagsInput.value = "";
  }
}

function removeCharacter(i: number) {
  props.game.player_characters.splice(i, 1);
}

function removeDemonBluff(i: number) {
  props.game.demon_bluffs.splice(i, 1);
}

function addFabled() {
  props.game.fabled.push({
    name: "",
    role_id: null,
    role: {
      token_url: "/1x1.png",
      type: "",
    },
  });

  openRoleSelectionDialog(
    props.game.fabled[props.game.fabled.length - 1],
    "role",
    "fabled"
  );
}

function removeFabled(i: number) {
  props.game.fabled.splice(i, 1);
}

function uploadFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "image/jpg, image/jpeg, image/png";
  input.onchange = selectFiles;
  input.click();
}

async function selectFiles(event: Event) {
  const uploadedFiles = (event.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  const files = Array.from(uploadedFiles);

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("file", file);
  });

  const urls = await $fetch(`/api/storage/game-attachments`, {
    method: "POST",
    body: formData,
  });

  props.game.image_urls.push(...urls);
}

async function removeFile(name: string) {
  props.game.image_urls = props.game.image_urls.filter((file) => file !== name);
}

function selectScript(script: { name: string; id: number | null }) {
  props.game.script = script.name;
  props.game.script_id = script.id;
  props.game.ls_game_id = null;
  showScriptDialog.value = false;
}

function selectLSGame(game: {
  name: string;
  game_id: number;
  script_id: number;
  game_number: number;
  notes: string | null;
  date: string | null;
}) {
  props.game.script = game.name;
  props.game.ls_game_id = game.game_id;
  props.game.script_id = game.script_id;
  props.game.notes = game.notes ?? "";
  showScriptDialog.value = false;
  if (game.date !== null) {
    props.game.date = dayjs(game.date).format("YYYY-MM-DD");
  }
}

watchEffect(async () => {
  scriptVersions.value = [];
  roles.value = [];

  if (props.game.script_id) {
    fetchingScriptVersions.value = true;
    try {
      const result = await $fetch<{
        background?: string;
        roles: {
          type: RoleType;
          id: string;
          token_url: string;
          name: string;
          initial_alignment: Alignment;
          reminders: { id: number; reminder: string; role_id: string }[];
        }[];
      }>(`/api/script/${props.game.script_id}`);
      roles.value = result.roles ?? [];
      customBackground.value = result.background ?? null;

      const fabled = roles.value.filter((role) => role.type === "FABLED");

      if (fabled.length > 0) {
        fabled.forEach((fabledRole) => {
          if (
            !props.game.fabled.some(
              (fabled) => fabled.role?.token_url === fabledRole.token_url
            )
          )
            props.game.fabled.push({
              name: fabledRole.name,
              role_id: fabledRole.id,
              role: {
                token_url: fabledRole.token_url,
                type: fabledRole.type,
              },
            });
        });
      }

      scriptVersions.value = await fetchScriptVersions(props.game.script_id);
    } catch {
      alert("Unable to load the selected script!");
      // Do nothing
    }
    fetchingScriptVersions.value = false;
  } else {
    roles.value = allRoles.getAllRoles();
  }
});

function openRoleSelectionDialog(
  token: Partial<Character>,
  mode: "role" | "related_role",
  set: "player_characters" | "demon_bluffs" | "fabled" = "player_characters"
) {
  focusedToken = token;
  tokenMode.value = mode;
  tokenSet.value = set;
  showRoleSelectionDialog.value = true;
}

function toggleAlignment(token: Character) {
  switch (token.alignment) {
    case "GOOD":
      token.alignment = "EVIL";
      break;
    case "EVIL":
      if (!token.role || token.role?.initial_alignment === "NEUTRAL") {
        token.alignment = "NEUTRAL";
      } else {
        token.alignment = "GOOD";
      }
      break;
    case "NEUTRAL":
      token.alignment = "GOOD";
      break;
    case undefined:
    default:
      // If no alignment is set, start with GOOD
      token.alignment = "GOOD";
      break;
  }
}

function selectRoleForToken(role: {
  type: RoleType;
  id: string;
  token_url: string;
  alternate_token_urls?: string[];
  name: string;
  initial_alignment: Alignment;
}) {
  console.log(role);
  if (focusedToken) {
    if (tokenMode.value === "role") {
      if (role.id) {
        focusedToken.role = {
          token_url: role.token_url,
          alternate_token_urls: role.alternate_token_urls,
          initial_alignment: role.initial_alignment,
          type: role.type,
        };
        focusedToken.role_id = role.id;
        focusedToken.alignment = role.initial_alignment;
        focusedToken.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.name = role.name;
      } else {
        focusedToken.role = undefined;
        focusedToken.role_id = undefined;
        focusedToken.alignment = "NEUTRAL";
        focusedToken.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.name = "";
      }
    } else {
      if (role.id) {
        focusedToken.related_role = {
          token_url: role.token_url,
        };
        focusedToken.related_role_id = role.id;
        focusedToken.related = role.name;
      } else {
        focusedToken.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.related_role_id = undefined;
        focusedToken.related = "";
      }
    }
  }
  showRoleSelectionDialog.value = false;
}

function copyGrimoire(game: GameRecord) {
  const tokens = [];

  for (const token of game.grimoire[game.grimoire.length - 1].tokens) {
    tokens.push({
      id: undefined,
      alignment: undefined,
      is_dead: false,
      used_ghost_vote: false,
      order: token.order,
      role_id: null,
      related_role_id: null,
      player_name: token.player_name,
      player_id: token.player_id,
      reminders: [],
    });
  }

  // Empty the grimoire
  while (props.game.grimoire.length > 0) {
    props.game.grimoire.pop();
  }

  props.game.grimoire.push({ tokens });

  props.game.player_count = game.player_count;
  props.game.traveler_count = game.traveler_count;
  props.game.is_storyteller = game.is_storyteller;
  props.game.storyteller = game.storyteller ?? "";
  props.game.co_storytellers.push(...game.co_storytellers);
  props.game.location = game.location ?? "";
  props.game.location_type = game.location_type ?? undefined;
  props.game.community_name = game.community_name ?? "";
  props.game.community_id = game.community_id ?? null;

  showCopyGrimoireDialog.value = false;
}

watchEffect(() => {
  props.game.grimoire.forEach((grimoire) => {
    while (
      (props.game.player_count || 0) + (props.game.traveler_count || 0) >
        grimoire.tokens.length &&
      grimoire.tokens.length < 25
    ) {
      grimoire.tokens.push({
        id: undefined,
        alignment: undefined,
        is_dead: false,
        used_ghost_vote: false,
        order: grimoire.tokens.length,
        role_id: null,
        related_role_id: null,
        player_name: "",
        reminders: [],
      });
    }

    while (
      (props.game.player_count || 0) + (props.game.traveler_count || 0) <
      grimoire.tokens.length
    ) {
      grimoire.tokens.pop();
    }
  });
});

function pageForward() {
  const nextPage = grimPage.value + 1;
  if (nextPage < props.game.grimoire.length) {
    grimPage.value = nextPage;
  } else {
    props.game.grimoire[nextPage] = {
      tokens: JSON.parse(JSON.stringify(props.game.grimoire[grimPage.value]))
        .tokens,
    };
    grimPage.value = nextPage;
  }
}

function pageBackward() {
  const previousPage = grimPage.value - 1;
  if (previousPage >= 0) {
    grimPage.value = previousPage;
  }
}

function deletePage() {
  props.game.grimoire.splice(grimPage.value, 1);
  grimPage.value = Math.max(0, grimPage.value - 1);
}

watch(
  props.game.grimoire,
  (value) => {
    const newTokens = value[grimPage.value].tokens;

    const myCharacters: {
      name: string;
      role_id: string | null;
      alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
      showRelated: boolean;
      related: string;
      related_role_id: string | null;
      role?: {
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      };
      related_role?: { token_url: string };
    }[] = [];

    value.forEach((page, i) => {
      page.tokens.forEach((token, j) => {
        if (!!token.player_id && token.player_id === user.value?.id) {
          const lastCharacter = myCharacters.at(-1);
          const sameAsLast =
            lastCharacter &&
            lastCharacter.role_id === token.role_id &&
            lastCharacter.related_role_id === token.related_role_id &&
            lastCharacter.alignment === token.alignment;

          if (sameAsLast) return;

          if (token.role_id) {
            myCharacters.push({
              name: token.role?.name ?? "",
              alignment: token.alignment,
              related: token.related_role?.name ?? "",
              showRelated: !!token.related_role_id,
              role_id: token.role_id,
              related_role_id: token.related_role_id,
              role: {
                token_url: token.role?.token_url ?? "/1x1.png",
                type: token.role?.type ?? "",
                initial_alignment: token.role?.initial_alignment ?? "NEUTRAL",
              },
              related_role: {
                token_url: token.related_role?.token_url ?? "/1x1.png",
              },
            });
          } else if (token.alignment && token.alignment !== "NEUTRAL") {
            myCharacters.push({
              name: "",
              alignment: token.alignment,
              related: "",
              showRelated: false,
              role_id: null,
              related_role_id: null,
              role: undefined,
              related_role: {
                token_url: "/1x1.png",
              },
            });
          }
        }

        if (i <= grimPage.value) return;

        token.is_dead = token.is_dead || newTokens[j].is_dead;
        token.used_ghost_vote =
          token.used_ghost_vote || newTokens[j].used_ghost_vote;
        token.player_id = newTokens[j].player_id;
        token.player_name = newTokens[j].player_name;
        // Add any reminders that are not already there
        for (const reminder of newTokens[j].reminders) {
          if (
            !token.reminders.some(
              (r) =>
                r.reminder === reminder.reminder &&
                r.token_url === reminder.token_url
            )
          ) {
            token.reminders.push({
              reminder: reminder.reminder,
              token_url: reminder.token_url,
            });
          }
        }
        // Remove any reminders that are not in the new tokens
        for (let k = token.reminders.length - 1; k >= 0; k--) {
          if (
            !newTokens[j].reminders.some(
              (r) =>
                r.reminder === token.reminders[k].reminder &&
                r.token_url === token.reminders[k].token_url
            )
          ) {
            token.reminders.splice(k, 1);
          }
        }

        if (!token.role_id) {
          token.role = newTokens[j].role;
          token.role_id = newTokens[j].role_id;
          token.related_role = newTokens[j].related_role;
          token.related_role_id = newTokens[j].related_role_id;
          token.alignment = newTokens[j].alignment;
        }

        if (token.role_id && !token.related_role_id) {
          token.related_role = newTokens[j].related_role;
          token.related_role_id = newTokens[j].related_role_id;
        }
      });
    });

    if (myCharacters.length > 0 || advancedModeEnabled.value) {
      props.game.player_characters = myCharacters;
    }
  },
  { deep: true }
);

function applyMyRoleToGrimoire() {
  props.game.grimoire.forEach((page) => {
    page.tokens.forEach((token) => {
      if (!(!!token.player_id && token.player_id === user.value?.id)) return;

      const playerRole = props.game.player_characters[0].role;
      const relatedRole = props.game.player_characters[0].related_role;

      if (!token.role_id) {
        token.role = playerRole
          ? {
              token_url: playerRole.token_url,
              type: playerRole.type,
              name: props.game.player_characters[0].name,
              initial_alignment: playerRole.initial_alignment,
            }
          : undefined;
        token.role_id = props.game.player_characters[0].role_id;
        token.related_role = relatedRole
          ? {
              token_url: relatedRole.token_url,
            }
          : undefined;
        token.related_role_id = props.game.player_characters[0].related_role_id;
        token.alignment = props.game.player_characters[0].alignment;
      }

      if (!token.related_role_id) {
        token.related_role = relatedRole
          ? {
              token_url: relatedRole.token_url,
            }
          : undefined;
        token.related_role_id = props.game.player_characters[0].related_role_id;
      }
    });
  });
}

watch(
  () => props.game.community_name,
  () => {
    const community = myCommunities.value.find(
      (c) => c.name === props.game.community_name
    );
    if (community) {
      props.game.community_id = community.id;
    } else {
      props.game.community_id = null;
    }
  }
);

onMounted(async () => {
  friends.fetchCommunityMembers();
  if (me.value.status === Status.SUCCESS) {
    games.fetchPlayerGames(me.value.data.username);
  }

  // If the game has grimoire data with tokens, enable Record Grimoire without changing user preference
  if (props.game.grimoire.some((g) => g.tokens.length > 0 && g.tokens.some((t) => t.role_id))) {
    grimoireOverride.value = true;
  }

  if (props.game.bgg_id) {
    bggIdInput.value = `https://boardgamegeek.com/play/details/${props.game.bgg_id}`;
  }

  if (route.query["living-script"]) {
    const lsCampaign = route.query["living-script"] as string;
    const lsGame = route.query["game"] as string;

    const result = await $fetch(`/api/living_scripts/${lsCampaign}`);
    if (!result) {
      return;
    }
    const game = result.games.find((g) => g.game_number === parseInt(lsGame));
    if (!game || game.script_id === null) {
      return;
    }
    selectLSGame({
      name: result.title,
      game_id: game.id,
      script_id: game.script_id,
      game_number: game.game_number,
      date: game.submitted,
      notes: game.notes,
    });
  }
});
</script>

<style scoped>
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
</style>
