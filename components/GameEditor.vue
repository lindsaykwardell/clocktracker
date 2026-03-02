<template>
  <form class="max-w-[1000px] m-auto py-4 px-4 md:px-8" @submit.prevent="onSubmit">
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
        <div class="flex flex-col gap-3 w-full md:w-auto py-2">
          <label class="block">
            <Input mode="select" v-model="game.end_trigger">
              <option v-if="editingMultipleGames" :value="undefined">
                Not updated
              </option>
              <option :value="GameEndTrigger.NOT_RECORDED">
                Not recorded
              </option>
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
            v-if="shouldShowEndTriggerCharacterSection"
            class="flex gap-4 border border-stone-600 rounded p-4"
          >
            <div class="flex-1 grid grid-cols-2 gap-2">
              <label v-if="shouldShowEndTriggerType" class="block">
                <span class="block text-xs mb-[0.125rem]">Trigger type</span>
                <Input
                  mode="select"
                  v-model="game.end_trigger_type"
                  :disabled="hasSingleEndTriggerTypeOption"
                >
                  <option :value="null">Not recorded</option>
                  <option
                    v-for="option in endTriggerTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </Input>
              </label>
              <label
                v-if="shouldShowEndTriggerCause && shouldShowEndTriggerFieldsAfterType"
                class="block"
              >
                <span class="block text-xs mb-[0.125rem]">Cause</span>
                <Input
                  mode="select"
                  v-model="game.end_trigger_cause"
                  :disabled="hasSingleEndTriggerCauseOption"
                >
                  <option :value="null">Choose cause</option>
                  <option
                    v-for="option in endTriggerCauseOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </Input>
              </label>
              <label
                v-if="advancedModeEnabled && shouldShowEndTriggerFieldsAfterType"
                class="block col-span-2"
              >
                <span class="block text-xs mb-[0.125rem]"
                  >Select triggering character</span
                >
                <Input
                  mode="select"
                  v-model="endTriggerSeatSelection"
                  @change="selectEndTriggerSeat"
                  :disabled="
                    !shouldShowEndTriggerCharacter ||
                    endTriggerSeatOptions.length === 0
                  "
                >
                  <option :value="null">No character selected</option>
                  <option
                    v-for="seat in endTriggerSeatOptions"
                    :key="seat.participant_id"
                    :value="seat.participant_id"
                  >
                    {{ seat.label }}
                  </option>
                  <option value="custom">Set custom character</option>
                </Input>
                <Alert
                  v-if="shouldShowEndTriggerCharacter && endTriggerSeatOptions.length === 0"
                  color="info"
                  class="mt-1"
                >
                  No eligible characters for this trigger found in grimoire, but you can add a custom character.
                </Alert>
                <p
                  v-else-if="shouldShowEndTriggerCharacter"
                  class="text-xs text-stone-400 mt-1"
                >
                  Select a character from the grimoire, or add custom character.
                </p>
                <p v-else class="text-xs text-stone-400 mt-1">
                  Choose the trigger type and cause first.
                </p>
              </label>
              <span
                v-else-if="shouldShowEndTriggerFieldsAfterType"
                class="block"
              >
                Select triggering character
              </span>
            </div>
            <div
              v-if="shouldShowEndTriggerFieldsAfterType"
              class="flex gap-3 flex-wrap items-center"
            >
              <div class="relative flex justify-center items-center aspect-square">
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
                  title="Clear triggering character"
                >
                  Clear
                </Button>
                <Token
                  v-if="game.end_trigger_role"
                  :character="endTriggerCharacter"
                  size="md"
                  class="cursor-pointer"
                  :class="{
                    'pointer-events-none opacity-50':
                      !allowManualEndTriggerRole || !shouldShowEndTriggerCharacter,
                  }"
                  @clickRole="openEndTriggerRoleDialog"
                  hideRelated
                />
                <Token v-else outline size="md" class="font-sorts">
                  <button
                    type="button"
                    @click="openEndTriggerRoleDialog"
                    class="w-full h-full p-1 text-sm"
                    :disabled="
                      !allowManualEndTriggerRole || !shouldShowEndTriggerCharacter
                    "
                  >
                    <template v-if="allowManualEndTriggerRole">
                      Add Character
                    </template>
                    <template v-else>
                      No Character Selected
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
              :previousTokens="grimPage > 0 ? game.grimoire[grimPage - 1].tokens : []"
              :availableRoles="orderedRoles"
              :excludePlayers="storytellerNames"
              :pageIndex="grimPage"
              @deathToggled="recordGrimoireEvent"
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
      <details class="w-full">
        <summary class="cursor-pointer">Seating order</summary>
        <p class="text-xs text-stone-300 mt-1">
          Use drag and drop in the list below to move a player to a different seat (this page only).
        </p>
        <ul
          class="mt-2 flex flex-col gap-1"
          @dragover.prevent="onSeatListDragOver"
          @drop.prevent="onSeatDrop"
        >
          <li
            v-for="row in currentPageSeatRows"
            :key="`seat-reorder-${row.order}-${row.token.id ?? row.order}`"
            draggable="true"
            @dragstart="onSeatDragStart(row.order, $event)"
            @dragover.prevent="onSeatDragOver(row.order, $event)"
            @dragend="onSeatDragEnd"
            class="cursor-move flex items-center justify-between gap-2 rounded border border-stone-600 px-2 py-1 bg-stone-200/80 dark:bg-stone-900/80 relative"
            :class="{
              'opacity-60': draggedSeatOrder === row.order,
              'border-t-4 border-t-primary': dragTargetOrder === row.order && !dragTargetAfter,
              'border-b-4 border-b-primary': dragTargetOrder === row.order && dragTargetAfter,
            }"
          >
            <span class="flex items-center gap-2">
              <IconUI id="arrows-move" size="xs" />
              <span class="text-sm truncate">
                {{ row.token.role?.name || "No Role" }} - {{ row.token.player_name || "No Player" }}
              </span>
            </span>
            <span class="text-xs text-stone-500 shrink-0">
              Seat {{ row.order + 1 }}
            </span>
          </li>
        </ul>
        <div class="mt-2 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            icon="arrow-clockwise"
            @click="rotateCurrentPageSeats('cw')"
          >
            Move all seats clockwise
          </Button>
          <Button
            type="button"
            size="sm"
            icon="arrow-counterclockwise"
            @click="rotateCurrentPageSeats('ccw')"
          >
            Move all seats counterclockwise
          </Button>
        </div>
      </details>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames"
      class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover"
    >
      <legend>Grimoire Events</legend>
        <p v-if="game.grimoire_events.length === 0" class="text-sm text-stone-400">
          No events recorded yet.
        </p>
        <Alert v-if="grimoireEventSyncSummary" :color="grimoireEventSyncAlertColor">
          {{ grimoireEventSyncSummary }}
        </Alert>
        <details
          v-for="pageGroup in grimoireEventsByPage"
          :key="pageGroup.page"
          :open="pageGroup.events.some((event) => event.event_type !== null)"
        >
          <summary class="cursor-pointer">
            Grimoire Page {{ pageGroup.page + 1 }}
          </summary>
          <ul class="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 py-2">
            <li
              v-for="event in pageGroup.events"
              :key="`${pageGroup.page}-${event.participant_id}-${event.event_type}-${event.player_name}`"
              class="col-span-full grid grid-cols-subgrid items-center border border-stone-600 rounded p-3"
            >
              <div class="flex items-center flex-col gap-1">
                <div class="relative flex justify-center items-center">
                  <div class="relative token-container">
                    <div class="initial-token absolute">
                      <Token
                        v-if="
                          hasGrimoireEventPreviousSeatCharacter(event) &&
                          event.event_type === GrimoireEventType.ROLE_CHANGE
                        "
                        :character="grimoireEventPreviousSeatCharacter(event)"
                        size="md"
                        labelPosition="top"
                        class="pointer-events-none clip-token"
                        hideRelated
                      />
                      <Token
                        v-else-if="
                          hasGrimoireEventPreviousSeatCharacter(event) &&
                          event.event_type === GrimoireEventType.ALIGNMENT_CHANGE
                        "
                        :character="grimoireEventPreviousAlignmentCharacter(event)"
                        size="md"
                        labelPosition="top"
                        class="pointer-events-none clip-token"
                        hideRelated
                      />
                      <Token
                        v-else-if="
                          hasGrimoireEventPreviousSeatCharacter(event) &&
                          event.event_type === GrimoireEventType.SEAT_CHANGE
                        "
                        :character="grimoireEventPreviousSeatTokenCharacter(event)"
                        size="md"
                        labelPosition="top"
                        class="pointer-events-none clip-token"
                        hideRelated
                      />
                      <Token
                        v-else
                        :character="grimoireEventSeatCharacter(event)"
                        size="md"
                        class="pointer-events-none clip-token"
                        hideRelated
                      />
                      <img
                        v-if="
                          hasGrimoireEventPreviousSeatCharacter(event) &&
                          event.event_type === GrimoireEventType.REVIVE
                        "
                        src="/img/shroud.png"
                        class="absolute left-[50%] -translate-x-[50%] top-0 w-8 md:w-10"
                        alt=""
                      />
                    </div>
                    <div class="current-token relative">
                      <Token
                        :character="
                          event.event_type === GrimoireEventType.ALIGNMENT_CHANGE
                            ? grimoireEventSeatAlignmentCharacter(event)
                            : event.event_type === GrimoireEventType.SEAT_CHANGE
                              ? grimoireEventSeatTokenCharacter(event)
                            : grimoireEventSeatCharacter(event)
                        "
                        size="md"
                        class="pointer-events-none"
                        hideRelated
                      />
                      <img
                        v-if="
                          (event.event_type === null ||
                          event.event_type === GrimoireEventType.NOT_RECORDED ||
                          event.event_type === GrimoireEventType.DEATH || 
                          event.event_type === GrimoireEventType.EXECUTION)
                        "
                        src="/img/shroud.png"
                        class="absolute left-[50%] -translate-x-[50%] top-0 w-8 md:w-10"
                        alt=""
                      />
                    </div>
                  </div>
                  <span
                    class="absolute text-white top-1 left-[calc(50%+1rem)]"
                    title="Alignment switch"
                  >
                    <IconUI id="arrow-90deg-down" size="sm" class="-scale-x-100"/>
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm text-center font-medium text-balance max-w-40">
                    {{ grimoireEventDisplayName(event) }}
                  </span>
                  <span class="text-xs text-stone-400 sr-only">
                    {{ eventSummaryLabel(event) }}
                  </span>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label>
                  <span class="block text-xs mb-[0.125rem]">Event type</span>
                <Input
                  mode="select"
                  v-model="event.event_type"
                  :disabled="isEventTypeLocked(event)"
                    @update:modelValue="
                    () => {
                      event.cause = null;
                      event.by_participant_id = null;
                      event.by_role_id = null;
                      if (event.event_type === GrimoireEventType.REVIVE) {
                        event.cause = GrimoireEventCause.ABILITY;
                      }
                    }
                  "
                >
                  <option v-if="event.event_type === GrimoireEventType.REVIVE" :value="GrimoireEventType.REVIVE">
                    Revival
                  </option>
                  <template v-else-if="isEventTypeLocked(event)">
                    <option :value="event.event_type">
                      {{ eventTypeOptionLabel(event.event_type) }}
                    </option>
                  </template>
                  <template v-else>
                    <option :value="GrimoireEventType.NOT_RECORDED">Not recorded</option>
                    <option :value="GrimoireEventType.DEATH">
                      Death
                    </option>
                    <option :value="GrimoireEventType.EXECUTION">
                      Execution
                    </option>
                  </template>
                </Input>
                </label>
                <template
                  v-if="
                    event.event_type !== null &&
                    event.event_type !== GrimoireEventType.NOT_RECORDED
                  "
                >
                  <label>
                    <span class="block text-xs mb-[0.125rem]">Cause</span>
                    <Input
                      mode="select"
                      v-model="event.cause"
                      :disabled="event.event_type === GrimoireEventType.REVIVE"
                      @update:modelValue="onGrimoireEventCauseChange(event)"
                    >
                      <option v-if="event.event_type === GrimoireEventType.REVIVE" :value="GrimoireEventCause.ABILITY">
                        Ability
                      </option>
                      <template v-else>
                        <option :value="null">Select cause</option>
                        <option :value="GrimoireEventCause.ABILITY">Ability</option>
                        <option
                          v-if="event.event_type === GrimoireEventType.EXECUTION"
                          :value="GrimoireEventCause.NOMINATION"
                        >
                          Nomination
                        </option>
                      </template>
                    </Input>
                  </label>
                  <label class="col-span-2">
                    <span class="block text-xs mb-[0.125rem]">Select triggering character</span>
                    <Input
                      mode="select"
                      :modelValue="getGrimoireEventSeatSelection(event)"
                      @update:modelValue="
                        (value) => updateGrimoireEventSeatSelection(event, value as any)
                      "
                      :disabled="event.event_type !== GrimoireEventType.REVIVE && event.cause === null"
                    >
                      <option :value="null">No character selected</option>
                      <option
                        v-for="seat in grimoireEventSeatOptionsForPage(pageGroup.page, event.cause, event.event_type)"
                        :key="seat.participant_id"
                        :value="seat.participant_id"
                      >
                        {{ seat.label }}
                      </option>
                      <option value="custom">Set custom character</option>
                    </Input>
                  </label>
                </template>
              </div>
              <div
                v-if="
                  event.event_type !== null &&
                  event.event_type !== GrimoireEventType.NOT_RECORDED
                "
                class="relative flex justify-center items-center aspect-square"
              >
                <Token
                  v-if="event.by_role_id"
                  :character="grimoireEventByRoleCharacter(event)"
                  size="md"
                  class="cursor-pointer"
                  :class="{
                    'pointer-events-none opacity-50': !allowManualGrimoireEventByRole(event),
                  }"
                  @clickRole="openGrimoireEventByRoleDialog(event)"
                  hideRelated
                />
                <Token v-else outline size="md" class="font-sorts">
                  <button
                    type="button"
                    @click="openGrimoireEventByRoleDialog(event)"
                    class="w-full h-full p-1 text-xs"
                    :disabled="!allowManualGrimoireEventByRole(event)"
                  >
                    <template v-if="allowManualGrimoireEventByRole(event)">
                      Add Character
                    </template>
                    <template v-else>
                      No Character Selected
                    </template>
                  </button>
                </Token>
              </div>
            </li>
          </ul>
        </details>
    </fieldset>
    <fieldset
      v-if="!editingMultipleGames"
      class="block border rounded border-stone-500 p-4 my-3 bg-center bg-cover"
    >
      <legend>Additional Details</legend>
      <details :open="game.demon_bluffs.length > 0">
        <summary class="cursor-pointer">Demon Bluffs</summary>
        <div class="flex justify-center md:justify-normal flex-wrap gap-5 py-2">
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
        <summary class="cursor-pointer">Fabled & Loric</summary>
        <div class="flex justify-center md:justify-normal flex-wrap gap-5 py-2">
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
                Add NPC
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
      tokenSet === 'end_trigger' || tokenSet === 'event_by_role'
    "
    @selectRole="selectRoleForToken"
    :alwaysShowFabled="tokenSet === 'fabled'"
    :hideTravelers="
      tokenSet !== 'player_characters' &&
      tokenSet !== 'end_trigger' &&
      tokenSet !== 'event_by_role'
    "
    :hideBlankRole="tokenSet === 'end_trigger' || tokenSet === 'event_by_role'"
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
  GameEndTriggerType,
  GameEndTriggerCause,
  WinStatus_V2,
  GrimoireEventCause,
  GrimoireEventType,
  type GameRecord,
} from "~/composables/useGames";
import { END_TRIGGER_ROLE_INCLUDES } from "~/composables/gameEndTriggerConfig";
import {
  GRIMOIRE_EVENT_ROLE_INCLUDES,
  type RoleIncludeConfig,
} from "~/composables/grimoireEventRoleConfig";
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
    end_trigger_type: GameEndTriggerType | null;
    end_trigger_cause: GameEndTriggerCause | null;
    end_trigger_role_id: string | null;
    end_trigger_note: string;
    end_trigger_participant_id: string | null;
    end_trigger_role?: {
      token_url: string;
      type: string;
      initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      name: string;
    } | null;
    grimoire_events: {
      id?: number;
      grimoire_page: number;
      participant_id: string;
      event_type: GrimoireEventType | null;
      cause: GrimoireEventCause | null;
      by_participant_id: string | null;
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
        grimoire_participant_id?: string | null;
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
  "role" | "related_role" | "end_trigger_role" | "event_by_role"
>("role");
const tokenSet = ref<
  "player_characters" | "demon_bluffs" | "fabled" | "end_trigger" | "event_by_role"
>("player_characters");
const excludeIrrelevantEndTriggerRoles = ref(true);
const excludeIrrelevantGrimoireEventRoles = ref(true);
const focusedGrimoireEvent = ref<{
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
} | null>(null);
const grimoireEventSyncSummary = ref("");
const grimoireEventSyncStats = ref({ added: 0, updated: 0, removed: 0 });
const grimoireEventSyncDone = ref(false);
const grimoireEventCustomSeatSelections = ref(new Set<string>());

// Grimoire
const showCopyGrimoireDialog = ref(false);
const grimPage = ref(props.game.grimoire.length - 1);
const draggedSeatOrder = ref<number | null>(null);
const dragInsertIndex = ref<number | null>(null);
const dragTargetOrder = ref<number | null>(null);
const dragTargetAfter = ref(false);
const tagsInput = ref("");
const bggIdInput = ref("");
const bggIdIsValid = ref(true);
const customBackground = ref<string | null>(null);

const currentPageSeatRows = computed(() => {
  const page = props.game.grimoire[grimPage.value];
  if (!page) return [];
  return page.tokens
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((token) => ({
      order: token.order,
      token,
    }));
});

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

const endTriggerSeatTokens = computed(() => {
  if (!props.game.grimoire.length) return [];
  return props.game.grimoire[Math.max(0, props.game.grimoire.length - 1)]?.tokens ?? [];
});

const scriptRoleIds = computed(() => new Set(roles.value.map((role) => role.id)));

const shouldShowEndTriggerCharacterSection = computed(
  () =>
    props.game.end_trigger === GameEndTrigger.CHARACTER_ABILITY ||
    props.game.end_trigger === GameEndTrigger.NO_LIVING_DEMON ||
    props.game.end_trigger === GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
);

const shouldShowEndTriggerType = computed(
  () => shouldShowEndTriggerCharacterSection.value
);

const shouldShowEndTriggerCause = computed(() => {
  if (props.game.end_trigger === GameEndTrigger.CHARACTER_ABILITY) return true;
  if (!shouldShowEndTriggerType.value) return false;
  return props.game.end_trigger_type !== null;
});

const shouldShowEndTriggerCharacter = computed(() => {
  if (!shouldShowEndTriggerCharacterSection.value) return false;
  if (shouldShowEndTriggerType.value && props.game.end_trigger_type === null) {
    return false;
  }
  return props.game.end_trigger_cause !== null;
});

const shouldShowEndTriggerFieldsAfterType = computed(() => {
  if (!shouldShowEndTriggerCharacterSection.value) return false;
  if (!shouldShowEndTriggerType.value) return true;
  return props.game.end_trigger_type !== null;
});

const endTriggerTypeOptions = computed(() => {
  if (!shouldShowEndTriggerType.value) return [];
  if (props.game.end_trigger === GameEndTrigger.CHARACTER_ABILITY) {
    return [
      {
        value: GameEndTriggerType.EXTRA_WIN_CONDITION,
        label: "Extra win condition",
      },
    ];
  }
  return [
    {
      value: GameEndTriggerType.DEATH,
      label: "Death",
    },
    {
      value: GameEndTriggerType.EXECUTION,
      label: "Execution",
    },
    {
      value: GameEndTriggerType.CHARACTER_CHANGE,
      label: "Character change",
    },
    {
      value: GameEndTriggerType.OTHER,
      label: "Other",
    },
  ];
});

const hasSingleEndTriggerTypeOption = computed(
  () =>
    endTriggerTypeOptions.value.length === 1 &&
    props.game.end_trigger !== GameEndTrigger.CHARACTER_ABILITY
);

const endTriggerCauseOptions = computed(() => {
  if (props.game.end_trigger === GameEndTrigger.CHARACTER_ABILITY) {
    return [
      {
        value: GameEndTriggerCause.ABILITY,
        label: "Ability",
      },
    ];
  }

  if (!shouldShowEndTriggerType.value) return [];

  switch (props.game.end_trigger_type) {
    case GameEndTriggerType.DEATH:
      return [
        {
          value: GameEndTriggerCause.ABILITY,
          label: "Ability",
        },
      ];
    case GameEndTriggerType.EXECUTION:
      return [
        {
          value: GameEndTriggerCause.ABILITY,
          label: "Ability",
        },
        {
          value: GameEndTriggerCause.NOMINATION,
          label: "Nomination",
        },
      ];
    case GameEndTriggerType.CHARACTER_CHANGE:
      return [
        {
          value: GameEndTriggerCause.ABILITY,
          label: "Ability",
        },
      ];
    case GameEndTriggerType.OTHER:
      return [
        {
          value: GameEndTriggerCause.FAILED_ABILITY,
          label: "Failed ability",
        },
        {
          value: GameEndTriggerCause.ABILITY,
          label: "Ability",
        },
      ];
    default:
      return [];
  }
});

const hasSingleEndTriggerCauseOption = computed(
  () => endTriggerCauseOptions.value.length === 1
);

const endTriggerRoleConfig = computed(() => {
  if (
    !props.game.end_trigger ||
    !props.game.end_trigger_type ||
    !props.game.end_trigger_cause
  ) {
    return null;
  }
  return (
    END_TRIGGER_ROLE_INCLUDES[props.game.end_trigger]?.[
      props.game.end_trigger_type
    ]?.[props.game.end_trigger_cause] ?? null
  );
});

const endTriggerIncludeRoleIds = computed(() => {
  const config = endTriggerRoleConfig.value;
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
  if (endTriggerRoleConfig.value) {
    const includes = endTriggerIncludeRoleIds.value;
    const allowed = new Set(includes);
    tokens = tokens.filter((token) => token.role_id && allowed.has(token.role_id));
  }

  return tokens.map((token) => {
    const roleName = token.role?.name || "Unknown role";
    const playerName = token.player_name || "Unknown player";

    return {
      order: token.order,
      participant_id: token.grimoire_participant_id || `seat-${token.order}`,
      label: `[Seat ${token.order + 1}] ${roleName} - ${playerName}`,
      token,
    };
  });
});

const endTriggerSeatSelection = ref<string | "custom" | null>(
  props.game.end_trigger_participant_id ?? null
);

watch(
  () => props.game.end_trigger_participant_id,
  (value) => {
    if (value === null || value === undefined) {
      endTriggerSeatSelection.value = null;
    } else {
      endTriggerSeatSelection.value = value as string;
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
      if (props.game.end_trigger_participant_id === null) {
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
  if (!shouldShowEndTriggerCharacter.value) {
    props.game.end_trigger_participant_id = null;
    return;
  }

  const selection = endTriggerSeatSelection.value;

  if (selection === "custom") {
    props.game.end_trigger_participant_id = null;
    return;
  }

  if (selection === null) {
    props.game.end_trigger_participant_id = null;
    return;
  }

  props.game.end_trigger_participant_id = selection;
  const seat = endTriggerSeatOptions.value.find(
    (option) => option.token.grimoire_participant_id === selection
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

function grimoireEventSortPriority(eventType: GrimoireEventType | null) {
  switch (eventType) {
    case GrimoireEventType.SEAT_CHANGE:
      return 0;
    case GrimoireEventType.ROLE_CHANGE:
      return 1;
    case GrimoireEventType.ALIGNMENT_CHANGE:
      return 2;
    case GrimoireEventType.DEATH:
    case GrimoireEventType.EXECUTION:
    case GrimoireEventType.REVIVE:
    case GrimoireEventType.NOT_RECORDED:
    case null:
    default:
      return 3;
  }
}

const grimoireEventsByPage = computed(() => {
  const groups = new Map<number, typeof props.game.grimoire_events>();
  for (const event of props.game.grimoire_events || []) {
    if (!groups.has(event.grimoire_page)) {
      groups.set(event.grimoire_page, []);
    }
    groups.get(event.grimoire_page)!.push(event);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([page, events]) => ({
      page,
      events: events.slice().sort((a, b) => {
        const aToken = getTokenForParticipant(page, a.participant_id);
        const bToken = getTokenForParticipant(page, b.participant_id);
        const aOrder = aToken?.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = bToken?.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;

        const aPriority = grimoireEventSortPriority(a.event_type);
        const bPriority = grimoireEventSortPriority(b.event_type);
        if (aPriority !== bPriority) return aPriority - bPriority;

        const aName = normalizePlayerName(a.player_name || aToken?.player_name);
        const bName = normalizePlayerName(b.player_name || bToken?.player_name);
        if (aName !== bName) return aName.localeCompare(bName);

        return (a.participant_id || "").localeCompare(b.participant_id || "");
      }),
    }));
});

function getTokenForSeat(pageIndex: number, order: number) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return null;
  return page.tokens.find((token) => token.order === order) || null;
}

function getTokenForParticipant(pageIndex: number, participantId: string) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return null;
  return (
    page.tokens.find(
      (token) => token.grimoire_participant_id === participantId
    ) || null
  );
}

function normalizePlayerName(name?: string | null) {
  return (name || "").trim().toLowerCase();
}

function createParticipantId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `gp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

let recomputingParticipantIds = false;

function recomputeGrimoireParticipantIds() {
  if (recomputingParticipantIds) return;
  if (!props.game.grimoire.length) return;
  recomputingParticipantIds = true;

  try {
    const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

    const firstPage = props.game.grimoire[0];
    firstPage.tokens.forEach((token) => {
      if (!token.grimoire_participant_id) {
        token.grimoire_participant_id = createParticipantId();
      }
    });

    for (let pageIndex = 1; pageIndex < props.game.grimoire.length; pageIndex += 1) {
      const page = props.game.grimoire[pageIndex];
      const previousPage = props.game.grimoire[pageIndex - 1];
      if (!previousPage) continue;

      const previousTokens = previousPage.tokens.slice().sort(byOrder);
      const currentTokens = page.tokens.slice().sort(byOrder);
      const usedPreviousOrders = new Set<number>();

      for (const token of currentTokens) {
        const tokenName = normalizePlayerName(token.player_name);
        const scored = previousTokens
          .filter((candidate) => !usedPreviousOrders.has(candidate.order))
          .map((candidate) => {
            let score = 0;
            if (token.player_id && candidate.player_id && token.player_id === candidate.player_id) {
              score += 100;
            }
            const candidateName = normalizePlayerName(candidate.player_name);
            if (tokenName && candidateName && tokenName === candidateName) {
              score += 60;
            }
            if (token.role_id && candidate.role_id && token.role_id === candidate.role_id) {
              score += 40;
            }
            if (token.order === candidate.order) {
              score += 20;
            }
            return { candidate, score };
          })
          .sort((a, b) => b.score - a.score);

        const best = scored[0];
        const second = scored[1];
        const hasStrongMatch = !!best && best.score >= 60;
        const isAmbiguous = !!best && !!second && best.score === second.score;

        if (hasStrongMatch && !isAmbiguous && best.candidate.grimoire_participant_id) {
          token.grimoire_participant_id = best.candidate.grimoire_participant_id;
          usedPreviousOrders.add(best.candidate.order);
          continue;
        }

        if (!token.grimoire_participant_id) {
          token.grimoire_participant_id = createParticipantId();
        }
      }
    }
  } finally {
    recomputingParticipantIds = false;
  }
}

function onSubmit() {
  recomputeGrimoireParticipantIds();
  emit("submit");
}

function normalizePageTokenOrders(
  tokens: {
    order: number;
  }[]
) {
  const sorted = tokens.slice().sort((a, b) => a.order - b.order);
  let hasMismatch = false;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].order !== i) {
      hasMismatch = true;
      break;
    }
  }
  if (!hasMismatch) return false;

  sorted.forEach((token, index) => {
    token.order = index;
  });
  return true;
}

function findMatchingTokenOnPreviousPage(
  pageIndex: number,
  token: {
    order: number;
    grimoire_participant_id?: string | null;
    player_id?: string | null;
    player_name?: string | null;
    role_id?: string | null;
  },
  usedPreviousOrders?: Set<number>,
  preferPreviousDead?: boolean | null
) {
  if (pageIndex <= 0) return null;
  const previousPage = props.game.grimoire[pageIndex - 1];
  if (!previousPage) return null;

  const available = previousPage.tokens.filter(
    (candidate) => !usedPreviousOrders?.has(candidate.order)
  );

  if (token.grimoire_participant_id) {
    const byParticipantId =
      available.find(
        (candidate) =>
          candidate.grimoire_participant_id === token.grimoire_participant_id
      ) || null;
    if (byParticipantId) {
      usedPreviousOrders?.add(byParticipantId.order);
      return byParticipantId;
    }
  }

  if (token.player_id) {
    const byPlayerId =
      available.find((candidate) => candidate.player_id === token.player_id) || null;
    if (byPlayerId) {
      usedPreviousOrders?.add(byPlayerId.order);
      return byPlayerId;
    }
  }

  const tokenName = normalizePlayerName(token.player_name);
  if (tokenName) {
    const byName = available.filter(
      (candidate) => normalizePlayerName(candidate.player_name) === tokenName
    );
    if (byName.length > 0) {
      const preferredByState =
        preferPreviousDead === null || preferPreviousDead === undefined
          ? null
          : byName.find((candidate) => candidate.is_dead === preferPreviousDead);
      const preferred =
        preferredByState ||
        byName.find((candidate) => candidate.order === token.order) ||
        byName[0];
      usedPreviousOrders?.add(preferred.order);
      return preferred;
    }
  }

  if (token.role_id) {
    const byRole = available.filter((candidate) => candidate.role_id === token.role_id);
    if (byRole.length > 0) {
      const preferredByState =
        preferPreviousDead === null || preferPreviousDead === undefined
          ? null
          : byRole.find((candidate) => candidate.is_dead === preferPreviousDead);
      const preferred =
        preferredByState ||
        byRole.find((candidate) => candidate.order === token.order) ||
        byRole[0];
      usedPreviousOrders?.add(preferred.order);
      return preferred;
    }
  }

  const byOrder = available.find((candidate) => candidate.order === token.order) || null;
  if (byOrder) {
    usedPreviousOrders?.add(byOrder.order);
  }
  return byOrder;
}

function grimoireEventSeatOptionsForPage(
  pageIndex: number,
  cause: GrimoireEventCause | null,
  eventType: GrimoireEventType | null
) {
  const page = props.game.grimoire[pageIndex];
  if (!page) return [];
  const previousPage =
    pageIndex > 0 ? props.game.grimoire[pageIndex - 1] : null;
  const ordered = page.tokens.slice().sort((a, b) => a.order - b.order);
  const resolveIncludesForEventType = (type: GrimoireEventType) => {
    const config: RoleIncludeConfig = GRIMOIRE_EVENT_ROLE_INCLUDES[type];
    const includes = [
      ...(config.base ?? []),
      ...(config.conditional ?? [])
        .filter((entry) =>
          entry.requires.every((required) => scriptRoleIds.value.has(required))
        )
        .map((entry) => entry.role),
    ];
    return Array.from(new Set(includes));
  };

  const abilityIncludes =
    cause === GrimoireEventCause.ABILITY && eventType !== null
      ? resolveIncludesForEventType(eventType)
      : [];
  const abilityAllowed =
    abilityIncludes.length > 0 ? new Set(abilityIncludes) : null;

  const currentOptions = ordered
    .filter((token) => {
      if (
        abilityAllowed &&
        (!token.role_id || !abilityAllowed.has(token.role_id))
      ) {
        return false;
      }
      if (cause !== GrimoireEventCause.NOMINATION) return true;
      const prev =
        previousPage && pageIndex > 0
          ? findMatchingTokenOnPreviousPage(pageIndex, token)
          : null;
      const wasDead = prev?.is_dead ?? false;
      return !(token.is_dead && wasDead);
    })
    .map((token) => ({
      participant_id: token.grimoire_participant_id || `seat-${token.order}`,
      label: `[Page ${pageIndex + 1}: Seat ${token.order + 1}] 
        ${token.role?.name || "Unknown role"} - ${
        token.player_name || "Unknown player"
      }`,
    }));

  if (
    eventType !== GrimoireEventType.ROLE_CHANGE ||
    !previousPage ||
    !abilityAllowed
  ) {
    return currentOptions;
  }

  const existingParticipantIds = new Set(
    currentOptions.map((option) => option.participant_id)
  );

  const previousOptions = previousPage.tokens
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((token) => {
      const participantId = token.grimoire_participant_id || `seat-${token.order}`;
      if (existingParticipantIds.has(participantId)) return false;
      if (token.is_dead) return false;
      if (!token.role_id || !abilityAllowed.has(token.role_id)) return false;
      return true;
    })
    .map((token) => ({
      participant_id: token.grimoire_participant_id || `seat-${token.order}`,
      label: `[Page ${pageIndex}: Seat ${token.order + 1}] ${
        token.role?.name || "Unknown role"
      } - ${token.player_name || "Unknown player"}`,
    }));

  return [...currentOptions, ...previousOptions];
}

function grimoireEventAllowedRoleIds(
  cause: GrimoireEventCause | null,
  eventType: GrimoireEventType | null
) {
  if (cause !== GrimoireEventCause.ABILITY || eventType === null) return null;
  const config: RoleIncludeConfig = GRIMOIRE_EVENT_ROLE_INCLUDES[eventType];
  const includes = [
    ...(config.base ?? []),
    ...(config.conditional ?? [])
      .filter((entry) =>
        entry.requires.every((required) => scriptRoleIds.value.has(required))
      )
      .map((entry) => entry.role),
  ];
  return includes.length > 0 ? new Set(includes) : null;
}

function getSourceTokenForGrimoireEventSelection(event: {
  grimoire_page: number;
  by_participant_id: string | null;
  participant_id: string;
  cause: GrimoireEventCause | null;
  event_type: GrimoireEventType | null;
}, participantId: string) {
  const currentToken = getTokenForParticipant(event.grimoire_page, participantId);

  if (
    event.event_type !== GrimoireEventType.ROLE_CHANGE ||
    event.cause !== GrimoireEventCause.ABILITY ||
    event.grimoire_page <= 0
  ) {
    return currentToken;
  }

  const previousToken = getTokenForParticipant(event.grimoire_page - 1, participantId);
  const allowedRoleIds = grimoireEventAllowedRoleIds(event.cause, event.event_type);

  if (
    previousToken?.role_id &&
    (!allowedRoleIds || allowedRoleIds.has(previousToken.role_id)) &&
    currentToken?.role_id !== previousToken.role_id
  ) {
    return previousToken;
  }

  return currentToken ?? previousToken;
}

function grimoireEventDisplayName(event: {
  grimoire_page: number;
  participant_id: string;
  player_name: string;
}) {
  if (event.player_name) return event.player_name;
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  return token?.player_name || token?.role?.name || "Unknown player";
}

function grimoireEventSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
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

function grimoireEventSeatAlignmentCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  const alignment = token?.alignment ?? "NEUTRAL";
  const tokenUrl =
    alignment === "GOOD"
      ? "/img/role/good.webp"
      : alignment === "EVIL"
        ? "/img/role/evil.webp"
        : "/1x1.png";
  return {
    name:
      alignment === "GOOD" ? "Good" : alignment === "EVIL" ? "Evil" : "",
    alignment,
    role: {
      id: `alignment-${alignment.toLowerCase()}`,
      token_url: tokenUrl,
      custom_role: true,
      type: "",
      initial_alignment: alignment,
    },
  };
}

function hasGrimoireEventPreviousSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  if (event.grimoire_page <= 0) return false;
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  return !!token;
}

function grimoireEventPreviousSeatCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
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

function grimoireEventPreviousAlignmentCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  const alignment = token?.alignment ?? "NEUTRAL";
  const tokenUrl =
    alignment === "GOOD"
      ? "/img/role/good.webp"
      : alignment === "EVIL"
        ? "/img/role/evil.webp"
        : "/1x1.png";
  return {
    name:
      alignment === "GOOD" ? "Good" : alignment === "EVIL" ? "Evil" : "",
    alignment,
    role: {
      id: `alignment-${alignment.toLowerCase()}`,
      token_url: tokenUrl,
      custom_role: true,
      type: "",
      initial_alignment: alignment,
    },
  };
}

function grimoireEventSeatTokenCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(event.grimoire_page, event.participant_id);
  const seatNumber = token ? token.order + 1 : null;
  return {
    name: seatNumber ? `Seat ${seatNumber}` : "",
    alignment: "NEUTRAL" as const,
    role: {
      id: "seat-token-current",
      token_url: "/img/role/seat.webp",
      custom_role: true,
      type: "",
      initial_alignment: "NEUTRAL" as const,
    },
  };
}

function grimoireEventPreviousSeatTokenCharacter(event: {
  grimoire_page: number;
  participant_id: string;
}) {
  const token = getTokenForParticipant(
    event.grimoire_page - 1,
    event.participant_id
  );
  const seatNumber = token ? token.order + 1 : null;
  return {
    name: seatNumber ? `Seat ${seatNumber}` : "",
    alignment: "NEUTRAL" as const,
    role: {
      id: "seat-token-previous",
      token_url: "/img/role/seat.webp",
      custom_role: true,
      type: "",
      initial_alignment: "NEUTRAL" as const,
    },
  };
}

function isEventTypeLocked(event: {
  event_type: GrimoireEventType | null;
}) {
  return (
    event.event_type === GrimoireEventType.REVIVE ||
    event.event_type === GrimoireEventType.ROLE_CHANGE ||
    event.event_type === GrimoireEventType.SEAT_CHANGE ||
    event.event_type === GrimoireEventType.ALIGNMENT_CHANGE
  );
}

function eventSummaryLabel(event: {
  event_type: GrimoireEventType | null;
}) {
  if (event.event_type === GrimoireEventType.REVIVE) return "Revived";
  if (event.event_type === GrimoireEventType.EXECUTION) return "Executed";
  if (event.event_type === GrimoireEventType.ROLE_CHANGE) return "Character switched";
  if (event.event_type === GrimoireEventType.SEAT_CHANGE) return "Seat changed";
  if (event.event_type === GrimoireEventType.ALIGNMENT_CHANGE) return "Alignment switched";
  return "Died";
}

function eventTypeOptionLabel(eventType: GrimoireEventType | null) {
  if (eventType === GrimoireEventType.REVIVE) return "Revival";
  if (eventType === GrimoireEventType.ROLE_CHANGE) return "Character switch";
  if (eventType === GrimoireEventType.SEAT_CHANGE) return "Seat change";
  if (eventType === GrimoireEventType.ALIGNMENT_CHANGE) return "Alignment switch";
  if (eventType === GrimoireEventType.EXECUTION) return "Execution";
  if (eventType === GrimoireEventType.DEATH) return "Death";
  return "Not recorded";
}

function isReviveEventType(eventType: GrimoireEventType | null) {
  return eventType === GrimoireEventType.REVIVE;
}

function normalizeReminderRoleHint(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectDeadReminderSource(
  pageTokens: {
    is_dead: boolean;
    grimoire_participant_id?: string | null;
    role_id: string | null;
    role?: {
      name?: string;
      type: string;
      token_url: string;
    };
  }[],
  token: {
    reminders: { reminder: string; token_url: string }[];
  }
) {
  const deadReminder = token.reminders.find(
    (reminder) => reminder.reminder.trim().toLowerCase() === "dead"
  );
  if (!deadReminder?.token_url) return null;

  const reminderUrlHint = normalizeReminderRoleHint(deadReminder.token_url);
  if (!reminderUrlHint) return null;

  const matchingCharacters = pageTokens.filter((candidate) => {
    if (!candidate.role_id) return false;

    const roleNameHint = normalizeReminderRoleHint(candidate.role?.name);
    const roleIdHint = normalizeReminderRoleHint(candidate.role_id);

    return (
      (!!roleNameHint && reminderUrlHint.includes(roleNameHint)) ||
      (!!roleIdHint && reminderUrlHint.includes(roleIdHint))
    );
  });

  const matchingAliveCharacters = matchingCharacters.filter(
    (candidate) => !candidate.is_dead
  );
  const matchingDeadCharacters = matchingCharacters.filter(
    (candidate) => candidate.is_dead
  );

  const matchedCharacters =
    matchingAliveCharacters.length === 1
      ? matchingAliveCharacters
      : matchingDeadCharacters.length === 1
        ? matchingDeadCharacters
        : [];

  if (matchedCharacters.length !== 1) return null;

  const [source] = matchedCharacters;
  if (!source.grimoire_participant_id || !source.role_id) return null;

  return {
    by_participant_id: source.grimoire_participant_id,
    by_role_id: source.role_id,
  };
}

function recordGrimoireEvent(payload: {
  token: {
    order: number;
    player_name: string;
    role_id: string | null;
    player_id?: string | null;
    grimoire_participant_id?: string | null;
  };
  isDead: boolean;
  pageIndex: number;
}) {
  const pageToken = getTokenForSeat(payload.pageIndex, payload.token.order);
  if (pageToken && !pageToken.grimoire_participant_id) {
    pageToken.grimoire_participant_id = createParticipantId();
  }
  const participantId =
    payload.token.grimoire_participant_id ||
    pageToken?.grimoire_participant_id ||
    createParticipantId();

  const previousPageIndex = payload.pageIndex - 1;
  const previousToken =
    previousPageIndex >= 0
      ? findMatchingTokenOnPreviousPage(
          payload.pageIndex,
          payload.token,
          undefined,
          !payload.isDead
        )
      : null;
  const wasDeadPreviously = previousToken?.is_dead ?? false;
  const shouldRecordDeath = payload.isDead && !wasDeadPreviously;
  const shouldRecordRevival = !payload.isDead && wasDeadPreviously;

  const existingIndex = props.game.grimoire_events.findIndex(
    (event) =>
      event.grimoire_page === payload.pageIndex &&
      event.participant_id === participantId
  );
  if (existingIndex >= 0) {
    props.game.grimoire_events.splice(existingIndex, 1);
  }

  // Only record when state changes between pages.
  if (!shouldRecordDeath && !shouldRecordRevival) {
    syncGrimoireEventsFromGrimoire({ force: true, silent: true });
    return;
  }

  const entry = {
    grimoire_page: payload.pageIndex,
    participant_id: participantId,
    event_type: shouldRecordRevival
      ? GrimoireEventType.REVIVE
      : GrimoireEventType.NOT_RECORDED,
    cause: shouldRecordRevival ? GrimoireEventCause.ABILITY : null,
    by_participant_id: null,
    player_name: payload.token.player_name || "",
    role_id: payload.token.role_id ?? null,
    by_role_id: null,
  };

  props.game.grimoire_events.push(entry);

  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

function syncGrimoireEventsFromGrimoire(options?: {
  force?: boolean;
  silent?: boolean;
}) {
  const force = options?.force ?? false;
  const silent = options?.silent ?? false;
  if ((grimoireEventSyncDone.value && !force) || props.editingMultipleGames) return;
  if (!props.game.grimoire.length) return;

  let added = 0;
  let removed = 0;
  let updated = 0;

  const events = props.game.grimoire_events;
	  const expected = new Map<
	    string,
	    {
	      grimoire_page: number;
	      participant_id: string;
	      event_type: GrimoireEventType | null;
	      by_participant_id: string | null;
	      player_name: string;
	      role_id: string | null;
	      by_role_id: string | null;
	    }
	  >();

  function eventKindFromValues(
    eventType: GrimoireEventType | null
  ): "death" | "revival" | "role" | "seat" | "alignment" {
    if (isReviveEventType(eventType)) return "revival";
    if (eventType === GrimoireEventType.ROLE_CHANGE) return "role";
    if (eventType === GrimoireEventType.SEAT_CHANGE) return "seat";
    if (eventType === GrimoireEventType.ALIGNMENT_CHANGE) return "alignment";
    return "death";
  }

  function expectedKey(
    grimoirePage: number,
    participantId: string,
    kind: "death" | "revival" | "role" | "seat" | "alignment"
  ) {
    return `${grimoirePage}:${participantId}:${kind}`;
  }

  function detectSingleSeatMove(
    previousIds: string[],
    currentIds: string[]
  ): string | null {
    if (previousIds.length !== currentIds.length) return null;
    if (previousIds.join("|") === currentIds.join("|")) return null;

    const prevSet = new Set(previousIds);
    if (
      prevSet.size !== previousIds.length ||
      currentIds.some((id) => !prevSet.has(id))
    ) {
      return null;
    }

    let foundMovedId: string | null = null;
    for (let from = 0; from < previousIds.length; from += 1) {
      const moved = previousIds[from];
      const withoutMoved = previousIds
        .slice(0, from)
        .concat(previousIds.slice(from + 1));
      for (let to = 0; to <= withoutMoved.length; to += 1) {
        const candidate = withoutMoved
          .slice(0, to)
          .concat([moved], withoutMoved.slice(to));
        if (candidate.join("|") === currentIds.join("|")) {
          if (foundMovedId && foundMovedId !== moved) {
            return null;
          }
          foundMovedId = moved;
        }
      }
    }

    return foundMovedId;
  }

	  props.game.grimoire.forEach((page, pageIndex) => {
	    const orderedTokens = page.tokens.slice().sort((a, b) => a.order - b.order);
	    const usedPreviousOrders = new Set<number>();
	    orderedTokens.forEach((token) => {
      const previousToken =
        pageIndex > 0
          ? findMatchingTokenOnPreviousPage(
              pageIndex,
              token,
              usedPreviousOrders,
              !token.is_dead
            )
          : null;
      const wasDeadPreviously = previousToken?.is_dead ?? false;
      const shouldHaveDeath = token.is_dead && !wasDeadPreviously;
      const shouldHaveRevival = !token.is_dead && wasDeadPreviously;

      if (!token.grimoire_participant_id) {
        token.grimoire_participant_id = createParticipantId();
      }
	      const participantId = token.grimoire_participant_id;
	      const deadReminderSource = detectDeadReminderSource(
	        orderedTokens,
	        token
	      );

	      if (shouldHaveDeath) {
	        const deathEventType = deadReminderSource
	          ? GrimoireEventType.DEATH
	          : GrimoireEventType.NOT_RECORDED;
	        expected.set(expectedKey(pageIndex, participantId, "death"), {
	          grimoire_page: pageIndex,
	          participant_id: participantId,
	          event_type: deathEventType,
	          by_participant_id: deadReminderSource?.by_participant_id ?? null,
	          player_name: token.player_name || "",
	          role_id: token.role_id ?? null,
	          by_role_id: deadReminderSource?.by_role_id ?? null,
	        });
	      }

	      if (shouldHaveRevival) {
	        expected.set(expectedKey(pageIndex, participantId, "revival"), {
	          grimoire_page: pageIndex,
	          participant_id: participantId,
	          event_type: GrimoireEventType.REVIVE,
	          by_participant_id: null,
	          player_name: token.player_name || "",
	          role_id: token.role_id ?? null,
	          by_role_id: null,
	        });
	      }

      if (!previousToken) return;

      const roleChanged =
        !!token.role_id &&
        !!previousToken.role_id &&
        (token.role_id !== previousToken.role_id ||
          token.related_role_id !== previousToken.related_role_id);
      if (roleChanged) {
	        expected.set(expectedKey(pageIndex, participantId, "role"), {
	          grimoire_page: pageIndex,
	          participant_id: participantId,
	          event_type: GrimoireEventType.ROLE_CHANGE,
	          by_participant_id: null,
	          player_name: token.player_name || "",
	          role_id: token.role_id ?? null,
	          by_role_id: null,
	        });
	      }

	      if (token.order !== previousToken.order) {
	        expected.set(expectedKey(pageIndex, participantId, "seat"), {
	          grimoire_page: pageIndex,
	          participant_id: participantId,
	          event_type: GrimoireEventType.SEAT_CHANGE,
	          by_participant_id: null,
	          player_name: token.player_name || "",
	          role_id: token.role_id ?? null,
	          by_role_id: null,
	        });
	      }

	      if (token.alignment !== previousToken.alignment) {
	        expected.set(expectedKey(pageIndex, participantId, "alignment"), {
	          grimoire_page: pageIndex,
	          participant_id: participantId,
	          event_type: GrimoireEventType.ALIGNMENT_CHANGE,
	          by_participant_id: null,
	          player_name: token.player_name || "",
	          role_id: token.role_id ?? null,
	          by_role_id: null,
	        });
	      }
	    });

    if (pageIndex > 0) {
      const previousOrderedTokens = props.game.grimoire[pageIndex - 1].tokens
        .slice()
        .sort((a, b) => a.order - b.order);
      const previousIds = previousOrderedTokens
        .map((t) => t.grimoire_participant_id)
        .filter((id): id is string => !!id);
      const currentIds = orderedTokens
        .map((t) => t.grimoire_participant_id)
        .filter((id): id is string => !!id);

      if (previousIds.length === currentIds.length && previousIds.length > 0) {
        const singleMovedParticipantId = detectSingleSeatMove(previousIds, currentIds);
        if (singleMovedParticipantId) {
          const token = orderedTokens.find(
            (t) => t.grimoire_participant_id === singleMovedParticipantId
          );
          if (token) {
	            expected.set(expectedKey(pageIndex, singleMovedParticipantId, "seat"), {
	              grimoire_page: pageIndex,
	              participant_id: singleMovedParticipantId,
	              event_type: GrimoireEventType.SEAT_CHANGE,
	              by_participant_id: null,
	              player_name: token.player_name || "",
	              role_id: token.role_id ?? null,
	              by_role_id: null,
	            });
	          }

          expected.forEach((value, key) => {
            if (
              key.startsWith(`${pageIndex}:`) &&
              value.event_type === GrimoireEventType.SEAT_CHANGE &&
              value.participant_id !== singleMovedParticipantId
            ) {
              expected.delete(key);
            }
          });
        }
      }
    }
  });

  function takeExpectedByIdentity(event: (typeof events)[number]) {
    let bestKey: string | null = null;
    let bestScore = -1;
    const kind = eventKindFromValues(event.event_type);

    expected.forEach((candidate, candidateKey) => {
      if (candidate.grimoire_page !== event.grimoire_page) return;
      const candidateKind = eventKindFromValues(candidate.event_type);
      if (candidateKind !== kind) return;

      let score = 0;
      if (event.participant_id && candidate.participant_id && event.participant_id === candidate.participant_id) score += 10;
      const eventName = normalizePlayerName(event.player_name);
      const candidateName = normalizePlayerName(candidate.player_name);
      if (eventName && candidateName && eventName === candidateName) score += 3;
      if (event.role_id && candidate.role_id && event.role_id === candidate.role_id) score += 4;

      if (score > bestScore) {
        bestScore = score;
        bestKey = candidateKey;
      }
    });

    if (!bestKey || bestScore <= 0) return null;
    const match = expected.get(bestKey) || null;
    if (match) {
      expected.delete(bestKey);
    }
    return match;
  }


  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    const eventType = event.event_type;
    const kind = eventKindFromValues(eventType);
    const key = expectedKey(event.grimoire_page, event.participant_id, kind);
    let expectation = expected.get(key);
    if (expectation) {
      expected.delete(key);
    } else {
      expectation = takeExpectedByIdentity(event);
      if (expectation && event.participant_id !== expectation.participant_id) {
        event.participant_id = expectation.participant_id;
        updated += 1;
      }
    }
    if (!expectation) {
      events.splice(i, 1);
      removed += 1;
      continue;
    }

	    if (event.event_type !== expectation.event_type) {
	      const keepManualDeathType =
	        !isReviveEventType(eventType) &&
	        (expectation.event_type === null ||
          expectation.event_type === GrimoireEventType.NOT_RECORDED) &&
        (event.event_type === null ||
          event.event_type === GrimoireEventType.NOT_RECORDED ||
          event.event_type === GrimoireEventType.DEATH ||
          event.event_type === GrimoireEventType.EXECUTION);
      if (!keepManualDeathType) {
        event.event_type = expectation.event_type;
        updated += 1;
      }
    }

	    if (event.event_type === GrimoireEventType.REVIVE && event.cause === null) {
	      event.cause = GrimoireEventCause.ABILITY;
	    }
	    if (
	      event.event_type === GrimoireEventType.DEATH &&
	      expectation.by_participant_id &&
	      event.cause === null
	    ) {
	      event.cause = GrimoireEventCause.ABILITY;
	    }

	    if (!event.player_name) {
	      event.player_name = expectation.player_name;
	    }
	    if (!event.role_id) {
	      event.role_id = expectation.role_id;
	    }
	    if (!event.by_participant_id && expectation.by_participant_id) {
	      event.by_participant_id = expectation.by_participant_id;
	    }
	    if (!event.by_role_id && expectation.by_role_id) {
	      event.by_role_id = expectation.by_role_id;
	    }

	  }

  expected.forEach((expectation) => {
	    events.push({
	      grimoire_page: expectation.grimoire_page,
	      participant_id: expectation.participant_id,
	      event_type: expectation.event_type,
	      cause:
	        isReviveEventType(expectation.event_type) ||
	        (expectation.event_type === GrimoireEventType.DEATH &&
	          expectation.by_participant_id)
	          ? GrimoireEventCause.ABILITY
	          : null,
	      by_participant_id: expectation.by_participant_id,
	      player_name: expectation.player_name,
	      role_id: expectation.role_id,
	      by_role_id: expectation.by_role_id,
	    });
    added += 1;
  });


  if (!silent && (added || removed || updated)) {
    grimoireEventSyncStats.value = { added, updated, removed };
    grimoireEventSyncSummary.value = `Synced events: ${added} added, ${updated} updated, ${removed} removed.`;
  }

  grimoireEventSyncDone.value = true;
}

function getGrimoireEventSeatSelection(event: {
  by_participant_id: string | null;
  by_role_id: string | null;
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
}) {
  if (event.by_participant_id !== null) return event.by_participant_id;
  const key = grimoireEventSelectionKey(event);
  if (grimoireEventCustomSeatSelections.value.has(key)) return "custom";
  return null;
}

function updateGrimoireEventSeatSelection(
  event: {
    grimoire_page: number;
    by_participant_id: string | null;
    by_role_id: string | null;
    participant_id: string;
    cause: GrimoireEventCause | null;
    event_type: GrimoireEventType | null;
  },
  value: string | "custom" | null
) {
  const key = grimoireEventSelectionKey(event);
  if (value === "custom") {
    event.by_participant_id = null;
    grimoireEventCustomSeatSelections.value.add(key);
    return;
  }

  if (value === null) {
    event.by_participant_id = null;
    event.by_role_id = null;
    grimoireEventCustomSeatSelections.value.delete(key);
    return;
  }

  event.by_participant_id = value;
  const token = getSourceTokenForGrimoireEventSelection(event, value);
  if (token?.role_id) {
    event.by_role_id = token.role_id;
  } else {
    event.by_role_id = null;
  }
  grimoireEventCustomSeatSelections.value.delete(key);
}

function onGrimoireEventCauseChange(event: {
  grimoire_page: number;
  participant_id: string;
  by_participant_id: string | null;
  by_role_id: string | null;
  event_type: GrimoireEventType | null;
}) {
  event.by_participant_id = null;
  event.by_role_id = null;
  const key = grimoireEventSelectionKey(event);
  grimoireEventCustomSeatSelections.value.delete(key);
}

function allowManualGrimoireEventByRole(event: {
  grimoire_page: number;
  participant_id: string;
  cause: GrimoireEventCause | null;
  event_type: GrimoireEventType | null;
  by_participant_id: string | null;
  by_role_id: string | null;
}) {
  const options = grimoireEventSeatOptionsForPage(
    event.grimoire_page,
    event.cause,
    event.event_type
  );
  if (options.length === 0) return true;
  const key = grimoireEventSelectionKey(event);
  return grimoireEventCustomSeatSelections.value.has(key);
}

function grimoireEventSelectionKey(event: {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
}) {
  return `${event.grimoire_page}:${event.participant_id}:${event.event_type ?? "none"}`;
}

function grimoireEventByRoleCharacter(event: { by_role_id: string | null }) {
  if (!event.by_role_id) {
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
  const role = allRoles.getRole(event.by_role_id);
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

const grimoireEventSyncAlertColor = computed(() => {
  if (!grimoireEventSyncSummary.value) return "info";
  const { updated, removed } = grimoireEventSyncStats.value;
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

    // Clear any previously selected character whenever the trigger changes.
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;

    if (
      value !== GameEndTrigger.NO_LIVING_DEMON &&
      value !== GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE &&
      value !== GameEndTrigger.CHARACTER_ABILITY
    ) {
      props.game.end_trigger_type = null;
    }

    if (value === GameEndTrigger.CHARACTER_ABILITY) {
      if (props.game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION) {
        props.game.end_trigger_cause = GameEndTriggerCause.ABILITY;
      } else {
        props.game.end_trigger_type = null;
        props.game.end_trigger_cause = null;
      }
    } else if (
      props.game.end_trigger_type === GameEndTriggerType.EXTRA_WIN_CONDITION
    ) {
      props.game.end_trigger_type = null;
      props.game.end_trigger_cause = null;
    } else if (
      value !== GameEndTrigger.NO_LIVING_DEMON &&
      value !== GameEndTrigger.TWO_PLAYERS_LEFT_ALIVE
    ) {
      props.game.end_trigger_cause = null;
    } else {
      props.game.end_trigger_cause = null;
    }

    if (
      value !== GameEndTrigger.GAME_ENDED_EARLY &&
      value !== GameEndTrigger.OTHER
    ) {
      props.game.end_trigger_note = "";
    }
  }
);

watch(
  () => props.game.end_trigger_type,
  (value) => {
    if (!shouldShowEndTriggerType.value) return;

    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;
    props.game.end_trigger_cause = null;

    if (value === null) return;

    if (endTriggerCauseOptions.value.length === 1) {
      props.game.end_trigger_cause = endTriggerCauseOptions.value[0].value;
    }
  }
);

watch(
  () => endTriggerTypeOptions.value,
  (options) => {
    if (props.game.end_trigger === GameEndTrigger.CHARACTER_ABILITY) return;
    if (options.length !== 1) return;
    const [onlyOption] = options;
    if (props.game.end_trigger_type === onlyOption.value) return;
    props.game.end_trigger_type = onlyOption.value;
  },
  { immediate: true }
);

watch(
  () => endTriggerCauseOptions.value,
  (options) => {
    if (options.length !== 1) return;
    const [onlyOption] = options;
    if (props.game.end_trigger_cause === onlyOption.value) return;
    props.game.end_trigger_cause = onlyOption.value;
  },
  { immediate: true }
);

watch(
  () => props.game.end_trigger_cause,
  (value, oldValue) => {
    if (value === oldValue) return;
    props.game.end_trigger_role_id = null;
    props.game.end_trigger_role = null;
    props.game.end_trigger_participant_id = null;
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
  if (tokenSet.value === "event_by_role") {
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

const grimoireEventByRoleRestrictRoleIds = computed(() => {
  if (tokenSet.value !== "event_by_role") return null;
  const event = focusedGrimoireEvent.value;
  if (!event) return null;
  const type = event.event_type ?? GrimoireEventType.NOT_RECORDED;
  const config: RoleIncludeConfig = GRIMOIRE_EVENT_ROLE_INCLUDES[type];
  const includes = [
    ...(config.base ?? []),
    ...(config.conditional ?? [])
      .filter((entry) =>
        entry.requires.every((required) => scriptRoleIds.value.has(required))
      )
      .map((entry) => entry.role),
  ];
  return includes.length > 0 ? includes : null;
});

const roleRestrictIds = computed(() => {
  if (tokenSet.value === "end_trigger") return endTriggerRestrictRoleIds.value;
  if (tokenSet.value === "event_by_role")
    return grimoireEventByRoleRestrictRoleIds.value;
  return null;
});

const excludeIrrelevantRoles = computed({
  get: () => {
    if (tokenSet.value === "end_trigger") {
      return excludeIrrelevantEndTriggerRoles.value;
    }
    if (tokenSet.value === "event_by_role") {
      return excludeIrrelevantGrimoireEventRoles.value;
    }
    return false;
  },
  set: (value) => {
    if (tokenSet.value === "end_trigger") {
      excludeIrrelevantEndTriggerRoles.value = value;
    } else if (tokenSet.value === "event_by_role") {
      excludeIrrelevantGrimoireEventRoles.value = value;
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
  mode: "role" | "related_role" | "end_trigger_role" | "event_by_role",
  set:
    | "player_characters"
    | "demon_bluffs"
    | "fabled"
    | "end_trigger"
    | "event_by_role" = "player_characters"
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

function openGrimoireEventByRoleDialog(event: {
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
}) {
  focusedGrimoireEvent.value = event;
  excludeIrrelevantGrimoireEventRoles.value = true;
  openRoleSelectionDialog(null, "event_by_role", "event_by_role");
}

function clearEndTriggerRole() {
  props.game.end_trigger_role_id = null;
  props.game.end_trigger_role = null;
  props.game.end_trigger_participant_id = null;
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
      props.game.end_trigger_participant_id = null;
    } else {
      props.game.end_trigger_role_id = null;
      props.game.end_trigger_role = null;
      props.game.end_trigger_participant_id = null;
    }
    showRoleSelectionDialog.value = false;
    return;
  }
  if (tokenMode.value === "event_by_role") {
    const event = focusedGrimoireEvent.value;
    if (event) {
      event.by_role_id = role.id || null;
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
      grimoire_participant_id: token.grimoire_participant_id ?? null,
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
  let normalizedAnyPage = false;
  props.game.grimoire.forEach((grimoire) => {
    if (normalizePageTokenOrders(grimoire.tokens as { order: number }[])) {
      normalizedAnyPage = true;
    }

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
        grimoire_participant_id: null,
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
      if (token.order === null || token.order === undefined) {
        token.order = index;
      }
    });
  });

  recomputeGrimoireParticipantIds();

  if (!grimoireEventSyncDone.value && props.game.grimoire.length > 0) {
    syncGrimoireEventsFromGrimoire();
  } else if (normalizedAnyPage) {
    syncGrimoireEventsFromGrimoire({ force: true, silent: true });
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

function onSeatDragStart(order: number, event: DragEvent) {
  draggedSeatOrder.value = order;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(order));
  }
  const sourceIndex = currentPageSeatRows.value.findIndex((row) => row.order === order);
  dragInsertIndex.value = sourceIndex >= 0 ? sourceIndex : null;
  dragTargetOrder.value = null;
  dragTargetAfter.value = false;
}

function onSeatDragOver(order: number, event: DragEvent) {
  const sourceOrder = draggedSeatOrder.value;
  if (sourceOrder === null) return;

  const rows = currentPageSeatRows.value;
  const hoverIndex = rows.findIndex((row) => row.order === order);
  const sourceIndex = rows.findIndex((row) => row.order === sourceOrder);
  if (hoverIndex < 0 || sourceIndex < 0) return;

  const targetElement = event.currentTarget as HTMLElement | null;
  if (!targetElement) return;
  const rect = targetElement.getBoundingClientRect();
  const isAfter = event.clientY > rect.top + rect.height / 2;
  dragTargetOrder.value = order;
  dragTargetAfter.value = isAfter;

  let insertIndex = hoverIndex + (isAfter ? 1 : 0);
  if (sourceIndex < insertIndex) {
    insertIndex -= 1;
  }

  dragInsertIndex.value = Math.max(0, Math.min(insertIndex, rows.length - 1));
}

function onSeatListDragOver(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  const sourceOrder = draggedSeatOrder.value;
  if (sourceOrder === null) return;
  const rows = currentPageSeatRows.value;
  const sourceIndex = rows.findIndex((row) => row.order === sourceOrder);
  if (sourceIndex < 0) return;
  if (dragInsertIndex.value === null) {
    dragInsertIndex.value = sourceIndex;
  }
}

function onSeatDrop() {
  const page = props.game.grimoire[grimPage.value];
  const sourceOrder = draggedSeatOrder.value;
  const insertIndex = dragInsertIndex.value;
  draggedSeatOrder.value = null;
  dragInsertIndex.value = null;
  dragTargetOrder.value = null;
  dragTargetAfter.value = false;

  if (!page || sourceOrder === null || insertIndex === null) return;

  const sorted = page.tokens.slice().sort((a, b) => a.order - b.order);
  const fromIndex = sorted.findIndex((token) => token.order === sourceOrder);
  if (fromIndex < 0) return;

  const [moved] = sorted.splice(fromIndex, 1);
  const toIndex = Math.max(0, Math.min(insertIndex, sorted.length));
  sorted.splice(toIndex, 0, moved);
  sorted.forEach((token, index) => {
    token.order = index;
  });

  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

function onSeatDragEnd() {
  draggedSeatOrder.value = null;
  dragInsertIndex.value = null;
  dragTargetOrder.value = null;
  dragTargetAfter.value = false;
}

function rotateCurrentPageSeats(direction: "cw" | "ccw") {
  const page = props.game.grimoire[grimPage.value];
  if (!page || page.tokens.length < 2) return;

  const seatCount = page.tokens.length;
  page.tokens.forEach((token) => {
    token.order =
      direction === "cw"
        ? (token.order + 1) % seatCount
        : (token.order - 1 + seatCount) % seatCount;
  });

  onSeatDragEnd();
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
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
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

watch(
  props.game.grimoire,
  (value) => {
    const newTokens = value[grimPage.value].tokens;
    const newTokensByOrder = new Map(newTokens.map((token) => [token.order, token]));

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
        const sourceToken = newTokensByOrder.get(token.order);
        if (!sourceToken) return;
        token.player_id = sourceToken.player_id;
        token.player_name = sourceToken.player_name;
      });
    });

    if (myCharacters.length > 0 || advancedModeEnabled.value) {
      props.game.player_characters = myCharacters;
    }

    syncGrimoireEventsFromGrimoire({ force: true, silent: true });
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

  recomputeGrimoireParticipantIds();
  syncGrimoireEventsFromGrimoire();
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
    padding-block-start: 2.25rem;
    padding-block-end: 2.5rem;

    scrollbar-width: thin;
    scrollbar-color: oklch(44.4% 0.011 73.639) transparent;
  }
}

.token-container {
  .initial-token + .current-token {
    @apply ml-10 md:ml-14 mt-6;
  }
}

.clip-token {
  /* clip-path: polygon(0% 0%, 25% 0, 50% 50%, 25% 100%, 0% 100%); */
  /* position: absolute; */
}
</style>
