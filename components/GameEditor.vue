<template>
  <form class="max-w-[1000px] m-auto py-4 px-4 md:px-8" @submit.prevent="emit('submit')">
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
              class="h-[2.5rem]"
              :class="{
                'w-full': !game.script,
                'flex-shrink': game.script,
              }"
              image="investigator"
            >
              <template v-if="editingMultipleGames">Not updated</template>
              <template v-else-if="game.script === ''">Select Script</template>
              <template v-else><span class="sr-only">Change script</span></template>
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
        <div class="flex-1 flex flex-col">
          <span class="block">Co-Storytellers</span>
          <div v-for="(st, index) in game.co_storytellers" class="flex gap-1 mb-1">
            <TaggedUserInput
              v-model:value="game.co_storytellers[index]"
              :users="potentialCoStorytellers"
            />
            <Button
              type="button"
              @click="game.co_storytellers.splice(index, 1)"
              icon="x-lg"
              display="icon-only"
              color="negative"
              class="h-[2.5rem]"
            >
              Remove storyteller
            </Button>
          </div>
          <Button
            type="button"
            @click="game.co_storytellers.push('')"
            icon="person-plus"
            class="w-full h-[2.5rem]"
          >
            Add Storyteller
          </Button>
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
          class="w-1/3 md:w-auto flex flex-col gap-2 items-start md:items-center"
        >
          <span class="block">Record Grimoire</span>
          <Toggle v-model="advancedModeEnabled" />
        </label>
      </div>
      <div v-if="showCommunityPrivacyAlert" class="w-full">
        <Alert color="info">
          {{ communityPrivacyAlertText }}
        </Alert>
      </div>
    </fieldset>
    <fieldset
      id="game-results"
      class="flex flex-col gap-5 border rounded border-stone-500 p-4 my-3"
    >
      <legend>Game Results</legend>
      <fieldset class="flex gap-4 flex-wrap">
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
      <details :open="game.end_trigger !== GameEndTrigger.NOT_RECORDED">
        <summary class="cursor-pointer">Game end trigger</summary>
        <div class="flex flex-col gap-3 w-full md:w-auto">
          <label class="block">
            <Input mode="select" v-model="game.end_trigger">
              <option v-if="editingMultipleGames" :value="undefined">
                Not updated
              </option>
              <option :value="GameEndTrigger.NOT_RECORDED">Not recorded</option>
              <option :value="GameEndTrigger.NO_LIVING_DEMON">
                No living demon remained (Execution, Slayer, Pit-Hag, etc.)
              </option>
              <option :value="GameEndTrigger.CHARACTER_ABILITY">
                A character ability ended the game (Saint, Alsaahir, etc.)
              </option>
              <option :value="GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE">
                Two players left alive (Execution, Imp, Mutant, etc.)
              </option>
              <option :value="GameEndTrigger.GAME_ENDED_EARLY">
                Game ended early
              </option>
              <option :value="GameEndTrigger.OTHER">Other</option>
            </Input>
          </label>
          <div
            v-if="
              game.end_trigger === GameEndTrigger.CHARACTER_ABILITY ||
              game.end_trigger === GameEndTrigger.NO_LIVING_DEMON ||
              game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
            "
            class="flex flex-col gap-2"
          >
            <label v-if="advancedModeEnabled" class="block">
              <span class="block"
                >Select triggering character</span
              >
              <Input
                mode="select"
                v-model="endTriggerSeatSelection"
                @change="selectEndTriggerSeat"
                :disabled="endTriggerSeatOptions.length === 0"
              >
                <option :value="null">No seat selected</option>
                <option
                  v-for="seat in endTriggerSeatOptions"
                  :key="seat.order"
                  :value="seat.order"
                >
                  {{ seat.label }}
                </option>
                <option value="custom">Custom</option>
              </Input>
              <Alert
                v-if="endTriggerSeatOptions.length === 0"
                color="info"
                class="mt-1"
              >
                No eligible characters for this trigger found in grimoire, but you can set a custom character below.
              </Alert>
              <p v-else class="text-xs text-stone-400 mt-1">
                Select a character from the grimoire, or set a custom character.
              </p>
            </label>
            <span v-else class="block">Select triggering character</span>
            <div class="flex gap-3 flex-wrap items-center">
              <div class="relative border border-stone-600 rounded p-4 flex justify-center items-center aspect-square">
                <Button
                  v-if="game.end_trigger_role"
                  type="button"
                  @click="clearEndTriggerRole"
                  class="absolute top-1 right-1 z-10"
                  color="contrast"
                  size="sm"
                  icon="x-lg"
                  display="icon-only"
                  circular
                  title="Clear ending cause"
                >
                  Clear
                </Button>
                <Token
                  v-if="game.end_trigger_role"
                  :character="endTriggerCharacter"
                  size="md"
                  class="cursor-pointer"
                  :class="{
                    'pointer-events-none opacity-50': !allowManualEndTriggerRole,
                  }"
                  @clickRole="openEndTriggerRoleDialog"
                  hideRelated
                />
                <Token v-else outline size="md" class="font-sorts">
                  <button
                    type="button"
                    @click="openEndTriggerRoleDialog"
                    class="w-full h-full p-1 text-sm"
                    :disabled="!allowManualEndTriggerRole"
                  >
                    <template v-if="allowManualEndTriggerRole">
                      Add Character
                    </template>
                    <template v-else>
                      Select Seat Above
                    </template>
                  </button>
                </Token>
              </div>
            </div>

          </div>
          <label
            v-if="
              game.end_trigger === GameEndTrigger.GAME_ENDED_EARLY ||
              game.end_trigger === GameEndTrigger.OTHER
            "
            class="block"
          >
            <span class="block">Reason</span>
            <Input type="text" v-model="game.end_trigger_note" />
          </label>
        </div>
      </details>
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
        <Button
          type="button"
          v-if="i !== 0"
          @click="removeCharacter(i)"
          class="absolute top-1 right-1 z-10"
          color="contrast"
          icon="x-lg"
          display="icon-only"
          circular
          title="Remove this role"
        >
          Remove
        </Button>
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
              color="primary"
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
        class="grimoire grimoire-edit relative w-full flex flex-col gap-2"
      >
        <div class="relative">
          <div 
            class="w-full max-w-[calc(100vw-4rem)] md:w-auto md:max-w-[966px] overflow-scroll bg-center bg-cover script-bg"
            :class="{
              ...scriptBgClasses(game.script, !!customBackground),
            }"
          >
            <Grimoire
              :tokens="game.grimoire[grimPage].tokens"
              :availableRoles="orderedRoles"
              :excludePlayers="storytellerNames"
              :pageIndex="grimPage"
              @deathToggled="recordDeathEvent"
              @selectedMe="applyMyRoleToGrimoire"
            />
            <div
              class="absolute bottom-0 w-full xl:w-[calc(100%-0.625rem)] text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800 text-white"
            >
              Page {{ grimPage + 1 }} of {{ game.grimoire.length }}
            </div>
          </div>
        </div>
        
        <Button
          type="button"
          @click="pageBackward"
          v-if="grimPage !== 0"
          icon="journal-prev"
          class="md:absolute bottom-1 left-1"
        >
          Previous page
        </Button>
        <Button
          v-if="game.grimoire.length > 1"
          @click.prevent="deletePage"
          color="negative"
          icon="journal-x"
          class="md:absolute top-1 right-4 z-10"
          title="Delete this page"
        >
          Delete page
        </Button>
        <Button
          type="button"
          @click="pageForward"
          :color="grimPage === game.grimoire.length - 1 ? 'positive' : 'neutral'"
          :icon="grimPage === game.grimoire.length - 1 ? 'journal-plus' : 'journal-next'"
          display="icon-after"
          class="md:absolute bottom-1 right-4"
        >
          <span v-if="grimPage <= game.grimoire.length - 1">
            {{
              grimPage === game.grimoire.length - 1 ? "Add page" : "Next page"
            }}
          </span>
        </Button>
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
            <Button
              type="button"
              @click="removeDemonBluff(i)"
              class="absolute top-1 right-1 z-10"
              color="contrast"
              size="sm"
              icon="x-lg"
              display="icon-only"
              circular
              title="Remove this demon bluff"
            >
              Remove
            </Button>
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
            <Button
              type="button"
              @click="removeFabled(i)"
              class="absolute top-1 right-1 z-10"
              size="sm"
              icon="x-lg"
              display="icon-only"
              circular
              title="Remove this fabled"
            >
              Remove
            </Button>
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
      <details :open="game.deaths.length > 0">
        <summary class="cursor-pointer">Deaths</summary>
        <div class="flex flex-col gap-4">
          <p v-if="game.deaths.length === 0" class="text-sm text-stone-400">
            No deaths recorded yet. Toggle a shroud in the grimoire to add an entry.
          </p>
          <Alert v-if="deathSyncSummary" :color="deathSyncAlertColor">
            {{ deathSyncSummary }}
          </Alert>
          <div
            v-for="pageGroup in deathEventsByPage"
            :key="pageGroup.page"
            class="flex flex-col gap-3"
          >
            <h4 class="font-sorts text-lg">
              Page {{ pageGroup.page + 1 }}
            </h4>
            <div class="grid grid-cols-[auto_1fr_auto] gap-x-8 gap-y-2">
              <div
                v-for="death in pageGroup.events"
                :key="`${pageGroup.page}-${death.seat_order}-${death.is_revival}-${death.player_name}`"
                class="col-span-full grid grid-cols-subgrid items-center border border-stone-600 rounded p-3"
              >
                <div class="flex items-center flex-col gap-1">
                  <div class="relative flex justify-center items-center aspect-square">
                    <Token
                      :character="deathSeatCharacter(death)"
                      size="md"
                      class="pointer-events-none"
                      hideRelated
                    />
                    <img
                      v-if="!death.is_revival"
                      src="/img/shroud.png"
                      class="absolute top-0 w-8 md:w-10"
                      alt=""
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">
                      {{ deathDisplayName(death) }}
                    </span>
                    <span class="text-xs text-stone-400 sr-only">
                      {{ death.is_revival ? "Revived" : "Died" }}
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <label>
                    <span class="block text-xs">Death type</span>
                    <Input
                      mode="select"
                    v-model="death.death_type"
                    :disabled="death.is_revival"
                  >
                    <option v-if="death.is_revival" :value="null">Revival</option>
                    <option v-else :value="null">Not tracked</option>
                    <option v-if="!death.is_revival" :value="DeathType.DEATH">
                      Death
                    </option>
                    <option v-if="!death.is_revival" :value="DeathType.EXECUTION">
                      Execution
                    </option>
                  </Input>
                  </label>
                  <label>
                    <span class="block text-xs">Cause</span>
                    <Input
                      mode="select"
                      v-model="death.cause"
                      :disabled="death.is_revival"
                    >
                      <option v-if="death.is_revival" :value="DeathCause.ABILITY">
                        Ability
                      </option>
                      <template v-else>
                        <option :value="null">Select cause</option>
                        <option :value="DeathCause.ABILITY">Ability</option>
                        <option :value="DeathCause.NOMINATION">Nomination</option>
                      </template>
                    </Input>
                  </label>
                  <label class="col-span-2">
                    <span class="block text-xs">Select triggering character</span>
                    <Input
                      mode="select"
                      :modelValue="getDeathSeatSelection(death)"
                      @update:modelValue="
                        (value) => updateDeathSeatSelection(death, value as any)
                      "
                    >
                      <option :value="null">No seat selected</option>
                      <option
                        v-for="seat in deathSeatOptionsForPage(pageGroup.page)"
                        :key="seat.order"
                        :value="seat.order"
                      >
                        {{ seat.label }}
                      </option>
                      <option value="custom">Custom</option>
                    </Input>
                  </label>
                </div>
                <div class="relative flex justify-center items-center aspect-square">
                  <Token
                    v-if="death.by_role_id"
                    :character="deathByRoleCharacter(death)"
                    size="md"
                    class="cursor-pointer"
                    :class="{
                      'pointer-events-none opacity-50': !allowManualDeathByRole(death),
                    }"
                    @clickRole="openDeathByRoleDialog(death)"
                    hideRelated
                  />
                  <Token v-else outline size="md" class="font-sorts">
                    <button
                      type="button"
                      @click="openDeathByRoleDialog(death)"
                      class="w-full h-full p-1 text-xs"
                      :disabled="!allowManualDeathByRole(death)"
                    >
                      <template v-if="allowManualDeathByRole(death)">
                        Add Role
                      </template>
                      <template v-else>
                        Select Seat
                      </template>
                    </button>
                  </Token>
                </div>
              </div>
            </div>
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
          @click.prevent="game.tags.splice(index, 1)"
          size="sm"
          removableTag
          :title="`Remove ${tag}`"
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
            <IconUI id="bgg" color="bgg" size="lg" />
            <Input
              type="text"
              v-model="bggIdInput"
              pattern="https:\/\/boardgamegeek\.com\/play\/details\/\d+"
            />
          </div>
          <Alert v-if="!bggIdIsValid" color="negative" class="mt-1">
            Invalid BoardGameGeek URL. Format should be:
            https://boardgamegeek.com/play/details/[game_id]
          </Alert>
        </label>
      </div>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames"
      class="border rounded border-stone-500 p-4 my-3"
    >
      <legend>Images</legend>
      <div class="flex flex-col gap-5">
        <Button type="button" @click="uploadFile" icon="upload">
          Upload Images
        </Button>
        <div class="flex flex-wrap gap-5">
          <div class='relative' v-for="file in game.image_urls" :key="file">
            <img
              crossorigin="anonymous"
              :src="file"
              class="w-64 h-64 object-cover"
            />
            <Button
              type="button"
              @click="removeFile(file)"
              class="absolute top-1 right-1 z-10"
              size="sm"
              icon="x-lg"
              display="icon-only"
              circular
              title="Remove this image"
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
    </fieldset>
    <div class="text-center">
      <Button
        type="submit"
        id="save-game"
        color="primary"
        wide
        :disabled="inFlight"
      >
        <template v-if="inFlight">
          <Spinner />
          Saving...
        </template>
        <template v-else>Save Game</template>
      </Button>
    </div>
    
  </form>
  <TokenDialog
    v-model:visible="showRoleSelectionDialog"
    v-model:excludeIrrelevant="excludeIrrelevantRoles"
    :availableRoles="visibleRoles"
    :restrictRoleIds="roleRestrictIds"
    :showExcludeIrrelevantToggle="
      tokenSet === 'end_trigger' || tokenSet === 'death_by_role'
    "
    @selectRole="selectRoleForToken"
    :alwaysShowFabled="tokenSet === 'fabled'"
    :hideTravelers="
      tokenSet !== 'player_characters' &&
      tokenSet !== 'end_trigger' &&
      tokenSet !== 'death_by_role'
    "
    :hideBlankRole="tokenSet === 'end_trigger' || tokenSet === 'death_by_role'"
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
import {
  GameEndTrigger,
  WinStatus_V2,
  DeathCause,
  DeathType,
  type GameRecord,
} from "~/composables/useGames";
import { END_TRIGGER_ROLE_INCLUDES } from "~/composables/gameEndTriggerConfig";
import { DEATH_ROLE_INCLUDES } from "~/composables/deathRoleConfig";
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
    end_trigger: GameEndTrigger | undefined;
    end_trigger_role_id: string | null;
    end_trigger_note: string;
    end_trigger_seat_page: number | null;
    end_trigger_seat_order: number | null;
    end_trigger_role?: {
      token_url: string;
      type: string;
      initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      name: string;
    } | null;
    deaths: {
      id?: number;
      grimoire_page: number;
      seat_order: number;
      is_revival: boolean;
      death_type: DeathType | null;
      cause: DeathCause | null;
      by_seat_page: number | null;
      by_seat_order: number | null;
      player_name: string;
      role_id: string | null;
      by_role_id: string | null;
    }[];
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
const tokenMode = ref<
  "role" | "related_role" | "end_trigger_role" | "death_by_role"
>("role");
const tokenSet = ref<
  "player_characters" | "demon_bluffs" | "fabled" | "end_trigger" | "death_by_role"
>("player_characters");
const excludeIrrelevantEndTriggerRoles = ref(true);
const excludeIrrelevantDeathRoles = ref(true);
const focusedDeathEvent = ref<{
  grimoire_page: number;
  seat_order: number;
  is_revival: boolean;
  death_type: DeathType | null;
  cause: DeathCause | null;
  by_seat_page: number | null;
  by_seat_order: number | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
} | null>(null);
const deathSyncSummary = ref("");
const deathSyncStats = ref({ added: 0, updated: 0, removed: 0 });
const deathSyncDone = ref(false);
const deathCustomSeatSelections = ref(new Set<string>());

// Grimoire
const showCopyGrimoireDialog = ref(false);
const grimPage = ref(props.game.grimoire.length - 1);
const tagsInput = ref("");
const bggIdInput = ref("");
const bggIdIsValid = ref(true);
const customBackground = ref<string | null>(null);

const endTriggerCharacter = computed(() => {
  const role = props.game.end_trigger_role;
  if (!role) {
    return {
      name: "",
      alignment: "NEUTRAL",
      role: {
        token_url: "/1x1.png",
        type: "",
        initial_alignment: "NEUTRAL",
      },
    };
  }

  return {
    name: role.name,
    alignment: role.initial_alignment,
    role: {
      token_url: role.token_url,
      type: role.type,
      initial_alignment: role.initial_alignment,
    },
  };
});

const endTriggerSeatPageIndex = computed(() => {
  return Math.max(0, props.game.grimoire.length - 1);
});

const endTriggerSeatTokens = computed(() => {
  if (!props.game.grimoire.length) return [];
  return props.game.grimoire[endTriggerSeatPageIndex.value]?.tokens ?? [];
});

const scriptRoleIds = computed(() => new Set(roles.value.map((role) => role.id)));

const endTriggerIncludeRoleIds = computed(() => {
  if (!props.game.end_trigger) return [];
  const config = END_TRIGGER_ROLE_INCLUDES[props.game.end_trigger];
  if (!config) return [];

  const base = config.base ?? [];
  const conditional = config.conditional ?? [];
  const includes = [
    ...base,
    ...conditional
      .filter((entry) =>
        entry.requires.every((required) => scriptRoleIds.value.has(required))
      )
      .map((entry) => entry.role),
  ];

  return Array.from(new Set(includes));
});

const endTriggerSeatOptions = computed(() => {
  let tokens = endTriggerSeatTokens.value;
  if (props.game.end_trigger) {
    const includes = endTriggerIncludeRoleIds.value;
    if (includes.length > 0) {
      const allowed = new Set(includes);
      tokens = tokens.filter((token) => token.role_id && allowed.has(token.role_id));
    }
  }

  return tokens.map((token) => {
    const roleName = token.role?.name || "Unknown role";
    const playerName = token.player_name || "Unknown player";

    return {
      order: token.order,
      label: `[Seat ${token.order + 1}] ${roleName} - ${playerName}`,
      token,
    };
  });
});

const endTriggerSeatSelection = ref<number | "custom" | null>(
  props.game.end_trigger_seat_order ?? null
);

watch(
  () => props.game.end_trigger_seat_order,
  (value) => {
    if (value === null || value === undefined) {
      endTriggerSeatSelection.value = null;
    } else {
      endTriggerSeatSelection.value = value as number;
    }
  }
);

watch(
  () => endTriggerSeatOptions.value.length,
  (length) => {
    if (length === 0) {
      endTriggerSeatSelection.value = "custom";
    } else if (endTriggerSeatSelection.value === "custom") {
      // Keep custom if the user chose it; otherwise allow default "No seat selected".
      if (props.game.end_trigger_seat_order === null) {
        endTriggerSeatSelection.value = null;
      }
    }
  },
  { immediate: true }
);

const allowManualEndTriggerRole = computed(() => {
  if (!advancedModeEnabled.value) return true;
  if (endTriggerSeatOptions.value.length === 0) return true;
  return endTriggerSeatSelection.value === "custom";
});

function selectEndTriggerSeat() {
  const selection = endTriggerSeatSelection.value;

  if (selection === "custom") {
    props.game.end_trigger_seat_order = null;
    props.game.end_trigger_seat_page = null;
    return;
  }

  if (selection === null) {
    props.game.end_trigger_seat_order = null;
    props.game.end_trigger_seat_page = null;
    return;
  }

  props.game.end_trigger_seat_order = selection;
  props.game.end_trigger_seat_page = endTriggerSeatPageIndex.value;
  const seat = endTriggerSeatOptions.value.find(
    (option) => option.order === selection
  );
  if (!seat?.token) return;

  if (seat.token.role_id) {
    props.game.end_trigger_role_id = seat.token.role_id;
    if (seat.token.role) {
      props.game.end_trigger_role = {
        token_url: seat.token.role.token_url,
        type: seat.token.role.type,
        initial_alignment: seat.token.role.initial_alignment,
        name: seat.token.role.name ?? "",
      };
    } else {
      props.game.end_trigger_role = null;
    }
  } else {
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
  }
}

const deathEventsByPage = computed(() => {
  const groups = new Map<number, typeof props.game.deaths>();
  for (const death of props.game.deaths || []) {
    if (!groups.has(death.grimoire_page)) {
      groups.set(death.grimoire_page, []);
    }
    groups.get(death.grimoire_page)!.push(death);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([page, events]) => ({
      page,
      events,
    }));
});

function getTokenForSeat(pageIndex: number, order: number) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return null;
  return page.tokens.find((token) => token.order === order) || null;
}

function deathSeatOptionsForPage(pageIndex: number) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return [];
  return page.tokens.map((token) => ({
    order: token.order,
    label: `[Seat ${token.order + 1}] ${token.role?.name || "Unknown role"} - ${
      token.player_name || "Unknown player"
    }`,
  }));
}

function deathDisplayName(death: {
  grimoire_page: number;
  seat_order: number;
  player_name: string;
}) {
  if (death.player_name) return death.player_name;
  const token = getTokenForSeat(death.grimoire_page, death.seat_order);
  return token?.player_name || token?.role?.name || `Seat ${death.seat_order + 1}`;
}

function deathSeatCharacter(death: {
  grimoire_page: number;
  seat_order: number;
}) {
  const token = getTokenForSeat(death.grimoire_page, death.seat_order);
  if (!token || !token.role) {
    return {
      name: "",
      alignment: "NEUTRAL",
      role: {
        token_url: "/1x1.png",
        type: "",
        initial_alignment: "NEUTRAL",
      },
    };
  }

  return {
    name: token.role?.name ?? "",
    alignment: token.alignment ?? "NEUTRAL",
    role: {
      token_url: token.role.token_url,
      type: token.role.type,
      initial_alignment: token.role.initial_alignment,
    },
  };
}

function recordDeathEvent(payload: {
  token: {
    order: number;
    player_name: string;
    role_id: string | null;
  };
  isDead: boolean;
  pageIndex: number;
}) {
  const previousPageIndex = payload.pageIndex - 1;
  const previousToken =
    previousPageIndex >= 0
      ? props.game.grimoire[previousPageIndex]?.tokens.find(
          (token) => token.order === payload.token.order
        )
      : null;
  const wasDeadPreviously = previousToken?.is_dead ?? false;
  const shouldRecordDeath = payload.isDead && !wasDeadPreviously;
  const shouldRecordRevival = !payload.isDead && wasDeadPreviously;

  const existingIndex = props.game.deaths.findIndex(
    (death) =>
      death.grimoire_page === payload.pageIndex &&
      death.seat_order === payload.token.order
  );
  if (existingIndex >= 0) {
    props.game.deaths.splice(existingIndex, 1);
  }

  // Only record when state changes between pages.
  if (!shouldRecordDeath && !shouldRecordRevival) {
    return;
  }

  const entry = {
    grimoire_page: payload.pageIndex,
    seat_order: payload.token.order,
    is_revival: shouldRecordRevival,
    death_type: null,
    cause: shouldRecordRevival ? DeathCause.ABILITY : null,
    by_seat_page: shouldRecordRevival ? null : payload.pageIndex,
    by_seat_order: null,
    player_name: payload.token.player_name || "",
    role_id: payload.token.role_id ?? null,
    by_role_id: null,
  };

  props.game.deaths.push(entry);
}

function syncDeathEventsFromGrimoire() {
  if (deathSyncDone.value || props.editingMultipleGames) return;
  if (!props.game.grimoire.length) return;

  let added = 0;
  let removed = 0;
  let updated = 0;

  const events = props.game.deaths;
  const toRemoveIndices = new Set<number>();

  props.game.grimoire.forEach((page, pageIndex) => {
    page.tokens.forEach((token) => {
      const previousToken =
        pageIndex > 0
          ? props.game.grimoire[pageIndex - 1]?.tokens.find(
              (t) => t.order === token.order
            )
          : null;
      const wasDeadPreviously = previousToken?.is_dead ?? false;
      const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
      const shouldHaveRevival = !token.is_dead && wasDeadPreviously;

      const matchingIndices = events
        .map((death, index) =>
          death.grimoire_page === pageIndex &&
          death.seat_order === token.order
            ? index
            : -1
        )
        .filter((index) => index >= 0);

      if (!shouldHaveDeath && !shouldHaveRevival) {
        matchingIndices.forEach((index) => toRemoveIndices.add(index));
        return;
      }

      if (matchingIndices.length === 0) {
        events.push({
          grimoire_page: pageIndex,
          seat_order: token.order,
          is_revival: shouldHaveRevival,
          death_type: null,
          cause: shouldHaveRevival ? DeathCause.ABILITY : null,
          by_seat_page: shouldHaveRevival ? null : pageIndex,
          by_seat_order: null,
          player_name: token.player_name || "",
          role_id: token.role_id ?? null,
          by_role_id: null,
        });
        added += 1;
        return;
      }

      // Keep the first, remove any extra duplicates.
      matchingIndices.slice(1).forEach((index) => toRemoveIndices.add(index));

      const existing = events[matchingIndices[0]];
      if (existing.is_revival !== shouldHaveRevival) {
        existing.is_revival = shouldHaveRevival;
        if (shouldHaveRevival) {
          existing.cause = DeathCause.ABILITY;
          existing.by_seat_page = null;
          existing.by_seat_order = null;
          existing.by_role_id = null;
          existing.death_type = null;
        } else if (existing.by_seat_page === null) {
          existing.by_seat_page = pageIndex;
        }
        updated += 1;
      }

      // Leave death_type unset by default.
      if (existing.is_revival && existing.cause === null) {
        existing.cause = DeathCause.ABILITY;
      }

      if (!existing.player_name) {
        existing.player_name = token.player_name || "";
      }
      if (!existing.role_id) {
        existing.role_id = token.role_id ?? null;
      }
    });
  });

  const sortedIndices = Array.from(toRemoveIndices).sort((a, b) => b - a);
  sortedIndices.forEach((index) => {
    events.splice(index, 1);
    removed += 1;
  });

  if (added || removed || updated) {
    deathSyncStats.value = { added, updated, removed };
    deathSyncSummary.value = `Synced deaths: ${added} added, ${updated} updated, ${removed} removed.`;
  }

  deathSyncDone.value = true;
}

function getDeathSeatSelection(death: {
  by_seat_order: number | null;
  by_role_id: string | null;
  grimoire_page: number;
  seat_order: number;
}) {
  if (death.by_seat_order !== null) return death.by_seat_order;
  const key = `${death.grimoire_page}:${death.seat_order}`;
  if (deathCustomSeatSelections.value.has(key)) return "custom";
  return null;
}

function updateDeathSeatSelection(
  death: {
    grimoire_page: number;
    by_seat_order: number | null;
    by_seat_page: number | null;
    by_role_id: string | null;
  },
  value: number | "custom" | null
) {
  const key = `${death.grimoire_page}:${death.seat_order}`;
  if (value === "custom") {
    death.by_seat_order = null;
    death.by_seat_page = null;
    deathCustomSeatSelections.value.add(key);
    return;
  }

  if (value === null) {
    death.by_seat_order = null;
    death.by_seat_page = null;
    death.by_role_id = null;
    deathCustomSeatSelections.value.delete(key);
    return;
  }

  death.by_seat_order = value;
  death.by_seat_page = death.grimoire_page;
  const token = getTokenForSeat(death.grimoire_page, value);
  if (token?.role_id) {
    death.by_role_id = token.role_id;
  }
  deathCustomSeatSelections.value.delete(key);
}

function allowManualDeathByRole(death: {
  grimoire_page: number;
  by_seat_order: number | null;
  by_role_id: string | null;
}) {
  const options = deathSeatOptionsForPage(death.grimoire_page);
  if (options.length === 0) return true;
  const key = `${death.grimoire_page}:${death.seat_order}`;
  return deathCustomSeatSelections.value.has(key);
}

function deathByRoleCharacter(death: { by_role_id: string | null }) {
  if (!death.by_role_id) {
    return {
      name: "",
      alignment: "NEUTRAL",
      role: {
        token_url: "/1x1.png",
        type: "",
        initial_alignment: "NEUTRAL",
      },
    };
  }
  const role = allRoles.getRole(death.by_role_id);
  if (!role) {
    return {
      name: "",
      alignment: "NEUTRAL",
      role: {
        token_url: "/1x1.png",
        type: "",
        initial_alignment: "NEUTRAL",
      },
    };
  }
  return {
    name: role.name,
    alignment: role.initial_alignment,
    role: {
      token_url: role.token_url,
      type: role.type,
      initial_alignment: role.initial_alignment,
    },
  };
}

const deathSyncAlertColor = computed(() => {
  if (!deathSyncSummary.value) return "info";
  const { updated, removed } = deathSyncStats.value;
  return updated > 0 || removed > 0 ? "caution" : "positive";
});

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

watch(
  () => props.game.end_trigger,
  (value) => {
    if (value === undefined) return;

    if (
      value !== GameEndTrigger.CHARACTER_ABILITY &&
      value !== GameEndTrigger.NO_LIVING_DEMON &&
      value !== GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
    ) {
      props.game.end_trigger_role_id = null;
      props.game.end_trigger_role = null;
      props.game.end_trigger_seat_order = null;
      props.game.end_trigger_seat_page = null;
    }
    // Clear any previously selected character whenever the trigger changes.
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_seat_order = null;
    props.game.end_trigger_seat_page = null;

    if (
      value !== GameEndTrigger.GAME_ENDED_EARLY &&
      value !== GameEndTrigger.OTHER
    ) {
      props.game.end_trigger_note = "";
    }
  }
);

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
  if (tokenSet.value === "end_trigger") {
    return roles.value.length > 0 ? roles.value : allRoles.getAllRoles();
  }
  if (tokenSet.value === "death_by_role") {
    return roles.value.length > 0 ? roles.value : allRoles.getAllRoles();
  }

  return roles.value.filter((role) => {
    switch (tokenSet.value) {
      case "player_characters":
        return true;
      case "demon_bluffs":
        return role.type === "TOWNSFOLK" || role.type === "OUTSIDER";
      case "fabled":
        return role.type === "FABLED";
      default:
        return true;
    }
  });
});

const endTriggerRestrictRoleIds = computed(() => {
  if (tokenSet.value !== "end_trigger") return null;
  if (!props.game.end_trigger) return null;
  const includes = endTriggerIncludeRoleIds.value;
  return includes.length > 0 ? includes : null;
});

const deathByRoleRestrictRoleIds = computed(() => {
  if (tokenSet.value !== "death_by_role") return null;
  const death = focusedDeathEvent.value;
  if (!death) return null;
  const type = death.death_type ?? DeathType.DEATH;
  const includes = DEATH_ROLE_INCLUDES[type] || [];
  return includes.length > 0 ? includes : null;
});

const roleRestrictIds = computed(() => {
  if (tokenSet.value === "end_trigger") return endTriggerRestrictRoleIds.value;
  if (tokenSet.value === "death_by_role")
    return deathByRoleRestrictRoleIds.value;
  return null;
});

const excludeIrrelevantRoles = computed({
  get: () => {
    if (tokenSet.value === "end_trigger") {
      return excludeIrrelevantEndTriggerRoles.value;
    }
    if (tokenSet.value === "death_by_role") {
      return excludeIrrelevantDeathRoles.value;
    }
    return false;
  },
  set: (value) => {
    if (tokenSet.value === "end_trigger") {
      excludeIrrelevantEndTriggerRoles.value = value;
    } else if (tokenSet.value === "death_by_role") {
      excludeIrrelevantDeathRoles.value = value;
    }
  },
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

const showCommunityPrivacyAlert = computed(() => {
  const hasCommunity = !!props.game.community_id || !!props.game.community_name;
  if (!hasCommunity) return false;

  return (
    props.game.privacy === "PRIVATE" ||
    props.game.privacy === "FRIENDS_ONLY"
  );
});

const communityPrivacyAlertText = computed(() => {
  return props.game.privacy === "FRIENDS_ONLY"
    ? "Community-tagged games appear in its lists/stats, even if 'Friends Only'. Non-friends won't see a link to the full game."
    : "Community-tagged games appear in its lists/stats, even if 'Private'. Others won't see a link to the full game.";
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
  token: Partial<Character> | null,
  mode: "role" | "related_role" | "end_trigger_role" | "death_by_role",
  set:
    | "player_characters"
    | "demon_bluffs"
    | "fabled"
    | "end_trigger"
    | "death_by_role" = "player_characters"
) {
  focusedToken = token;
  tokenMode.value = mode;
  tokenSet.value = set;
  showRoleSelectionDialog.value = true;
}

function openEndTriggerRoleDialog() {
  excludeIrrelevantEndTriggerRoles.value = true;
  openRoleSelectionDialog(null, "end_trigger_role", "end_trigger");
}

function openDeathByRoleDialog(death: {
  grimoire_page: number;
  seat_order: number;
  is_revival: boolean;
  death_type: DeathType | null;
  cause: DeathCause | null;
  by_seat_page: number | null;
  by_seat_order: number | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
}) {
  focusedDeathEvent.value = death;
  excludeIrrelevantDeathRoles.value = true;
  openRoleSelectionDialog(null, "death_by_role", "death_by_role");
}

function clearEndTriggerRole() {
  props.game.end_trigger_role_id = null;
  props.game.end_trigger_role = null;
  props.game.end_trigger_seat_order = null;
  props.game.end_trigger_seat_page = null;
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
  if (tokenMode.value === "end_trigger_role") {
    if (role.id) {
      props.game.end_trigger_role_id = role.id;
      props.game.end_trigger_role = {
        token_url: role.token_url,
        type: role.type,
        initial_alignment: role.initial_alignment,
        name: role.name,
      };
      props.game.end_trigger_seat_order = null;
      props.game.end_trigger_seat_page = null;
    } else {
      props.game.end_trigger_role_id = null;
      props.game.end_trigger_role = null;
      props.game.end_trigger_seat_order = null;
      props.game.end_trigger_seat_page = null;
    }
    showRoleSelectionDialog.value = false;
    return;
  }
  if (tokenMode.value === "death_by_role") {
    const death = focusedDeathEvent.value;
    if (death) {
      death.by_role_id = role.id || null;
    }
    showRoleSelectionDialog.value = false;
    return;
  }

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

    grimoire.tokens.forEach((token, index) => {
      if (token.order !== index) {
        token.order = index;
      }
    });
  });

  if (!deathSyncDone.value && props.game.grimoire.length > 0) {
    syncDeathEventsFromGrimoire();
  }
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

        // Only sync player identity across pages - keep all other data independent
        // to prevent data loss when editing earlier pages (e.g., reminder tokens)
        token.player_id = newTokens[j].player_id;
        token.player_name = newTokens[j].player_name;
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

  syncDeathEventsFromGrimoire();
});
</script>

<style scoped>
.script-bg {
  background-image: var(--bg-image-url);
  background-attachment: local, local;

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

.grimoire {
  .overflow-scroll {
    /* Compensate scrollbars (and page count) so tokens are centered */
    padding-block-start: 1.25rem;
    padding-block-end: 1.5rem;

    scrollbar-width: thin;
    scrollbar-color: oklch(44.4% 0.011 73.639) transparent;
  }
}
</style>
