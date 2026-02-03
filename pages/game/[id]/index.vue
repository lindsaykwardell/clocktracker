<template>
    <StandardTemplate>
        <template
            v-if="
                game.status === Status.SUCCESS &&
                player.status === Status.SUCCESS
            "
        >
            <Alert
                v-if="
                    isMe && me.status === Status.SUCCESS && (isNew || isUpdate)
                "
                color="positive"
            >
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
            </Alert>

            <section
                class="flex flex-col text-black dark:text-white w-full lg:w-4/5 m-auto my-4 rounded shadow-lg relative"
            >
                <!-- Header -->
                <div
                    class="metadata bg-stone-200 dark:bg-stone-950 grid md:grid-cols-[1fr_max-content] justify-center md:justify-start gap-x-4 gap-y-8 py-4 px-7"
                >
                    <div class="flex-grow flex flex-col w-full gap-4">
                        <!-- Title -->
                        <div
                            class="flex flex-col md:flex-row items-center"
                            :class="
                                !last_character.name &&
                                last_character.alignment !== 'NEUTRAL'
                                    ? 'gap-9'
                                    : 'gap-4'
                            "
                        >
                            <div
                                v-if="
                                    last_character.name ||
                                    last_character.alignment !== 'NEUTRAL'
                                "
                                class="relative"
                                aria-hidden="true"
                            >
                                <template v-if="!game.data.is_storyteller">
                                    <nuxt-link
                                        :to="`/roles/${last_character?.role_id}`"
                                        class="hover:underline flex flex-col items-center"
                                    >
                                        <Token
                                            :character="last_character"
                                            size="md"
                                        />
                                    </nuxt-link>
                                </template>
                                <template v-else>
                                    <div class="flex flex-col items-center">
                                        <Token
                                            :character="last_character"
                                            size="md"
                                        />
                                    </div>
                                </template>
                            </div>
                            <div
                                class="flex-grow flex flex-col items-center md:items-start"
                            >
                                <h1
                                    class="text-3xl font-sorts text-center md:text-start text-balance max-w-80 md:max-w-none mb-2 md:mb-0"
                                >
                                    <template v-if="game.data.ls_game_id">
                                        Game
                                        {{
                                            game.data.associated_script.version
                                        }}
                                        of
                                    </template>
                                    <template v-if="game.data.script">
                                        {{ game.data.script }}
                                    </template>
                                    <template v-else> A game played </template>
                                    on {{ formatDate(game.data.date) }}
                                    <template v-if="isFavorite(game.data)">
                                        <IconUI
                                            id="star"
                                            class="text-primary"
                                            size="lg"
                                        />
                                    </template>
                                </h1>

                                <div
                                    class="flex justify-center md:justify-start items-center flex-wrap gap-1 mb-1"
                                >
                                    <Avatar
                                        :value="player.data.avatar || ''"
                                        size="xxs"
                                        aria-hidden="true"
                                    />
                                    <template
                                        v-if="
                                            !last_character.name &&
                                            last_character.alignment ===
                                                'NEUTRAL'
                                        "
                                    >
                                        Recorded by
                                    </template>
                                    <template
                                        v-if="
                                            last_character.name ||
                                            last_character.alignment !==
                                                'NEUTRAL'
                                        "
                                    >
                                        With
                                    </template>
                                    <nuxt-link
                                        class="hover:underline"
                                        :to="`/@${player.data.username}`"
                                    >
                                        {{ player.data.display_name }}
                                    </nuxt-link>
                                    <template
                                        v-if="
                                            last_character.name ||
                                            last_character.alignment !==
                                                'NEUTRAL'
                                        "
                                    >
                                        as
                                    </template>
                                </div>

                                <div
                                    class="flex flex-row flex-wrap justify-center md:justify-start gap-x-1 xl:max-w-[75%]"
                                >
                                    <div
                                        v-if="game.data.is_storyteller"
                                        class="font-sorts text-xl lg:text-2xl font-bold"
                                    >
                                        Storyteller
                                    </div>
                                    <template v-else>
                                        <span
                                            v-if="
                                                !last_character.name &&
                                                last_character.alignment !==
                                                    'NEUTRAL'
                                            "
                                            class="flex items-center gap-1 font-sorts text-xl lg:text-2xl font-bold"
                                            :class="{
                                                'text-blue-800 dark:text-blue-600':
                                                    last_character.alignment ===
                                                    'GOOD',
                                                'text-red-800 dark:text-red-600':
                                                    last_character.alignment ===
                                                    'EVIL',
                                            }"
                                        >
                                            {{ last_character.alignment }}
                                            <div
                                                v-html="
                                                    displayWinIconSvg(game.data)
                                                "
                                                class="mb-1 text-black dark:text-white"
                                            ></div>
                                        </span>
                                        <template v-else>
                                            <div
                                                v-for="(character, i) in game
                                                    .data.player_characters"
                                                class="flex gap-1 items-center"
                                                :class="{
                                                    'text-blue-800 dark:text-blue-600':
                                                        character.alignment ===
                                                        'GOOD',
                                                    'text-red-800 dark:text-red-600':
                                                        character.alignment ===
                                                        'EVIL',
                                                }"
                                            >
                                                <template v-if="i !== 0">
                                                    <IconUI
                                                        id="arrow-right-short"
                                                        size="lg"
                                                    />
                                                </template>
                                                <span
                                                    class="flex items-center gap-1 font-sorts text-xl lg:text-2xl font-bold"
                                                >
                                                    {{ character.name }}
                                                    <template
                                                        v-if="character.related"
                                                    >
                                                        ({{
                                                            character.related
                                                        }})
                                                    </template>
                                                    <div
                                                        v-if="
                                                            i ===
                                                            game.data
                                                                .player_characters
                                                                .length -
                                                                1
                                                        "
                                                        v-html="
                                                            displayWinIconSvg(
                                                                game.data,
                                                            )
                                                        "
                                                        class="mb-1 text-black dark:text-white"
                                                    ></div>
                                                </span>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <hr class="border-stone-300 w-full" />

                        <!-- Metadata -->
                        <div class="flex flex-col gap-4">
                            <!-- Row -->
                            <div class="metadata-row">
                                <div
                                    v-if="
                                        game.data?.win_v2 !==
                                        WinStatus_V2.NOT_RECORDED
                                    "
                                    class="metadata-item"
                                >
                                    <span class="metadata-label">Result</span>
                                    {{
                                        game.data?.win_v2 ===
                                        WinStatus_V2.GOOD_WINS
                                            ? "Good Won"
                                            : "Evil Won"
                                    }}
                                </div>
                                <div
                                    v-if="storytellers.length"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label"
                                        >Storyteller{{
                                            storytellers.length === 1 ? "" : "s"
                                        }}</span
                                    >
                                    <div>
                                        <template
                                            v-for="(
                                                storyteller, index
                                            ) in storytellers"
                                        >
                                            <span class="align-middle">
                                                <!-- @todo should only friends be linked? -->
                                                <Button
                                                    component="nuxt-link"
                                                    v-if="
                                                        isStorytellerAFriend(
                                                            storyteller,
                                                        ) &&
                                                        storyteller.includes(
                                                            '@',
                                                        )
                                                    "
                                                    variant="link"
                                                    color="primary"
                                                    :to="`/${storyteller}`"
                                                >
                                                    {{ storyteller }}
                                                </Button>
                                                <template v-else>{{
                                                    storyteller
                                                }}</template>
                                                <template
                                                    v-if="
                                                        index !==
                                                        storytellers.length - 1
                                                    "
                                                    >,
                                                </template>
                                            </span>
                                        </template>
                                    </div>
                                </div>
                                <div
                                    v-if="game.data.player_count"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label">Players</span>
                                    {{ game.data.player_count }}
                                </div>
                                <div
                                    v-if="game.data.traveler_count"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label"
                                        >Travelers</span
                                    >
                                    {{ game.data.traveler_count }}
                                </div>
                            </div>

                            <!-- Row -->
                            <div class="metadata-row">
                                <div
                                    v-if="game.data.community_name"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label"
                                        >Community</span
                                    >
                                    <div class="flex items-center gap-2">
                                        <Avatar
                                            v-if="game.data.community?.icon"
                                            :value="game.data.community.icon"
                                            size="xs"
                                            class="border-stone-800 flex-shrink"
                                            aria-hidden="true"
                                        />
                                        <Button
                                            component="nuxt-link"
                                            v-if="game.data.community?.slug"
                                            :to="`/community/${game.data.community.slug}`"
                                            variant="link"
                                            color="primary"
                                        >
                                            {{ game.data.community_name }}
                                        </Button>
                                        <div v-else>
                                            {{ game.data.community_name }}
                                        </div>
                                    </div>
                                </div>
                                <div class="metadata-item">
                                    <span class="metadata-label">Location</span>
                                    {{
                                        game.data.location_type === "IN_PERSON"
                                            ? "In Person"
                                            : "Online"
                                    }}
                                    {{
                                        game.data.location
                                            ? ` (${game.data.location})`
                                            : ""
                                    }}
                                </div>
                                <div
                                    v-if="game.data.parent_game"
                                    class="flex gap-3 items-center"
                                >
                                    <span class="metadata-label"
                                        >Tagged By</span
                                    >
                                    <Button
                                        component="nuxt-link"
                                        :to="`/@${game.data.parent_game.user.username}`"
                                        variant="link"
                                        color="primary"
                                    >
                                        {{
                                            game.data.parent_game.user
                                                .display_name
                                        }}
                                    </Button>
                                </div>
                            </div>

                            <!-- Row -->
                            <div
                                v-if="
                                    game.data.demon_bluffs.length ||
                                    game.data.fabled.length
                                "
                                class="metadata-row"
                            >
                                <div
                                    v-if="game.data.demon_bluffs.length"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label"
                                        >Demon Bluffs</span
                                    >
                                    <div class="flex flex-wrap gap-2">
                                        <a
                                            v-for="bluff in game.data
                                                .demon_bluffs"
                                            :href="`/roles/${bluff.role_id}`"
                                            class="block"
                                            target="_blank"
                                        >
                                            <Token
                                                :key="bluff.id"
                                                :character="bluff"
                                                size="sm"
                                            />
                                        </a>
                                    </div>
                                </div>
                                <div
                                    v-if="game.data.fabled.length"
                                    class="metadata-item"
                                >
                                    <span class="metadata-label">
                                        <template
                                            v-if="
                                                game.data.fabled.some(
                                                    (r) =>
                                                        r.role?.type ===
                                                        'FABLED',
                                                )
                                            "
                                        >
                                            Fabled
                                        </template>
                                        <template
                                            v-if="
                                                game.data.fabled.some(
                                                    (r) =>
                                                        r.role?.type ===
                                                        'FABLED',
                                                ) &&
                                                game.data.fabled.some(
                                                    (r) =>
                                                        r.role?.type ===
                                                        'LORIC',
                                                )
                                            "
                                        >
                                            {{ " " }}&{{ " " }}
                                        </template>
                                        <template
                                            v-if="
                                                game.data.fabled.some(
                                                    (r) =>
                                                        r.role?.type ===
                                                        'LORIC',
                                                )
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
                                            <Token
                                                :key="fabled.id"
                                                :character="fabled"
                                                size="sm"
                                            />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Tags -->
                            <div
                                v-if="
                                    game.data.tags.length > 0 ||
                                    game.data.ignore_for_stats ||
                                    game.data.privacy === 'PRIVATE' ||
                                    game.data.privacy === 'FRIENDS_ONLY'
                                "
                                class="flex flex-wrap gap-2 justify-center md:justify-start"
                            >
                                <template v-for="tag in game.data.tags">
                                    <Badge variant="soft" size="sm">
                                        {{ tag }}
                                    </Badge>
                                </template>
                                <Badge
                                    v-if="game.data.ignore_for_stats"
                                    icon="disabled"
                                    color="negative"
                                    variant="soft"
                                    size="sm"
                                >
                                    Ignored for Stats
                                </Badge>
                                <Badge
                                    v-if="
                                        game.data.privacy === 'PRIVATE' ||
                                        game.data.privacy === 'FRIENDS_ONLY'
                                    "
                                    icon="eye-slash"
                                    color="negative"
                                    variant="soft"
                                    size="sm"
                                >
                                    <span class="sr-only">Visibility: </span>
                                    <template
                                        v-if="game.data.privacy === 'PRIVATE'"
                                    >
                                        Private
                                    </template>
                                    <template v-else> Friends Only </template>
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <!-- Script image -->
                    <div class="flex flex-col items-center">
                        <img
                            :src="
                                game.data.associated_script?.logo ??
                                scriptLogo(game.data.script)
                            "
                            class="hidden md:block w-48 xl:w-64 h-48 xl:h-64"
                            aria-hidden="true"
                        />
                        <div
                            v-if="
                                game.data.associated_script?.version &&
                                !isBaseScript(game.data.script)
                            "
                            class="my-1 text-sm text-muted"
                        >
                            {{ game.data.script }}
                            <template v-if="game.data.ls_game_id">
                                - Game {{ game.data.associated_script.version }}
                            </template>
                            <template v-else>
                                - {{ game.data.associated_script.version }}
                            </template>
                        </div>

                        <div class="flex flex-wrap justify-center gap-1">
                            <Button
                                component="nuxt-link"
                                v-if="game.data.associated_script?.version"
                                :to="games.getScriptLink(game.data)"
                                wide
                            >
                                View script
                            </Button>
                            <Button
                                component="a"
                                v-if="game.data.ls_game?.campaign"
                                :href="`https://chillclocktower.com/living-script/campaign.php?view=${game.data.ls_game.campaign.id}`"
                                image="living-scripts"
                                target="_blank"
                                wide
                            >
                                View Campaign
                            </Button>
                        </div>
                        <template v-if="game.data.bgg_id">
                            <Button
                                component="a"
                                :href="`https://boardgamegeek.com/play/details/${game.data.bgg_id}`"
                                target="_blank"
                                color="bgg"
                                iconColor="bgg"
                                icon="bgg"
                                size="sm"
                            >
                                View on BoardGameGeek
                            </Button>
                        </template>
                    </div>

                    <!-- Notes -->
                    <div
                        v-if="game.data.notes || game.data.image_urls.length"
                        class="md:col-span-2"
                    >
                        <h2
                            class="font-sorts text-2xl text-center md:text-start"
                        >
                            Notes and Images
                        </h2>
                        <div
                            v-if="game.data.notes"
                            class="notes bg-stone-100 dark:bg-stone-900 p-4 shadow-lg mt-3"
                        >
                            <VueMarkdown
                                class="max-w-[80ch]"
                                :source="game.data.notes"
                            />
                        </div>
                        <div class="flex flex-col gap-5">
                            <div class="flex flex-wrap gap-5">
                                <div
                                    v-for="file in game.data.image_urls"
                                    :key="file"
                                >
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
                </div>

                <!-- Grimoire -->
                <div
                    v-if="
                        game.data.grimoire[0] &&
                        game.data.grimoire[0].tokens.some(
                            (token) =>
                                token.player_name.length > 0 || token.role,
                        )
                    "
                    :style="
                        game.data.associated_script?.background
                            ? {
                                  '--bg-image-url': `url(${game.data.associated_script.background})`,
                              }
                            : {}
                    "
                    class="grimoire bg-center bg-cover relative text-white script-bg"
                    :class="{
                        ...scriptBgClasses(
                            game.data.script,
                            !!game.data.associated_script?.background,
                        ),
                    }"
                >
                    <Button
                        type="button"
                        @click="grimPage -= 1"
                        v-if="grimPage !== 0"
                        icon="journal-prev"
                        class="absolute bottom-1 left-1 z-10"
                    >
                        <span> Previous page </span>
                    </Button>
                    <Button
                        type="button"
                        v-if="grimPage !== game.data.grimoire.length - 1"
                        @click="grimPage += 1"
                        icon="journal-next"
                        class="absolute bottom-1 right-1 z-10"
                    >
                        <span> Next page </span>
                    </Button>
                    <div class="w-screen md:w-full overflow-scroll min-h-48">
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
                                game.data?.win_v2 === WinStatus_V2.GOOD_WINS
                                    ? 'good'
                                    : 'evil'
                            "
                        >
                            <span>
                                {{
                                    game.data?.win_v2 === WinStatus_V2.GOOD_WINS
                                        ? "Good"
                                        : "Evil"
                                }}
                            </span>
                            won!
                        </div>
                    </div>
                    <div
                        class="text-center bg-gradient-to-b from-transparent via-stone-800 to-stone-800"
                    >
                        Page {{ grimPage + 1 }} of
                        {{ game.data.grimoire.length }}
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
                <div
                    v-if="!isMe"
                    class="absolute top-3 right-3"
                    id="menu-controls"
                >
                    <Menu v-slot="{ open }">
                        <MenuButton>
                            <IconUI id="dots" :rounded="true" shadow />
                        </MenuButton>
                        <transition
                            enter-active-class="transition duration-100 ease-out"
                            enter-from-class="transform scale-95 opacity-0"
                            enter-to-class="transform scale-100 opacity-100"
                            leave-active-class="transition duration-75 ease-out"
                            leave-from-class="transform scale-100 opacity-100"
                            leave-to-class="transform scale-95 opacity-0"
                        >
                            <div v-show="open">
                                <MenuItems
                                    static
                                    class="ct-contextual-links right-0"
                                >
                                    <div
                                        v-if="
                                            game.data
                                                .waiting_for_confirmation ||
                                            similarGames.length > 0
                                        "
                                        class="w-full"
                                    >
                                        <MenuItem
                                            v-if="
                                                game.data
                                                    .waiting_for_confirmation
                                            "
                                        >
                                            <ButtonSubmenu
                                                @click="confirmGame"
                                                icon="plus-lg"
                                                color="positive"
                                            >
                                                Add game to my Profile
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem
                                            v-if="similarGames.length > 0"
                                        >
                                            <ButtonSubmenu
                                                @click="
                                                    showSimilarGamesDialog = true
                                                "
                                                :disabled="mergeInFlight"
                                                variant="filled"
                                                icon="window-stack"
                                                color="caution"
                                            >
                                                Merge with similar game
                                            </ButtonSubmenu>
                                        </MenuItem>
                                    </div>
                                    <div class="w-full">
                                        <MenuItem
                                            v-if="
                                                !game.data
                                                    .waiting_for_confirmation
                                            "
                                        >
                                            <ButtonSubmenu
                                                @click="toggleFavorite"
                                                icon="star"
                                                iconColor="primary"
                                            >
                                                <div id="favorite-game">
                                                    Mark as Favorite
                                                </div>
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem
                                            v-if="
                                                !game.data
                                                    .waiting_for_confirmation
                                            "
                                        >
                                            <ButtonSubmenu
                                                component="nuxt-link"
                                                :to="`/game/${route.params.id}/edit`"
                                                icon="edit"
                                            >
                                                <div id="edit-game">Edit</div>
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem>
                                            <ButtonSubmenu
                                                @click="deleteGame(false)"
                                                :icon="
                                                    game.data
                                                        .waiting_for_confirmation
                                                        ? 'x-lg'
                                                        : 'trash'
                                                "
                                                :color="
                                                    game.data
                                                        .waiting_for_confirmation
                                                        ? 'caution'
                                                        : 'neutral'
                                                "
                                            >
                                                <div id="delete-game">
                                                    <template
                                                        v-if="
                                                            game.data
                                                                .waiting_for_confirmation
                                                        "
                                                    >
                                                        Decline
                                                    </template>
                                                    <template v-else>
                                                        Delete
                                                    </template>
                                                </div>
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem
                                            v-if="game.data.parent_game_id"
                                        >
                                            <ButtonSubmenu
                                                @click="deleteGame(true)"
                                                :icon="
                                                    game.data
                                                        .waiting_for_confirmation
                                                        ? 'x-lg'
                                                        : 'trash'
                                                "
                                                :color="
                                                    game.data
                                                        .waiting_for_confirmation
                                                        ? 'negative'
                                                        : 'neutral'
                                                "
                                            >
                                                <template
                                                    v-if="
                                                        game.data
                                                            .waiting_for_confirmation
                                                    "
                                                >
                                                    Decline
                                                </template>
                                                <template v-else>
                                                    Delete
                                                </template>
                                                and Untag Myself
                                            </ButtonSubmenu>
                                        </MenuItem>
                                    </div>
                                    <div class="w-full">
                                        <MenuItem v-if="canPostToBGG">
                                            <ButtonSubmenu
                                                @click="initPostToBGG"
                                                variant="filled"
                                                color="bgg"
                                                icon="bgg"
                                                iconColor="bgg"
                                                :iconSpin="bggInFlight"
                                                :disabled="bggInFlight"
                                            >
                                                <span v-if="game.data.bgg_id"
                                                    >Delete from BGG</span
                                                >
                                                <span v-else>Post to BGG</span>
                                            </ButtonSubmenu>
                                        </MenuItem>
                                        <MenuItem v-if="true">
                                            <ButtonSubmenu
                                                component="a"
                                                :href="bgStatsLink"
                                                variant="filled"
                                                color="bgstats"
                                                image="bgstats"
                                            >
                                                Post to BGStats
                                            </ButtonSubmenu>
                                        </MenuItem>
                                    </div>
                                </MenuItems>
                            </div>
                        </transition>
                    </Menu>
                </div>
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
import { displayWinIconSvg } from "~/composables/useGames";
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
    game.value.status === Status.SUCCESS
        ? game.value.data.grimoire.length - 1
        : 0,
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
    title: `${gameMetadata.data.value!.user!.display_name} - ${
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
            content: `${gameMetadata.data.value!.user!.display_name} - ${
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
            content: `${gameMetadata.data.value!.user!.display_name} - ${
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
                me.value.data.user_id,
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
                    token.player_id === me.value.data.user_id,
            ),
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
            }?`,
        )
    ) {
        await games.deleteGame(gameId, alsoUntagMyself);

        router.push(`/`);
    }
}

async function confirmGame() {
    if (confirm("Are you sure you want to add this game to your profile?")) {
        const result = await $fetch<GameRecord>(
            `/api/games/${gameId}/confirm`,
            {
                method: "POST",
            },
        );

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
                (f) => f.game_id !== gameId,
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
                },
            );

            games.games.set(gameId, { status: Status.SUCCESS, data: result });
        } catch (error: any) {
            alert(
                `There was a problem claiming this seat: ${error.statusMessage}`,
            );
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
        /* Compensate scrollbars (and page count) so tokens are centered */
        /* padding-inline-start: 1rem; */
        padding-block-start: 3.25rem;
        padding-block-end: 1.5rem;

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

<style scoped>
.metadata-row {
    @apply flex flex-row flex-wrap gap-4 md:gap-8 justify-center md:justify-start;
}

.metadata-item {
    /* @apply flex flex-col gap-1 items-start; */
    @apply flex gap-3 items-center;
}

.metadata-label {
    /* @apply text-xs text-stone-500 dark:text-stone-400 uppercase; */
    @apply text-sm text-stone-500 dark:text-stone-400;
}
</style>
