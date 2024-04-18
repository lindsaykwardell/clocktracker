<template>
  <form class="max-w-[1000px] m-auto py-6" @submit.prevent="emit('submit')">
    <fieldset
      class="flex flex-col gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Setup</legend>
      <div class="w-full flex flex-col md:flex-row gap-5">
        <label class="flex-1">
          <span class="block">Date</span>
          <input
            type="date"
            v-model="game.date"
            class="block w-full border border-stone-500 rounded-md p-2"
            required
          />
        </label>
        <label class="flex-1">
          <span class="block">Script</span>
          <div class="flex items-center gap-1">
            <div v-if="game.script" class="flex-grow">{{ game.script }}</div>
            <button
              type="button"
              id="select-script"
              @click="showScriptDialog = !showScriptDialog"
              class="flex gap-1 bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-1 px-4 rounded justify-center items-center"
              :class="{
                'w-full': !game.script,
                'flex-shrink': game.script,
              }"
            >
              <div class="w-[30px] overflow-hidden">
                <img src="/img/role/investigator.png" />
              </div>
              <template v-if="game.script === ''">Select Script</template>
            </button>
          </div>
          <SelectScriptDialog
            v-model:visible="showScriptDialog"
            @selectScript="selectScript"
          />
        </label>
        <div
          v-if="
            !isBaseScript(game.script) &&
            (scriptVersions.length > 1 || fetchingScriptVersions)
          "
          class="flex flex-col gap-1"
        >
          <label>
            <span class="block">Script Version</span>
            <select
              v-if="!fetchingScriptVersions"
              v-model="game.script_id"
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              <option v-for="version in scriptVersions" :value="version.id">
                {{ version.version }}
              </option>
            </select>
            <div
              v-else
              class="block w-full border border-stone-500 rounded-md p-2"
            >
              Loading...
            </div>
          </label>
        </div>
        <div class="flex-1 flex flex-col justify-start">
          <label>
            <span class="block">Storyteller</span>
            <TaggedUserInput
              v-model:value="game.storyteller"
              :users="potentialStorytellers"
              inputClass="w-full border border-stone-500 rounded-md p-2 h-[2.5rem] text-lg bg-stone-600 disabled:bg-stone-700"
            />
          </label>
          <label class="flex whitespace-nowrap items-center gap-2">
            <input type="checkbox" v-model="game.is_storyteller" />
            <span class="block">I was the Storyteller</span>
          </label>
        </div>
        <div class="flex-1 flex flex-col gap-1 justify-center">
          <div v-for="(st, index) in game.co_storytellers" class="flex gap-2">
            <TaggedUserInput
              v-model:value="game.co_storytellers[index]"
              :users="potentialStorytellers"
              inputClass="w-full border border-stone-500 rounded-md p-2 h-[2.5rem] text-lg bg-stone-600 disabled:bg-stone-700"
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
            Add Co-Storyteller
          </button>
        </div>
      </div>
      <div class="w-full flex flex-wrap gap-5">
        <label class="w-full md:w-auto">
          <span class="block">Privacy</span>
          <select
            v-model="game.privacy"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="FRIENDS_ONLY">Friends Only</option>
          </select>
        </label>
        <label class="w-full md:w-auto">
          <span class="block">Location Type</span>
          <select
            v-model="game.location_type"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option value="ONLINE">Online</option>
            <option value="IN_PERSON">In Person</option>
          </select>
        </label>
        <label
          v-if="game.location_type === 'IN_PERSON'"
          class="w-full md:w-auto md:flex-1"
        >
          <span class="block">Location</span>
          <input
            type="text"
            v-model="game.location"
            class="block w-full border border-stone-500 rounded-md p-2"
            list="locations"
          />
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
            />
          </div>
        </label>
        <label class="w-1/3 md:w-auto">
          <span class="block">Players</span>
          <select
            v-model="game.player_count"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option :value="null"></option>
            <option v-for="i in 11" :value="i + 4">{{ i + 4 }}</option>
          </select>
        </label>
        <label class="w-1/3 md:w-auto">
          <span class="block">Travelers</span>
          <select
            v-model="game.traveler_count"
            class="block w-full border border-stone-500 rounded-md p-2"
          >
            <option :value="null"></option>
            <option v-for="i in 5" :value="i">{{ i }}</option>
          </select>
        </label>
        <label
          v-if="featureFlags.isEnabled('advanced-editor')"
          class="w-1/3 md:w-auto flex flex-col gap-2 items-center"
        >
          <span class="block">Record Grimoire</span>
          <Switch
            v-model="advancedModeEnabled"
            :class="advancedModeEnabled ? 'bg-blue-700' : 'bg-blue-950'"
            class="relative inline-flex h-[24px] w-[60px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75"
          >
            <span class="sr-only">Use setting</span>
            <span
              aria-hidden="true"
              :class="advancedModeEnabled ? 'translate-x-9' : 'translate-x-0'"
              class="pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
            />
          </Switch>
        </label>
      </div>
    </fieldset>
    <fieldset
      id="game-results"
      class="flex flex-col md:flex-row gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Results</legend>
      <fieldset
        v-if="featureFlags.isEnabled('win_status_v2')"
        class="flex gap-4"
      >
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
        <label class="flex gap-2 items-center">
          <input type="checkbox" v-model="game.ignore_for_stats" />
          <span class="block whitespace-nowrap">Ignore for stats</span>
        </label>
      </fieldset>
      <fieldset v-else class="flex gap-4">
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win"
            :value="WinStatus.WIN"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap">
            <template v-if="game.is_storyteller">Good wins</template>
            <template v-else>Win</template>
          </span>
        </label>
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win"
            :value="WinStatus.LOSS"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap">
            <template v-if="game.is_storyteller">Evil wins</template>
            <template v-else>Loss</template>
          </span>
        </label>
        <label class="flex gap-2 items-center">
          <input
            type="radio"
            v-model="game.win"
            :value="WinStatus.NOT_RECORDED"
            class="border border-stone-500"
          />
          <span class="block whitespace-nowrap"> Not recorded </span>
        </label>
        <label class="flex gap-2 items-center">
          <input type="checkbox" v-model="game.ignore_for_stats" />
          <span class="block whitespace-nowrap">Ignore for stats</span>
        </label>
      </fieldset>
    </fieldset>
    <fieldset
      v-if="!advancedModeEnabled && !game.is_storyteller"
      class="flex justify-center md:justify-normal flex-wrap gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Player Roles</legend>

      <div
        v-for="(character, i) in game.player_characters"
        class="relative border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
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
      <div
        class="border border-stone-600 rounded p-4 flex justify-center items-center aspect-square"
      >
        <Token outline size="lg" class="font-dumbledor">
          <button type="button" @click="addCharacter" class="w-full h-full">
            Add Character
          </button>
        </Token>
      </div>
    </fieldset>
    <fieldset
      v-if="advancedModeEnabled"
      class="flex justify-center md:justify-normal flex-wrap gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Grimoire</legend>
      <div
        v-if="!game.player_count"
        class="pt-3 relative bg-center bg-cover w-full h-[100px] flex justify-center items-center"
        :class="{
          'trouble-brewing': game.script === 'Trouble Brewing',
          'sects-and-violets': game.script === 'Sects and Violets',
          'bad-moon-rising': game.script === 'Bad Moon Rising',
          'custom-script':
            ['Trouble Brewing', 'Sects and Violets', 'Bad Moon Rising'].indexOf(
              game.script
            ) === -1,
        }"
      >
        <div class="font-dumbledor bg-black/75 p-4 text-xl rounded shadow-md">
          Select player count to begin
        </div>
      </div>
      <div
        v-else
        class="pt-3 relative bg-center bg-cover w-full"
        :class="{
          'trouble-brewing': game.script === 'Trouble Brewing',
          'sects-and-violets': game.script === 'Sects and Violets',
          'bad-moon-rising': game.script === 'Bad Moon Rising',
          'custom-script':
            ['Trouble Brewing', 'Sects and Violets', 'Bad Moon Rising'].indexOf(
              game.script
            ) === -1,
        }"
      >
        <button
          v-if="game.grimoire.length > 1"
          @click.prevent="deletePage"
          class="absolute top-1 right-1 bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial z-10"
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
        </button>
        <button
          type="button"
          @click="pageBackward"
          v-if="grimPage !== 0"
          class="absolute bottom-0 left-1 flex items-center font-dumbledor"
        >
          <span
            class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
          >
            {{ "<" }} Previous page
          </span>
        </button>
        <button
          type="button"
          @click="pageForward"
          class="absolute bottom-0 right-1 flex items-center font-dumbledor"
        >
          <span
            v-if="grimPage <= game.grimoire.length - 1"
            class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
          >
            {{
              grimPage === game.grimoire.length - 1 ? "Add page" : "Next page"
            }}
            {{ ">" }}
          </span>
        </button>
        <div class="w-screen md:w-auto overflow-scroll">
          <Grimoire
            :tokens="game.grimoire[grimPage].tokens"
            :availableRoles="orderedRoles"
            :excludePlayers="storytellerNames"
            @selectedMe="applyMyRoleToGrimoire"
          />
        </div>
        <div
          class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800"
        >
          Page {{ grimPage + 1 }} of {{ game.grimoire.length }}
        </div>
      </div>
    </fieldset>
    <fieldset
      class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover"
    >
      <legend>Additional Details</legend>
      <details
        v-if="
          !featureFlags.isEnabled('advanced-editor') &&
          game.player_count &&
          game.player_count >= 5
        "
        :open="game.grimoire[0].tokens.some((token) => token.role)"
      >
        <summary class="cursor-pointer">Grimoire</summary>
        <div
          class="pt-3 relative bg-center bg-cover"
          :class="{
            'trouble-brewing': game.script === 'Trouble Brewing',
            'sects-and-violets': game.script === 'Sects and Violets',
            'bad-moon-rising': game.script === 'Bad Moon Rising',
            'custom-script':
              [
                'Trouble Brewing',
                'Sects and Violets',
                'Bad Moon Rising',
              ].indexOf(game.script) === -1,
          }"
        >
          <button
            v-if="game.grimoire.length > 1"
            @click.prevent="deletePage"
            class="absolute top-1 right-1 bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center gap-1 flex-1 md:flex-initial z-10"
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
          </button>
          <button
            type="button"
            @click="pageBackward"
            v-if="grimPage !== 0"
            class="absolute bottom-0 left-1 flex items-center font-dumbledor"
          >
            <span
              class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
            >
              {{ "<" }} Previous page
            </span>
          </button>
          <button
            type="button"
            @click="pageForward"
            class="absolute bottom-0 right-1 flex items-center font-dumbledor"
          >
            <span
              v-if="grimPage <= game.grimoire.length - 1"
              class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded"
            >
              {{
                grimPage === game.grimoire.length - 1 ? "Add page" : "Next page"
              }}
              {{ ">" }}
            </span>
          </button>
          <div class="w-screen md:w-auto overflow-scroll">
            <Grimoire
              :tokens="game.grimoire[grimPage].tokens"
              :availableRoles="orderedRoles"
              :excludePlayers="storytellerNames"
              @selectedMe="applyMyRoleToGrimoire"
            />
          </div>
          <div
            class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800"
          >
            Page {{ grimPage + 1 }} of {{ game.grimoire.length }}
          </div>
        </div>
      </details>
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
            <Token outline size="md" class="font-dumbledor">
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
            <Token outline size="md" class="font-dumbledor">
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
        v-model="game.notes"
        class="block w-full border border-stone-500 rounded-md p-2 min-h-[10rem]"
      />
      <label class="block py-2">
        <span class="block">Add Tag</span>
        <input
          type="text"
          v-model="tagsInput"
          class="block w-full border border-stone-500 rounded-md p-2"
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
        <button
          v-for="(tag, index) in game.tags"
          class="bg-stone-600 hover:bg-stone-700 transition duration-150 px-2 py-1 rounded flex items-center gap-2"
          @click.prevent="game.tags.splice(index, 1)"
        >
          {{ tag }}
        </button>
      </div>
    </fieldset>
    <fieldset class="border rounded border-stone-500 p-4 my-3">
      <legend>Images</legend>
      <div class="flex flex-col gap-5">
        <button
          type="button"
          @click="uploadFile"
          class="block w-full bg-stone-600 hover:bg-stone-700 transition duration-150 text-white font-bold py-2 px-4 rounded"
        >
          Select Images
        </button>
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
    <button
      type="submit"
      id="save-game"
      class="w-full bg-blue-900 hover:bg-blue-800 transition duration-150 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-4"
      :disabled="inFlight"
    >
      <template v-if="inFlight">
        <Spinner />
        Saving...
      </template>
      <template v-else>Save Game</template>
    </button>
  </form>
  <Tour :steps="tour" tourKey="game-editor" />
  <TokenDialog
    v-model:visible="showRoleSelectionDialog"
    :availableRoles="visibleRoles"
    @selectRole="selectRoleForToken"
    :alwaysShowFabled="tokenSet === 'fabled'"
    :hideTravelers="tokenSet !== 'player_characters'"
  />
</template>

<script setup lang="ts">
import type { Alignment } from "@prisma/client";
import type { RoleType } from "~/composables/useRoles";
import { v4 as uuid } from "uuid";
import naturalOrder from "natural-order";
import { watchDebounced, useLocalStorage } from "@vueuse/core";
import { WinStatus, WinStatus_V2 } from "~/composables/useGames";
import { Switch } from "@headlessui/vue";

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
    initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
  };
  related_role?: { token_url: string };
};

const supabase = useSupabaseClient();
const config = useRuntimeConfig();
const user = useSupabaseUser();
const users = useUsers();
const games = useGames();
const friends = useFriends();
const { isBaseScript, fetchScriptVersions } = useScripts();
const featureFlags = useFeatureFlags();

const advancedModeEnabled_ = useLocalStorage("advancedModeEnabled", "false");

const advancedModeEnabled = computed({
  get: () =>
    featureFlags.isEnabled("advanced-editor") &&
    advancedModeEnabled_.value === "true",
  set: (value) => {
    advancedModeEnabled_.value = value ? "true" : "false";
  },
});

const roles = ref<
  {
    type: RoleType;
    id: string;
    token_url: string;
    name: string;
    initial_alignment: Alignment;
  }[]
>([]);

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

const scriptVersions = ref<{ id: number; version: string }[]>([]);
const fetchingScriptVersions = ref(false);
const tokenMode = ref<"role" | "related_role">("role");
const tokenSet = ref<"player_characters" | "demon_bluffs" | "fabled">(
  "player_characters"
);

let focusedToken: Partial<Character> | null = null;

const me = computed(() => users.getUserById(user.value?.id));
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

const potentialStorytellers = computed(() => {
  if (me.value.status === Status.SUCCESS) {
    return [...friends.getFriends, ...friends.getCommunityMembers]
      .map((f) => ({ ...f, username: `@${f.username}` }))
      .filter(
        (friend, index, arr) =>
          // friend is unique
          arr.findIndex((f) => f.username === friend.username) === index &&
          // friend is not the storyteller, not a co-storyteller, and not found in the grimoire
          friend.username !== props.game.storyteller &&
          !props.game.co_storytellers.includes(friend.username) &&
          !props.game.grimoire.find((grim) =>
            grim.tokens.find((token) => token.player_name === friend.username)
          )
      );
  }
  return [];
});

const storytellerNames = computed(() => {
  return [props.game.storyteller, ...props.game.co_storytellers];
});

const showScriptDialog = ref(false);

const orderedRoles = computed(() =>
  naturalOrder(roles.value).orderBy("asc").sort(["name"])
);

const showRoleSelectionDialog = ref(false);

const props = defineProps<{
  inFlight: boolean;
  game: {
    date: string;
    script: string;
    script_id: number | null;
    storyteller: string;
    co_storytellers: string[];
    is_storyteller: boolean;
    location_type: "ONLINE" | "IN_PERSON";
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
      };
    }[];
    win: WinStatus;
    win_v2: WinStatus_V2;
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

const grimPage = ref(props.game.grimoire.length - 1);
const tagsInput = ref("");

const emit = defineEmits(["submit"]);

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
  input.accept = "image/*";
  input.onchange = selectFiles;
  input.click();
}

async function selectFiles(event: Event) {
  const uploadedFiles = (event.target as HTMLInputElement).files;
  if (!uploadedFiles) return;

  const files = Array.from(uploadedFiles);
  const urls = [];

  for (const file of files) {
    const { data, error } = await supabase.storage
      .from("game-attachments")
      .upload(`${uuid()}`, file);

    if (error) {
      continue;
    }

    urls.push(
      `${config.public.supabase.url}/storage/v1/object/public/game-attachments/${data.path}`
    );
  }

  props.game.image_urls.push(...urls);
}

async function removeFile(name: string) {
  const { error } = await supabase.storage
    .from("game-attachments")
    .remove([name]);

  if (error) {
    throw error;
  }

  props.game.image_urls = props.game.image_urls.filter((file) => file !== name);
}

function selectScript(script: { name: string; id: number | null }) {
  props.game.script = script.name;
  props.game.script_id = script.id;
  showScriptDialog.value = false;
}

watchEffect(async () => {
  scriptVersions.value = [];
  roles.value = [];

  if (props.game.script_id) {
    fetchingScriptVersions.value = true;
    const result = await $fetch<{
      roles: {
        type: RoleType;
        id: string;
        token_url: string;
        name: string;
        initial_alignment: Alignment;
      }[];
    }>(`/api/script/${props.game.script_id}`);
    roles.value = result.roles ?? [];

    scriptVersions.value = await fetchScriptVersions(props.game.script_id);
    fetchingScriptVersions.value = false;
  } else {
    const result = await $fetch<
      {
        type: RoleType;
        id: string;
        token_url: string;
        name: string;
        initial_alignment: Alignment;
      }[]
    >("/api/roles");
    roles.value = result ?? [];
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
      token.alignment = "NEUTRAL";
      break;
    case "NEUTRAL":
      token.alignment = "GOOD";
      break;
  }
}

function selectRoleForToken(role: {
  type: RoleType;
  id: string;
  token_url: string;
  name: string;
  initial_alignment: Alignment;
}) {
  if (focusedToken) {
    if (tokenMode.value === "role") {
      console.log(role);
      if (role.id) {
        focusedToken.role = {
          token_url: role.token_url,
          initial_alignment: role.initial_alignment,
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

  console.log(focusedToken);
}

watchEffect(() => {
  props.game.grimoire.forEach((grimoire) => {
    while (
      (props.game.player_count || 0) + (props.game.traveler_count || 0) >
        grimoire.tokens.length &&
      grimoire.tokens.length < 20
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
          if (token.role_id) {
            // See if the role is already in the player_character list
            const existingCharacter = myCharacters.find(
              (character) =>
                character.role_id === token.role_id &&
                character.alignment === token.alignment
            );

            // If it's not there, let's add it!
            if (!existingCharacter) {
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
            }
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

onMounted(() => {
  friends.fetchCommunityMembers();
});
</script>

<style scoped>
input,
select {
  height: 2.5rem;
  @apply text-lg bg-stone-600;

  &:disabled {
    @apply bg-stone-700;
  }

  &.co-storyteller {
    height: 2rem;
    @apply text-base;
  }
}

textarea {
  @apply text-lg bg-stone-600;
}

.trouble-brewing {
  background-image: url("/img/trouble-brewing-bg.webp");
}

.sects-and-violets {
  background-image: url("/img/sects-and-violets-bg.webp");
}

.bad-moon-rising {
  background-image: url("/img/bad-moon-rising-bg.webp");
}

.custom-script {
  background-image: url("/img/custom-script-bg.webp");
}
</style>
