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
    <GameEditorGameResults
      ref="endTriggerRef"
      :game="game"
      :editingMultipleGames="editingMultipleGames"
      :advancedModeEnabled="advancedModeEnabled"
      :scriptRoleIds="scriptRoleIds"
      @open-role-dialog="openEndTriggerRoleDialog"
    />
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
              '<div class=\'w-[250px]\'>The character this player thinks they are, or whose ability they have (if applicable). Example: the Drunk who thinks they are the Empath, or a Demon with a Boffin ability</div>',
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
      <!-- Grimoire options, remembered per browser like Record Grimoire. -->
      <div class="w-full flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2">
            <Toggle v-model="grimoirePreferences.dayNight.value" size="sm" />
            <span class="whitespace-nowrap">Day/Night cycle</span>
          </label>
          <InfoHint label="About the Day/Night cycle">
            <p>The grimoire starts on a Night 1 page, and "Add page" goes from
            night to day and back, with automatic titles (Night 1, Day 1,
            Night 2, ...).</p>
            <p>Off: no day/night cycle. New pages are untyped (legacy
            behavior), and reminders aren't auto-updated. You can still set a
            page's type by hand.</p>
          </InfoHint>
        </div>
        <div class="flex items-center gap-2">
          <!-- Needs the day/night cycle: without it "Add page" never starts a
               new night or day, so it's greyed out (its setting is kept). -->
          <label
            class="flex items-center gap-2"
            :class="{ 'opacity-50 pointer-events-none': !grimoirePreferences.dayNight.value }"
            :aria-disabled="!grimoirePreferences.dayNight.value"
          >
            <Toggle v-model="grimoirePreferences.autoReminders.value" size="sm" />
            <span class="whitespace-nowrap">Auto-update reminders</span>
          </label>
          <InfoHint label="About auto-update reminders">
            <p>Needs the Day/Night cycle. When "Add page" starts a new night
            or day, reminders whose effect is over are removed (a Poisoner's
            Poisoned at the next night, a Monk's Safe at dawn) and numbered
            tokens are counted up/down (Courtier's Drunk, Leviathan's Day 1, 2,
            3, 4, 5).</p>
            <p>When enabled, this also allows reminders on consecutive pages to
            count as separate events (a player the Cerenovus makes mad every
            night).</p>
          </InfoHint>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2">
            <Toggle v-model="grimoirePreferences.showTracking.value" size="sm" />
            <span class="whitespace-nowrap">Use tracking reminders</span>
          </label>
          <InfoHint label="About tracking reminders">
            <p>ClockTracker keeps track of certain events in the game (deaths,
            character changes, ...). Certain reminder tokens can prefill these
            events; they are marked with <IconUI id="crosshair" /> in the
            reminder dialog.</p>
            <p>Additional reminders were also added to support this; you can
            recognize them by their slightly brighter purple background, in
            the reminder dialog and on the grimoire.</p>
            <p>In the reminder dialog, hover a reminder with
            <IconUI id="crosshair" /> (or touch and hold it) to see how it's
            used.</p>
            <p>Off: these reminders aren't offered in the reminder and shroud
            dialogs. Ones you already placed keep working.</p>
          </InfoHint>
        </div>
      </div>
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
          'grimoire--night':
            game.grimoire[grimPage]?.page_type === 'NIGHT',
        }"
      >
        <div
          class="relative z-10 font-sorts text-white bg-black/60 p-4 text-xl rounded shadow-md text-center"
        >
          <!-- relative z-10: above the night tint (.grimoire--night's
               ::before/::after in app.vue), which covers only the background. -->
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
        ref="grimoireEditRef"
        class="grimoire grimoire-edit relative w-full flex flex-col gap-2"
      >
        <div class="grimoire-title-wrapper">
          <div class="grimoire-type">
            <span class="sr-only">Grimoire page type</span>
            <div class="flex items-center gap-2 px-[0.375rem] py-1">
              <div>
                <input
                  type="radio"
                  v-model="game.grimoire[grimPage].page_type"
                  value="NIGHT"
                  class="sr-only"
                  id="radio-grim-type-night"
                />
                <label for="radio-grim-type-night" class="flex items-center gap-1 py-1 px-2">
                  <IconUI id="moon" size="sm" /> Night
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  v-model="game.grimoire[grimPage].page_type"
                  value="NONE"
                  class="sr-only"
                  id="radio-grim-type-none"
                />
                <label for="radio-grim-type-none" class="flex items-center gap-1 py-1 px-2">
                  <IconUI id="disabled" size="sm" /> None
                </label>
              </div>
              <div>
                <input
                  type="radio"
                  v-model="game.grimoire[grimPage].page_type"
                  value="DAY"
                  class="sr-only"
                  id="radio-grim-type-day"
                />
                <label for="radio-grim-type-day" class="flex items-center gap-1 py-1 px-2">
                  <IconUI id="sun" size="sm" /> Day
                </label>
              </div>
            </div>
          </div>
          <div class="grimoire-title">
            <label>
              <span class="sr-only">Grimoire page title</span>
              <Input
                class="text-center"
                type="text"
                v-model="game.grimoire[grimPage].title"
                maxlength="64"
                @update:modelValue="onPageTitleInput"
              />
            </label>
          </div>
          <div class="grimoire-pager">
            Page {{ grimPage + 1 }} of
            {{ game.grimoire.length }}
          </div>
        </div>
        <!-- The night overlay covers only the grimoire image, not the
             controls under it on mobile. -->
        <div
          class="relative grimoire-night-layer"
          :class="{ 'is-night': game.grimoire[grimPage]?.page_type === 'NIGHT' }"
        >
          <div
            class="w-full max-w-[calc(100vw-4rem)] md:w-auto md:max-w-[966px] grimoire-scroll overflow-auto bg-center bg-cover script-bg"
            :class="{
              ...scriptBgClasses(game.script, !!customBackground),
              'grimoire--night':
                game.grimoire[grimPage]?.page_type === 'NIGHT',
            }"
          >
            <Grimoire
              :tokens="game.grimoire[grimPage].tokens"
              :previousTokens="grimPage > 0 ? game.grimoire[grimPage - 1].tokens : []"
              :availableRoles="orderedRoles"
              :excludePlayers="storytellerNames"
              :pageIndex="grimPage"
              :inPlayRoleIds="fabledRoleIds"
              :hasScript="!!game.script_id"
              @deathToggled="recordGrimoireEvent"
              @selectedMe="applyMyRoleToGrimoire"
            />
          </div>
        </div>

        <!-- Mobile: a bar under the grimoire with Previous | Next, the add or
             clone action below them and Delete set apart. Desktop: the wrapper
             disappears and each control is positioned on the grimoire. -->
        <div class="grid grid-cols-2 gap-2 py-2 md:contents">
          <div
            v-if="deletedPage"
            role="status"
            class="col-span-2 flex items-center justify-between gap-3 rounded bg-stone-900/90 text-white text-sm px-3 py-2 md:absolute md:bottom-16 md:left-1/2 md:-translate-x-1/2 md:z-30 md:whitespace-nowrap"
          >
            <span>Deleted “{{ deletedPage.title }}”</span>
            <Button type="button" size="sm" color="contrast" @click="undoDeletePage">
              Undo
            </Button>
          </div>
          <div
            v-else-if="endedReminders"
            role="status"
            class="col-span-2 flex items-center justify-between gap-3 rounded bg-stone-900/90 text-white text-sm px-3 py-2 md:absolute md:bottom-16 md:left-1/2 md:-translate-x-1/2 md:z-30 md:whitespace-nowrap"
          >
            <span>{{ endedReminders.message }}</span>
            <Button type="button" size="sm" color="contrast" @click="undoEndedReminders">
              Undo
            </Button>
          </div>
          <Button
            type="button"
            @click="pageBackward"
            :disabled="grimPage === 0"
            icon="journal-prev"
            class="grimoire-nav-btn min-h-11 md:min-h-0 md:absolute md:bottom-4 md:left-3 md:z-20"
          >
            Previous page
          </Button>
          <Button
            type="button"
            @click="pageForward"
            :disabled="grimPage === game.grimoire.length - 1"
            icon="journal-next"
            display="icon-after"
            class="grimoire-nav-btn min-h-11 md:min-h-0 md:absolute md:bottom-4 md:right-3 md:z-20"
          >
            Next page
          </Button>
          <div
            class="col-span-2 grid grid-cols-2 gap-2 md:flex md:items-center md:absolute md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:z-20"
          >
            <!-- Split button: one tap adds the next phase (the usual case);
                 the arrow offers another page for the current phase. -->
            <div
              v-if="isLastPage && nextPageType !== 'NONE'"
              class="relative col-span-2 flex gap-px"
            >
              <Button
                type="button"
                @click="addPage"
                color="positive"
                :icon="nextPageType === 'NIGHT' ? 'moon' : 'sun'"
                class="flex-1 min-h-11 md:min-h-0 !rounded-r-none"
              >
                Add page: {{ nextPhaseName }}
              </Button>
              <!-- On mobile the menu spans the whole split button, so its
                   items are easy to hit; on desktop it hangs off the arrow. -->
              <Menu as="div" class="flex md:relative">
                <MenuButton as="template">
                  <Button
                    type="button"
                    color="positive"
                    icon="chevron-down"
                    display="icon-only"
                    class="min-h-11 md:min-h-0 !rounded-l-none"
                    title="More ways to add a page"
                  >
                    More ways to add a page
                  </Button>
                </MenuButton>
                <MenuItems
                  class="ct-contextual-links left-0 md:left-auto bottom-full mb-1 !z-30 focus:outline-none"
                >
                  <MenuItem>
                    <ButtonSubmenu
                      :icon="game.grimoire[grimPage]?.page_type === 'NIGHT' ? 'moon' : 'sun'"
                      class="min-h-12 md:min-h-0 [--fontsize:1rem] md:[--fontsize:0.875rem]"
                      @click="clonePage"
                    >
                      Continue {{ currentPhaseName }}
                    </ButtonSubmenu>
                  </MenuItem>
                  <MenuItem>
                    <ButtonSubmenu
                      :icon="nextPageType === 'NIGHT' ? 'moon' : 'sun'"
                      class="min-h-12 md:min-h-0 [--fontsize:1rem] md:[--fontsize:0.875rem]"
                      @click="addPage"
                    >
                      Start {{ nextPhaseName }}
                    </ButtonSubmenu>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
            <Button
              v-else-if="isLastPage"
              type="button"
              @click="addPage"
              color="positive"
              icon="journal-plus"
              class="col-span-2 min-h-11 md:min-h-0"
            >
              Add page {{ game.grimoire.length + 1 }}
            </Button>
            <Button
              v-else
              type="button"
              @click="clonePage"
              color="caution"
              icon="journals"
              class="col-span-2 min-h-11 md:min-h-0"
              title="Insert an exact copy of this page after it"
            >
              Clone page
            </Button>
            <Button
              v-if="game.grimoire.length > 1"
              type="button"
              @click="deletePage"
              color="negative"
              variant="soft"
              icon="journal-x"
              class="col-start-1 min-h-11 mt-1 md:min-h-0 md:mt-0 md:order-first md:mr-6"
            >
              Delete page
            </Button>
          </div>
        </div>
        <Button
          v-if="gameId"
          type="button"
          @click="fetchSnapshots(); showSnapshotDialog = true"
          icon="clock-history"
          class="md:absolute top-1 left-1 z-20"
        >
          Restore from history
        </Button>
      </div>
      <details class="w-full">
        <summary class="cursor-pointer">Seating order</summary>
        <template v-if="hasCurrentPageSeating">
          <p class="text-xs text-stone-500 mt-1">
            Use buttons or drag and drop in the list below to move a player to a different seat (on this page only).
          </p>
          <ul
            class="mt-2 space-y-1"
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
              class="cursor-move flex items-center justify-between gap-2 rounded border border-stone-600 px-2 py-1 bg-stone-300/50 dark:bg-stone-900/60 relative text-stone-700 dark:text-stone-300"
              :class="{
                'opacity-60': draggedSeatOrder === row.order,
                'border-t-4 border-t-primary': dragTargetOrder === row.order && !dragTargetAfter,
                'border-b-4 border-b-primary': dragTargetOrder === row.order && dragTargetAfter,
              }"
            >
              <span class="flex items-center gap-3">
                <IconUI id="arrows-move" size="xs" />
                <span class="flex items-center gap-1 shrink-0">  
                  <Button
                    type="button"
                    size="xs"
                    variant="soft"
                    color="neutral"
                    :disabled="!canMoveSeat(row.order, 'up')"
                    @click.stop="moveSeatByDirection(row.order, 'up')"
                    title="Move seat up"
                    icon="arrow-up-short"
                    display="icon-only"
                    circular
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="soft"
                    color="neutral"
                    :disabled="!canMoveSeat(row.order, 'down')"
                    @click.stop="moveSeatByDirection(row.order, 'down')"
                    title="Move seat down"
                    icon="arrow-down-short"
                    display="icon-only"
                    circular
                  >
                    Down
                  </Button>
                </span>
                <span class="text-sm truncate">
                  {{ row.token.role?.name || "No Role" }} - {{ row.token.player_name || "No Player" }}
                </span>
              </span>
              <span class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-stone-500">
                  Seat {{ row.order + 1 }}
                </span>
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
        </template>
        <p v-else class="text-xs text-stone-400 mt-1">
          Set a playercount to enable seat reordering.
        </p>
      </details>
    </fieldset>
    <GameEditorGrimoireEvents
      ref="grimoireEventsRef"
      :game="game"
      :editingMultipleGames="editingMultipleGames"
      :scriptRoleIds="scriptRoleIds"
      :reminderCatalog="reminderCatalog"
      @open-by-role-dialog="openGrimoireEventByRoleDialog"
      @end-game-from-event="applyEndTriggerFromEvent"
    />
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
      <legend class="flex items-center gap-2">Notes <MarkdownHelp /></legend>
      <ExpandingTextarea
        v-if="!editingMultipleGames"
        v-model="game.notes"
        class="block w-full border border-stone-500 rounded-md p-2"
        rows="3"
      />
      <TagInput
        class="mt-4"
        v-model="game.tags"
        :availableTags="myTags"
      />
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
  <Dialog v-model:visible="showSnapshotDialog" size="lg">
    <template #title>
      <h2 class="text-2xl font-bold">Grimoire History</h2>
      <p class="text-sm text-stone-400 py-2">
        Each time a game is saved, a snapshot of the grimoire is stored, so you
        can restore an earlier version if something was lost. When a fix in
        ClockTracker changes the grimoire, a snapshot is stored first too, with
        a note saying why.
      </p>
    </template>

    <!-- The dialog is dark in both themes. -->
    <div class="text-stone-200">
      <div v-if="loadingSnapshots" class="text-center py-8">
        Loading snapshots...
      </div>
      <div
        v-else-if="snapshots.length === 0"
        class="text-center py-8 text-stone-400"
      >
        No snapshots available for this game.
      </div>
      <div v-else class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
        <div
          v-for="snapshot in snapshots"
          :key="snapshot.id"
          class="border border-stone-300 dark:border-stone-600 rounded p-3"
        >
          <div class="flex justify-between items-start gap-2">
            <div class="flex-1">
              <div class="font-bold text-sm">
                {{ dayjs(snapshot.created_at).format("MMMM D, YYYY HH:mm:ss") }}
              </div>
              <!-- Why it was saved, when it wasn't your own save (a repair, say). -->
              <p v-if="snapshot.message" class="text-sm text-stone-300 mt-1">
                {{ snapshot.message }}
              </p>
              <div class="text-xs text-stone-400 mt-1">
                {{ snapshot.snapshot.pages.length }} page{{
                  snapshot.snapshot.pages.length === 1 ? "" : "s"
                }}, {{ snapshot.snapshot.pages[0]?.tokens.length || 0 }} seat{{
                  (snapshot.snapshot.pages[0]?.tokens.length || 0) === 1 ? "" : "s"
                }}
              </div>
              <!-- Who sat where on each page, to tell the versions apart. -->
              <div v-for="(page, pi) in snapshot.snapshot.pages" :key="pi" class="mt-2">
                <div v-if="snapshot.snapshot.pages.length > 1" class="text-xs text-stone-400 mb-1">
                  {{ page.title || `Page ${pi + 1}` }}
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(token, i) in page.tokens"
                    :key="i"
                    class="text-xs bg-stone-700 rounded px-2 py-0.5"
                  >
                    {{ token.player_name || "Empty seat" }}
                    <template v-if="token.role_name"> — {{ token.role_name }}</template>
                  </span>
                </div>
              </div>
            </div>
            <Button type="button" size="sm" @click="restoreSnapshot(snapshot)">
              Restore
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { toEditorReminder, type GameReminder } from "~/utils/reminderType";
import { buildReminderCatalog } from "~/shared/reminderCatalog";
import {
  applyReminderLifetimes,
  type ReminderLifetimeResult,
} from "~/shared/reminderLifetimes";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { SHOW_TRACKING_REMINDERS_KEY } from "~/composables/reminderDialogTracking";
import InfoHint from "~/components/InfoHint.vue";
import type { Alignment } from "~/server/generated/prisma/client";
import type { RoleType } from "~/composables/useRoles";
import type { EndTriggerFromEvent } from "~/composables/endTriggerFromEvent";
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
import {
  GRIMOIRE_EVENT_ROLE_INCLUDES,
  type RoleIncludeConfig,
} from "~/composables/grimoireEventRoleConfig";
import dayjs from "dayjs";
import { assignParticipantIds } from "~/composables/grimoireParticipantMatching";

// The grimoire options above the grimoire, remembered per browser. The
// reminder dialogs read "show tracking reminders" from here.
const grimoirePreferences = useGrimoirePreferences();
provide(SHOW_TRACKING_REMINDERS_KEY, grimoirePreferences.showTracking);

// Switching the Day/Night cycle while the grimoire is still a single empty page
// (a new game) switches that page too.
watch(grimoirePreferences.dayNight, (dayNight) => {
  const pages = props.game.grimoire;
  if (pages.length !== 1) return;
  const page = pages[0];
  if (page.tokens?.some((token) => token.role_id || token.reminders?.length)) return;
  const wanted = dayNight ? "NIGHT" : "NONE";
  if ((page.page_type ?? "NONE") === wanted) return;
  page.page_type = wanted;
  if (autoGeneratedPageTitles.has(page as object) || !page.title?.trim()) {
    autoGeneratedPageTitles.add(page as object);
    page.title = getAutoPageTitleForIndex(pages, 0);
  }
});

const props = defineProps<{
  inFlight: boolean;
  editingMultipleGames?: boolean;
  gameId?: string;
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
        id?: string;
        token_url: string;
        type: string;
        initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
      };
      related_role?: { id?: string; token_url: string };
    }[];
    demon_bluffs: {
      name: string;
      role_id: string | null;
      role?: {
        id?: string;
        token_url: string;
        type: string;
      };
    }[];
    fabled: {
      name: string;
      role_id: string | null;
      role?: {
        id?: string;
        token_url: string;
        type: string;
      };
    }[];
    win_v2: WinStatus_V2 | undefined;
    end_trigger: GameEndTrigger | undefined;
    end_trigger_type: GameEndTriggerType | null;
    end_trigger_cause: GameEndTriggerCause | null;
    end_trigger_role_id: string | null;
    end_trigger_subtype: string;
    end_trigger_note: string;
    end_trigger_participant_id: string | null;
    end_trigger_role?: {
      id?: string;
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
      status_source: string | null;
      cause: GrimoireEventCause | null;
      by_participant_id: string | null;
      player_name: string;
      role_id: string | null;
      by_role_id: string | null;
      old_role_id: string | null;
      new_role_id: string | null;
      old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
      new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
      source_set_by_hand?: boolean;
    }[];
    notes: string;
    image_urls: string[];
    grimoire: {
      title?: string;
      page_type?: "NONE" | "NIGHT" | "DAY";
      lifetimes_applied?: boolean;
      tokens: {
        id?: number;
        alignment: "GOOD" | "EVIL" | "NEUTRAL" | undefined;
        order: number;
        is_dead: boolean;
        used_ghost_vote: boolean;
        grimoire_participant_id?: string | null;
        role_id: string | null;
        role?: {
          id?: string;
          token_url: string;
          type: string;
          initial_alignment: "GOOD" | "EVIL" | "NEUTRAL";
          name?: string;
        };
        related_role_id: string | null;
        related_role?: { id?: string; token_url: string; name?: string };
        player_name: string;
        player_id?: string | null;
        reminders: GameReminder[];
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
    id?: string;
    token_url: string;
    alternate_token_urls?: string[];
    initial_alignment?: "GOOD" | "EVIL" | "NEUTRAL";
    type: string;
  };
  related_role?: { id?: string; token_url: string };
};

const user = useUser();
const me = useMe();
const games = useGames();
const friends = useFriends();
const { isBaseScript, fetchScriptVersions, scriptBgClasses } = useScripts();
const { pickImages } = useImagePicker();
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
    reminders: {
      id: number;
      reminder: string;
      role_id: string;
      type: "OFFICIAL" | "TRACKING" | "IMPORTED" | "LEGACY" | "CUSTOM";
    }[];
  }[]
>([]);
const scriptVersions = ref<{ id: number; version: string }[]>([]);
const fetchingScriptVersions = ref(false);
const autoAddedScriptFabledRoleIds = ref<string[]>([]);
const tokenMode = ref<
  "role" | "related_role" | "end_trigger_role" | "event_by_role"
>("role");
const tokenSet = ref<
  "player_characters" | "demon_bluffs" | "fabled" | "end_trigger" | "event_by_role"
>("player_characters");
const excludeIrrelevantEndTriggerRoles = ref(true);
const excludeIrrelevantGrimoireEventRoles = ref(true);
const endTriggerRef = ref<{
  getRestrictRoleIds: () => string[] | null;
  applyFromEvent: (values: EndTriggerFromEvent) => Promise<void>;
} | null>(null);

function applyEndTriggerFromEvent(values: EndTriggerFromEvent) {
  endTriggerRef.value?.applyFromEvent(values);
}

const grimoireEventsRef = ref<{
  recordGrimoireEvent: (payload: {
    token: {
      order: number;
      player_name: string;
      role_id: string | null;
      player_id?: string | null;
      grimoire_participant_id?: string | null;
    };
    isDead: boolean;
    pageIndex: number;
  }) => void;
  syncGrimoireEventsFromGrimoire: (options?: {
    force?: boolean;
    silent?: boolean;
  }) => void;
} | null>(null);
const focusedGrimoireEvent = ref<{
  grimoire_page: number;
  participant_id: string;
  event_type: GrimoireEventType | null;
  cause: GrimoireEventCause | null;
  by_participant_id: string | null;
  player_name: string;
  role_id: string | null;
  by_role_id: string | null;
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  source_set_by_hand?: boolean;
} | null>(null);
const grimoireEventSyncReady = ref(false);
const grimoireInitialState = ref<string | null>(null);
const grimoireChangedSinceOpen = ref(false);

function serializeGrimoireState() {
  return JSON.stringify(props.game.grimoire);
}

// Grimoire
const showCopyGrimoireDialog = ref(false);
const showSnapshotDialog = ref(false);
const grimPage = ref(props.game.grimoire.length - 1);

// Stay on an existing page when the grimoire shrinks from outside, like
// "Reset Game" on add-game replacing it with a single page.
watch(
  () => props.game.grimoire.length,
  (length) => {
    if (grimPage.value > length - 1) grimPage.value = Math.max(0, length - 1);
  }
);

const draggedSeatOrder = ref<number | null>(null);
const dragInsertIndex = ref<number | null>(null);
const dragTargetOrder = ref<number | null>(null);
const dragTargetAfter = ref(false);
const bggIdInput = ref("");
const bggIdIsValid = ref(true);
const customBackground = ref<string | null>(null);

type GrimoireSnapshot = {
  id: number;
  created_at: string;
  /** Why it was saved, when it wasn't the user's own save. */
  message?: string | null;
  snapshot: {
    // Saved since snapshots started keeping them; older snapshots lack them.
    player_count?: number | null;
    traveler_count?: number | null;
    pages: {
      id: number;
      title?: string;
      page_type?: "NONE" | "NIGHT" | "DAY";
      lifetimes_applied?: boolean;
      tokens: {
        grimoire_participant_id?: string | null;
        role_id: string | null;
        role_name?: string | null;
        related_role_id: string | null;
        related_role_name?: string | null;
        alignment: string;
        is_dead: boolean;
        used_ghost_vote: boolean;
        order: number;
        player_name: string;
        player_id: string | null;
        reminders: GameReminder[];
      }[];
    }[];
  };
};
const snapshots = ref<GrimoireSnapshot[]>([]);
const loadingSnapshots = ref(false);

async function fetchSnapshots() {
  if (!props.gameId) return;
  loadingSnapshots.value = true;
  try {
    snapshots.value = await $fetch<GrimoireSnapshot[]>(
      `/api/games/${props.gameId}/grimoire-snapshots`
    );
  } catch {
    snapshots.value = [];
  } finally {
    loadingSnapshots.value = false;
  }
}

/**
 * Splits a restored grimoire's seats into players and travellers. Every page
 * has player count + traveller count tokens, so the counts must add up to the
 * seats, or the editor adds or removes seats on every page.
 */
function snapshotSeatCounts(snapshot: GrimoireSnapshot, seats: number) {
  if (!seats) return null;

  const saved = snapshot.snapshot;
  if (
    typeof saved.player_count === "number" &&
    saved.player_count + (saved.traveler_count ?? 0) === seats
  ) {
    return {
      player_count: saved.player_count,
      traveler_count: saved.traveler_count ?? null,
    };
  }

  // Older snapshots don't store the counts: keep the game's current
  // travellers when they fit, otherwise make every seat a player.
  const travelers = props.game.traveler_count ?? 0;
  if (travelers > 0 && travelers < seats) {
    return { player_count: seats - travelers, traveler_count: travelers };
  }
  return { player_count: seats, traveler_count: null };
}

function restoreSnapshot(snapshot: GrimoireSnapshot) {
  const restored = snapshot.snapshot.pages.map((page) => ({
    title: page.title ?? "",
    page_type: page.page_type ?? "NONE",
    lifetimes_applied: page.lifetimes_applied ?? false,
    tokens: page.tokens.map((token, index) => {
      const role = token.role_id ? allRoles.getRole(token.role_id) : undefined;
      const relatedRole = token.related_role_id
        ? allRoles.getRole(token.related_role_id)
        : undefined;
      return {
        alignment: token.alignment as "GOOD" | "EVIL" | "NEUTRAL",
        order: token.order ?? index,
        is_dead: token.is_dead,
        used_ghost_vote: token.used_ghost_vote,
        grimoire_participant_id: token.grimoire_participant_id ?? null,
        role_id: token.role_id,
        role: role
          ? {
              id: role.id,
              token_url: role.token_url,
              type: role.type,
              initial_alignment: role.initial_alignment,
              name: role.name,
            }
          : undefined,
        related_role_id: token.related_role_id,
        related_role: relatedRole
          ? {
              id: relatedRole.id,
              token_url: relatedRole.token_url,
              name: relatedRole.name,
            }
          : undefined,
        player_name: token.player_name,
        player_id: token.player_id,
        reminders: token.reminders.map(toEditorReminder),
      };
    }),
  }));

  props.game.grimoire.splice(0, props.game.grimoire.length, ...restored);
  const seatCounts = snapshotSeatCounts(snapshot, restored[0]?.tokens.length ?? 0);
  if (seatCounts) {
    props.game.player_count = seatCounts.player_count;
    props.game.traveler_count = seatCounts.traveler_count;
  }
  grimPage.value = Math.max(0, restored.length - 1);
  recomputeGrimoireParticipantIds();
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
  showSnapshotDialog.value = false;
}
const initializedPageTitles = new WeakSet<object>();
const autoGeneratedPageTitles = new WeakSet<object>();

type LocalGrimoirePageType = "NONE" | "NIGHT" | "DAY";

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

const hasCurrentPageSeating = computed(() =>
  currentPageSeatRows.value.some(({ token }) =>
    Boolean(token.role_id || token.player_name?.trim())
  )
);

function recordGrimoireEvent(payload: {
  token: {
    order: number;
    player_name: string;
    role_id: string | null;
    player_id?: string | null;
    grimoire_participant_id?: string | null;
  };
  isDead: boolean;
  deathType?: "EXECUTION" | "EXILE";
  pageIndex: number;
}) {
  grimoireEventsRef.value?.recordGrimoireEvent(payload);
}

const fabledRoleIds = computed(() =>
  props.game.fabled
    .map((character) => character.role_id)
    .filter((roleId): roleId is string => !!roleId)
);

function syncGrimoireEventsFromGrimoire(options?: {
  force?: boolean;
  silent?: boolean;
}) {
  // A direct sync covers any change still waiting for the debounced one.
  cancelScheduledGrimoireEventSync();
  grimoireEventsRef.value?.syncGrimoireEventsFromGrimoire(options);
}

// Typing in the grimoire changes it on every keystroke, but the full event
// sync only needs the settled state. Grimoire edits therefore schedule one
// sync for when changes pause; saving, leaving the page and closing the tab
// run a pending sync immediately, so nothing is ever saved unsynced.
const GRIMOIRE_EVENT_SYNC_DELAY_MS = 300;
let scheduledGrimoireEventSync: ReturnType<typeof setTimeout> | null = null;

function cancelScheduledGrimoireEventSync() {
  if (scheduledGrimoireEventSync === null) return;
  clearTimeout(scheduledGrimoireEventSync);
  scheduledGrimoireEventSync = null;
}

function scheduleGrimoireEventSync() {
  cancelScheduledGrimoireEventSync();
  scheduledGrimoireEventSync = setTimeout(() => {
    scheduledGrimoireEventSync = null;
    syncGrimoireEventsFromGrimoire({ force: true, silent: true });
  }, GRIMOIRE_EVENT_SYNC_DELAY_MS);
}

function flushScheduledGrimoireEventSync() {
  if (scheduledGrimoireEventSync === null) return;
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
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

let recomputingParticipantIds = false;

function recomputeGrimoireParticipantIds() {
  if (recomputingParticipantIds) return;
  if (!props.game.grimoire.length) return;
  recomputingParticipantIds = true;

  try {
    // The same matching as the events and the background fill, so the ids
    // and the events agree (see grimoireParticipantMatching.ts).
    assignParticipantIds(props.game.grimoire, { keepExisting: false });
  } finally {
    recomputingParticipantIds = false;
  }
}

function onSubmit() {
  flushScheduledGrimoireEventSync();
  recomputeGrimoireParticipantIds();
  emit("submit");
}

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

// If the game has grimoire data with tokens, enable Record Grimoire without
// changing the user preference. Watched rather than checked on mount, because
// an imported game (botc.games, sushi buffet) or a restored draft is loaded
// into the game after the editor has mounted.
const hasGrimoireRoles = computed(() =>
  props.game.grimoire.some((g) => g.tokens.some((t) => t.role_id))
);
watch(
  hasGrimoireRoles,
  (hasRoles) => {
    if (hasRoles) grimoireOverride.value = true;
  },
  { immediate: true }
);

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

const scriptRoleIds = computed(() => new Set(roles.value.map((role) => role.id)));

const endTriggerRestrictRoleIds = computed(() => {
  if (tokenSet.value !== "end_trigger") return null;
  return endTriggerRef.value?.getRestrictRoleIds() ?? null;
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
  // Collect every seat's player name once, instead of scanning every page and
  // seat again for each taggable player (this list is rebuilt on every
  // keystroke in a player name).
  const namesInGrimoire = new Set(
    props.game.grimoire.flatMap(({ tokens }) =>
      tokens.map((token) => token.player_name)
    )
  );

  return allTaggablePlayers.value.filter(
    (player) =>
      !player ||
      (!namesInGrimoire.has(player.username) &&
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

async function uploadFile() {
  const files = await pickImages({ multiple: true });
  if (files.length === 0) return;

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

let latestScriptRequest = 0;

watch(
  () => props.game.script_id,
  async (scriptId) => {
    const requestId = ++latestScriptRequest;
    scriptVersions.value = [];
    roles.value = [];
    customBackground.value = null;

    if (autoAddedScriptFabledRoleIds.value.length > 0) {
      props.game.fabled = props.game.fabled.filter(
        (fabled) =>
          !(
            fabled.role_id &&
            autoAddedScriptFabledRoleIds.value.includes(fabled.role_id)
          )
      );
      autoAddedScriptFabledRoleIds.value = [];
    }

    if (!scriptId) {
      fetchingScriptVersions.value = false;
      roles.value = allRoles.getAllRoles();
      return;
    }

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
          reminders: {
            id: number;
            reminder: string;
            role_id: string;
            type?: "OFFICIAL" | "TRACKING" | "IMPORTED" | "LEGACY" | "CUSTOM";
          }[];
        }[];
      }>(`/api/script/${scriptId}`);

      if (requestId !== latestScriptRequest) return;

      roles.value = (result.roles ?? []).map((role) => ({
        ...role,
        reminders: role.reminders.map((reminder) => ({
          ...reminder,
          type: reminder.type ?? "OFFICIAL",
        })),
      }));
      customBackground.value = result.background ?? null;

      const fabled = roles.value.filter((role) => role.type === "FABLED");
      const newlyAutoAddedFabledRoleIds: string[] = [];
      for (const fabledRole of fabled) {
        if (
          !props.game.fabled.some(
            (existingFabled) => existingFabled.role_id === fabledRole.id
          )
        ) {
          props.game.fabled.push({
            name: fabledRole.name,
            role_id: fabledRole.id,
            role: {
              id: fabledRole.id,
              token_url: fabledRole.token_url,
              type: fabledRole.type,
            },
          });
          newlyAutoAddedFabledRoleIds.push(fabledRole.id);
        }
      }
      autoAddedScriptFabledRoleIds.value = newlyAutoAddedFabledRoleIds;

      const versions = await fetchScriptVersions(scriptId);
      if (requestId !== latestScriptRequest) return;
      scriptVersions.value = versions;
    } catch {
      if (requestId !== latestScriptRequest) return;
      alert("Unable to load the selected script!");
    } finally {
      if (requestId === latestScriptRequest) {
        fetchingScriptVersions.value = false;
      }
    }
  },
  { immediate: true }
);

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
  old_role_id: string | null;
  new_role_id: string | null;
  old_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  new_alignment: "GOOD" | "EVIL" | "NEUTRAL" | null;
  source_set_by_hand?: boolean;
}) {
  focusedGrimoireEvent.value = event;
  excludeIrrelevantGrimoireEventRoles.value = true;
  openRoleSelectionDialog(null, "event_by_role", "event_by_role");
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
      // Picked by hand: the sync leaves it alone until it's reset.
      event.source_set_by_hand = true;
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
        // A new character starts without the old small token (as in the
        // grimoire), so it isn't saved again under the new one.
        focusedToken.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.related_role_id = undefined;
        focusedToken.related = "";
        focusedToken.name = role.name;
      } else {
        focusedToken.role = undefined;
        focusedToken.role_id = undefined;
        focusedToken.alignment = "NEUTRAL";
        focusedToken.related_role = {
          token_url: "/1x1.png",
        };
        focusedToken.related_role_id = undefined;
        focusedToken.related = "";
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

  const newPage = {
    title: getAutoPageTitleForIndex(
      [{ page_type: defaultGrimoirePageType() }],
      0
    ),
    page_type: defaultGrimoirePageType(),
    tokens,
  };
  props.game.grimoire.push(newPage);
  autoGeneratedPageTitles.add(newPage as object);

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
  initializeUnsetPageTitles();
  syncAutoGeneratedPageTitles();

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

  // Initial open should not mutate grimoire events; syncing is handled
  // after the first real grimoire change.
});

function pageForward() {
  const nextPage = grimPage.value + 1;
  if (nextPage < props.game.grimoire.length) {
    grimPage.value = nextPage;
  }
}

/**
 * Appends a page after the last one: a copy of its tokens, with the page type
 * advanced (night to day and back) and an automatic title.
 */
function addPage() {
  const lastPage = props.game.grimoire.length - 1;
  const nextPage = lastPage + 1;
  const currentType = props.game.grimoire[lastPage]?.page_type ?? "NONE";
  const nextType = getNextPageTypeFromCurrent(currentType);
  const pagesForAutoTitle = [
    ...props.game.grimoire,
    { page_type: nextType },
  ] as { page_type?: LocalGrimoirePageType }[];
  const nextTitle = getAutoPageTitleForIndex(pagesForAutoTitle, nextPage);

  const newPage = {
    title: nextTitle,
    page_type: nextType,
    lifetimes_applied: false,
    tokens: JSON.parse(JSON.stringify(props.game.grimoire[lastPage])).tokens,
  };
  props.game.grimoire[nextPage] = newPage;
  autoGeneratedPageTitles.add(newPage as object);
  grimPage.value = nextPage;

  // A new phase ends the reminders whose effect is over (see
  // shared/reminderRules.ts). The page is in the grimoire already, so the
  // tokens are the reactive ones. The marker tells the event engines that a
  // reminder that ended here and is on the page anyway was placed again.
  clearEndedReminders();
  if (nextType !== "NONE" && grimoirePreferences.autoReminders.value) {
    const page = props.game.grimoire[nextPage];
    const result = applyReminderLifetimes(
      page.tokens,
      nextType,
      reminderCatalog.value,
      props.game.grimoire.slice(0, nextPage)
    );
    page.lifetimes_applied = true;
    showEndedReminders({
      ...result,
      undo: () => {
        result.undo();
        page.lifetimes_applied = false;
      },
    }, nextType);
  }
}

/** The roles' reminders, to know which role a placed reminder belongs to. */
const reminderCatalog = computed(() =>
  buildReminderCatalog([...allRoles.getAllRoles(true), ...roles.value])
);

// The reminders the last "Add page" removed or counted down, kept for a few
// seconds so they can be put back.
const endedReminders = ref<{ message: string; undo: () => void } | null>(null);
let endedRemindersTimer: ReturnType<typeof setTimeout> | null = null;

function clearEndedReminders() {
  if (endedRemindersTimer !== null) clearTimeout(endedRemindersTimer);
  endedRemindersTimer = null;
  endedReminders.value = null;
}

function showEndedReminders(
  result: ReminderLifetimeResult,
  newPageType: "DAY" | "NIGHT"
) {
  const plural = (count: number) => (count === 1 ? "" : "s");
  const endedPhase = newPageType === "DAY" ? "night" : "day";
  const parts = [
    result.removed &&
      `removed ${result.removed} reminder${plural(result.removed)} that ended with the ${endedPhase}`,
    result.countedDown &&
      `counted down ${result.countedDown} reminder${plural(result.countedDown)}`,
    result.countedUp && `counted up ${result.countedUp} reminder${plural(result.countedUp)}`,
  ].filter((part): part is string => !!part);
  if (!parts.length) return;
  const joined = parts.join(", ");
  const message = joined.charAt(0).toUpperCase() + joined.slice(1);

  clearDeletedPage();
  endedReminders.value = { message, undo: result.undo };
  endedRemindersTimer = setTimeout(clearEndedReminders, DELETE_UNDO_MS);
}

function undoEndedReminders() {
  endedReminders.value?.undo();
  clearEndedReminders();
}

/**
 * Inserts an exact copy of the current page right after it, so a page that
 * combined a night and a day can be split in two. An automatic title stays
 * automatic (it becomes "... - Part 2" until the type is changed); a custom
 * title gets " - cloned" appended.
 */
function clonePage() {
  const source = props.game.grimoire[grimPage.value];
  if (!source) return;
  const sourceIsAutoTitled = autoGeneratedPageTitles.has(source as object);

  const newPage = {
    title: sourceIsAutoTitled ? source.title : `${source.title ?? ""} - cloned`,
    page_type: source.page_type,
    lifetimes_applied: false,
    tokens: JSON.parse(JSON.stringify(source)).tokens,
  };
  const insertAt = grimPage.value + 1;
  props.game.grimoire.splice(insertAt, 0, newPage);
  if (sourceIsAutoTitled) {
    autoGeneratedPageTitles.add(newPage as object);
  }
  grimPage.value = insertAt;
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

function defaultGrimoirePageTitle(index: number) {
  return `Page ${index + 1}`;
}

function defaultGrimoirePageType() {
  return grimoirePreferences.dayNight.value ? ("NIGHT" as const) : ("NONE" as const);
}

/**
 * The type of the page "Add page" makes. Only with the Day/Night cycle on does it
 * go from night to day and back; off, new pages are untyped (no cycle, so no
 * reminder updates either), even after a page typed by hand.
 */
function getNextPageTypeFromCurrent(currentType: "NONE" | "NIGHT" | "DAY") {
  if (!grimoirePreferences.dayNight.value) return "NONE" as const;
  if (currentType === "NIGHT") return "DAY" as const;
  if (currentType === "DAY") return "NIGHT" as const;
  return "NONE" as const;
}

function normalizePageType(pageType?: LocalGrimoirePageType | null) {
  return pageType ?? "NONE";
}

function getRunRepeatSuffix(runPosition: number) {
  if (runPosition <= 1) return "";
  return ` - Part ${runPosition}`;
}

function getAutoPageTitleForIndex(
  pages: { page_type?: LocalGrimoirePageType | null }[],
  pageIndex: number
) {
  const pageType = normalizePageType(pages[pageIndex]?.page_type);

  if (pageType === "NONE") {
    return defaultGrimoirePageTitle(pageIndex);
  }

  let runNumber = 0;
  for (let i = 0; i <= pageIndex; i += 1) {
    const current = normalizePageType(pages[i]?.page_type);
    const previous = i > 0 ? normalizePageType(pages[i - 1]?.page_type) : "NONE";
    if (current === pageType && previous !== pageType) {
      runNumber += 1;
    }
  }

  let runPosition = 1;
  for (let i = pageIndex - 1; i >= 0; i -= 1) {
    if (normalizePageType(pages[i]?.page_type) !== pageType) break;
    runPosition += 1;
  }

  const label = pageType === "NIGHT" ? "Night" : "Day";
  return `${label} ${Math.max(1, runNumber)}${getRunRepeatSuffix(runPosition)}`;
}

function initializeUnsetPageTitles() {
  props.game.grimoire.forEach((grimoire, index) => {
    const pageRef = grimoire as object;
    if (initializedPageTitles.has(pageRef)) return;

    if (!grimoire.page_type) {
      grimoire.page_type = defaultGrimoirePageType();
    }
    const autoTitle = getAutoPageTitleForIndex(props.game.grimoire, index);
    if (!grimoire.title?.trim()) {
      grimoire.title = autoTitle;
      autoGeneratedPageTitles.add(pageRef);
    } else if (grimoire.title.trim() === autoTitle) {
      autoGeneratedPageTitles.add(pageRef);
    }

    initializedPageTitles.add(pageRef);
  });
}

function syncAutoGeneratedPageTitles() {
  props.game.grimoire.forEach((grimoire, index) => {
    const pageRef = grimoire as object;
    if (!autoGeneratedPageTitles.has(pageRef)) return;

    const autoTitle = getAutoPageTitleForIndex(props.game.grimoire, index);
    if (grimoire.title !== autoTitle) {
      grimoire.title = autoTitle;
    }
  });
}

function onPageTitleInput() {
  const currentPage = props.game.grimoire[grimPage.value];
  if (!currentPage) return;
  autoGeneratedPageTitles.delete(currentPage as object);
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
  reorderCurrentPageSeats(sourceOrder, insertIndex);
}

function reorderCurrentPageSeats(sourceOrder: number, insertIndex: number) {
  const page = props.game.grimoire[grimPage.value];
  if (!page) return;
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

function canMoveSeat(order: number, direction: "up" | "down") {
  const rows = currentPageSeatRows.value;
  const index = rows.findIndex((row) => row.order === order);
  if (index < 0) return false;
  if (direction === "up") return index > 0;
  return index < rows.length - 1;
}

function moveSeatByDirection(order: number, direction: "up" | "down") {
  const rows = currentPageSeatRows.value;
  const fromIndex = rows.findIndex((row) => row.order === order);
  if (fromIndex < 0) return;

  const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
  if (toIndex < 0 || toIndex >= rows.length) return;

  onSeatDragEnd();
  reorderCurrentPageSeats(order, toIndex);
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

// The last deleted page, kept for a few seconds so a mis-tap can be undone.
const DELETE_UNDO_MS = 8000;
const deletedPage = ref<{
  page: (typeof props.game.grimoire)[number];
  index: number;
  title: string;
} | null>(null);
let deletedPageTimer: ReturnType<typeof setTimeout> | null = null;

function clearDeletedPage() {
  if (deletedPageTimer !== null) clearTimeout(deletedPageTimer);
  deletedPageTimer = null;
  deletedPage.value = null;
}

function deletePage() {
  const index = grimPage.value;
  const [page] = props.game.grimoire.splice(index, 1);
  grimPage.value = Math.max(0, index - 1);
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });

  if (!page) return;
  clearDeletedPage();
  clearEndedReminders();
  deletedPage.value = {
    page,
    index,
    title: page.title?.trim() || defaultGrimoirePageTitle(index),
  };
  deletedPageTimer = setTimeout(clearDeletedPage, DELETE_UNDO_MS);
}

function undoDeletePage() {
  const deleted = deletedPage.value;
  if (!deleted) return;
  // Pages may have been added or deleted since; keep the index in range.
  const index = Math.min(deleted.index, props.game.grimoire.length);
  props.game.grimoire.splice(index, 0, deleted.page);
  grimPage.value = index;
  clearDeletedPage();
  syncGrimoireEventsFromGrimoire({ force: true, silent: true });
}

onBeforeUnmount(() => {
  clearDeletedPage();
  clearEndedReminders();
});

const isLastPage = computed(
  () => grimPage.value === props.game.grimoire.length - 1
);

/** The phase the current page belongs to, e.g. "Night 2" (without "- Part n"). */
const currentPhaseName = computed(() =>
  getAutoPageTitleForIndex(props.game.grimoire, grimPage.value).replace(
    / - Part \d+$/,
    ""
  )
);

/** The phase the next-phase "Add" button would create, named like its automatic title. */
const nextPageType = computed(() =>
  getNextPageTypeFromCurrent(props.game.grimoire.at(-1)?.page_type ?? "NONE")
);
const nextPhaseName = computed(() =>
  getAutoPageTitleForIndex(
    [...props.game.grimoire, { page_type: nextPageType.value }] as {
      page_type?: LocalGrimoirePageType;
    }[],
    props.game.grimoire.length
  )
);

// Left/right arrow keys turn the page while the grimoire is on screen, unless
// the user is typing or a dialog or menu is open.
const grimoireEditRef = ref<HTMLElement | null>(null);

function onGrimoirePagingKeydown(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.defaultPrevented) return;

  const target = event.target as HTMLElement | null;
  if (
    target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")
  ) {
    return;
  }
  if (document.querySelector("dialog[open], [role='dialog'], [role='menu']")) return;

  const grimoire = grimoireEditRef.value;
  if (!grimoire) return;
  const rect = grimoire.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

  event.preventDefault();
  if (event.key === "ArrowLeft") pageBackward();
  else pageForward();
}

onMounted(() => window.addEventListener("keydown", onGrimoirePagingKeydown));
onBeforeUnmount(() =>
  window.removeEventListener("keydown", onGrimoirePagingKeydown)
);

// A getter, not the array itself: "Reset Game" on add-game replaces
// game.grimoire with a new array, and a watcher on the old array would stop
// seeing changes (and stop syncing events).
watch(
  () => props.game.grimoire,
  (value) => {
    const newTokens = value[grimPage.value]?.tokens ?? [];
    // Later pages are matched to this page by participant (the same player
    // across pages), not by seat: after a seat move the same seat is someone
    // else. Seat is only the fallback for tokens without a participant id.
    const newTokensByParticipant = new Map(
      newTokens
        .filter((token) => !!token.grimoire_participant_id)
        .map((token) => [token.grimoire_participant_id as string, token])
    );
    const newTokensByOrder = new Map(newTokens.map((token) => [token.order, token]));
    const sourceTokenFor = (token: { grimoire_participant_id?: string | null; order: number }) =>
      token.grimoire_participant_id
        ? newTokensByParticipant.get(token.grimoire_participant_id)
        : newTokensByOrder.get(token.order);

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
        const sourceToken = sourceTokenFor(token);
        if (!sourceToken) return;
        token.player_id = sourceToken.player_id;
        token.player_name = sourceToken.player_name;
      });
    });

    if (myCharacters.length > 0 || advancedModeEnabled.value) {
      props.game.player_characters = myCharacters;
    }

    if (!grimoireEventSyncReady.value) return;

    if (!grimoireChangedSinceOpen.value) {
      const baseline = grimoireInitialState.value;
      const current = serializeGrimoireState();
      if (baseline && current === baseline) return;
      grimoireChangedSinceOpen.value = true;
    }

    scheduleGrimoireEventSync();
  },
  { deep: true }
);

// Run a pending sync while the page is still fully alive, so the add-game
// draft (saved by the page whenever the game changes) includes it.
onBeforeRouteLeave(() => {
  flushScheduledGrimoireEventSync();
});

function flushGrimoireEventSyncBeforeUnload() {
  flushScheduledGrimoireEventSync();
}

onMounted(() => {
  window.addEventListener("beforeunload", flushGrimoireEventSyncBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", flushGrimoireEventSyncBeforeUnload);
  flushScheduledGrimoireEventSync();
});

function applyMyRoleToGrimoire() {
  const playerCharacter = props.game.player_characters[0];
  if (!playerCharacter) return;

  props.game.grimoire.forEach((page) => {
    page.tokens.forEach((token) => {
      if (!(!!token.player_id && token.player_id === user.value?.id)) return;

      const playerRole = playerCharacter.role;
      const relatedRole = playerCharacter.related_role;

      if (!token.role_id) {
        token.role = playerRole
          ? {
              token_url: playerRole.token_url,
              type: playerRole.type,
              name: playerCharacter.name,
              initial_alignment: playerRole.initial_alignment,
            }
          : undefined;
        token.role_id = playerCharacter.role_id;
        token.related_role = relatedRole
          ? {
              token_url: relatedRole.token_url,
            }
          : undefined;
        token.related_role_id = playerCharacter.related_role_id;
        token.alignment = playerCharacter.alignment;
      }

      if (!token.related_role_id) {
        token.related_role = relatedRole
          ? {
              token_url: relatedRole.token_url,
            }
          : undefined;
        token.related_role_id = playerCharacter.related_role_id;
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
  // The seat name suggestions need the friends list. Other pages load it as a
  // side effect, so opening the editor directly (refresh, bookmark) left it
  // empty and friends outside your communities couldn't be found.
  if (friends.friends.status === Status.IDLE) {
    friends.fetchFriends();
  }
  if (me.value.status === Status.SUCCESS) {
    games.fetchPlayerGames(me.value.data.username);
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
  await nextTick();
  grimoireInitialState.value = serializeGrimoireState();
  grimoireEventSyncReady.value = true;
});
</script>

<style scoped>
/*
 * The default disabled button is nearly transparent and vanishes on the dark
 * grimoire. Previous/Next keep their normal surface and only fade the label,
 * so they stay in place and still read as the same button.
 */
.ct-btn.grimoire-nav-btn:disabled:not(.ct-btn-link) {
  background-color: var(--color-base-200);
  --btn-fg: color-mix(in oklch, var(--color-base-content) 35%, transparent);
}

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

.grimoire-edit {
  .grimoire-scroll {
    padding-inline-start: 0;
    padding-block-start: 7rem;
    padding-block-end: 7rem;

    /* No scrollbar-gutter: this box has no fixed height, so it never scrolls
       vertically, and a reserved gutter only added an empty strip on the
       right (tinted at night) that pushed the controls off-centre. */
    scrollbar-width: thin;
    scrollbar-color: oklch(44.4% 0.011 73.639) transparent;
  }

  /* Same night tint as the global .grimoire--night, limited to the image. */
  .grimoire-night-layer {
    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      transition: opacity 0.3s;
      opacity: 0;
    }

    &::before {
      background: url("/img/ui/cloud-pattern.webp");
    }

    &::after {
      background-color: theme(colors.indigo.950);
    }

    &.is-night {
      &::before {
        opacity: 0.2;
      }

      &::after {
        opacity: 0.4;
      }
    }
  }

  .grimoire-title-wrapper {
    padding-inline-end: .75rem;
  }

  .grimoire-title {
    padding: .25rem;
  }

  .grimoire-type {
    position: relative;
    z-index: 1;
    background: theme(colors.amber.50);
    border: 1px solid theme(colors.grimtitle);
    border-block-end: none;
    border-start-start-radius: 0.375rem;
    border-start-end-radius: 0.375rem;

    label {
      @apply text-xs text-black;

      &:hover {
        @apply cursor-pointer;
      }
    }

    input[type="radio"]:checked + label {
      @apply font-semibold bg-stone-300 rounded-md;
    }
  }
}
</style>
