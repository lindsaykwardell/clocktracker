// Every icon IconUI can draw, by the id used in templates (`<IconUI id="…">`,
// `<Button icon="…">`). Add an icon by adding its file under components/icon/
// and one line here; the id type below then accepts it everywhere.
import IconArrow90degDown from "~/components/icon/Arrow90degDown.vue";
import IconArrowClockwise from "~/components/icon/ArrowClockwise.vue";
import IconArrowCounterClockwise from "~/components/icon/ArrowCounterClockwise.vue";
import IconArrowDownShort from "~/components/icon/ArrowDownShort.vue";
import IconArrowLeftShort from "~/components/icon/ArrowLeftShort.vue";
import IconArrowRightShort from "~/components/icon/ArrowRightShort.vue";
import IconArrowUpShort from "~/components/icon/ArrowUpShort.vue";
import IconArrowsMove from "~/components/icon/ArrowsMove.vue";
import IconBgg from "~/components/icon/Bgg.vue";
import IconBluesky from "~/components/icon/Bluesky.vue";
import IconBook from "~/components/icon/Book.vue";
import IconBraces from "~/components/icon/Braces.vue";
import IconCalenderPlus from "~/components/icon/CalenderPlus.vue";
import IconChair from "~/components/icon/Chair.vue";
import IconCheck from "~/components/icon/Check.vue";
import IconCheckCircle from "~/components/icon/CheckCircle.vue";
import IconChevronDown from "~/components/icon/ChevronDown.vue";
import IconChevronLeft from "~/components/icon/ChevronLeft.vue";
import IconChevronRight from "~/components/icon/ChevronRight.vue";
import IconClockHistory from "~/components/icon/ClockHistory.vue";
import IconCopy from "~/components/icon/Copy.vue";
import IconCrosshair from "~/components/icon/Crosshair.vue";
import IconDisabled from "~/components/icon/Disabled.vue";
import IconDiscord from "~/components/icon/Discord.vue";
import IconDots from "~/components/icon/Dots.vue";
import IconDownload from "~/components/icon/Download.vue";
import IconEnvelope from "~/components/icon/Envelope.vue";
import IconExclamationCircle from "~/components/icon/ExclamationCircle.vue";
import IconEyeSlash from "~/components/icon/EyeSlash.vue";
import IconFacebook from "~/components/icon/Facebook.vue";
import IconFileEarmarkPDF from "~/components/icon/FileEarmarkPDF.vue";
import IconFilter from "~/components/icon/Filter.vue";
import IconGithub from "~/components/icon/Github.vue";
import IconGlobe from "~/components/icon/Globe.vue";
import IconGraphDownArrow from "~/components/icon/GraphDownArrow.vue";
import IconGraphUpArrow from "~/components/icon/GraphUpArrow.vue";
import IconGrid from "~/components/icon/Grid.vue";
import IconInfo from "~/components/icon/Info.vue";
import IconInfoCircle from "~/components/icon/InfoCircle.vue";
import IconJournalNext from "~/components/icon/JournalNext.vue";
import IconJournalPlus from "~/components/icon/JournalPlus.vue";
import IconJournalPrev from "~/components/icon/JournalPrev.vue";
import IconJournalX from "~/components/icon/JournalX.vue";
import IconJournals from "~/components/icon/Journals.vue";
import IconKoFi from "~/components/icon/KoFi.vue";
import IconList from "~/components/icon/List.vue";
import IconLocation from "~/components/icon/Location.vue";
import IconLock from "~/components/icon/Lock.vue";
import IconMenuClose from "~/components/icon/MenuClose.vue";
import IconMenuOpen from "~/components/icon/MenuOpen.vue";
import IconMoon from "~/components/icon/Moon.vue";
import IconPencilFill from "~/components/icon/PencilFill.vue";
import IconPerson from "~/components/icon/Person.vue";
import IconPersonHeart from "~/components/icon/PersonHeart.vue";
import IconPersonPlus from "~/components/icon/PersonPlus.vue";
import IconPin from "~/components/icon/Pin.vue";
import IconPlayers from "~/components/icon/Players.vue";
import IconPlusLg from "~/components/icon/PlusLg.vue";
import IconReply from "~/components/icon/Reply.vue";
import IconSearch from "~/components/icon/Search.vue";
import IconSign from "~/components/icon/Sign.vue";
import IconStar from "~/components/icon/Star.vue";
import IconStarBordered from "~/components/icon/StarBordered.vue";
import IconStars from "~/components/icon/Stars.vue";
import IconSun from "~/components/icon/Sun.vue";
import IconTable from "~/components/icon/Table.vue";
import IconTrash from "~/components/icon/Trash.vue";
import IconTwitch from "~/components/icon/Twitch.vue";
import IconTwitter from "~/components/icon/Twitter.vue";
import IconUnlock from "~/components/icon/Unlock.vue";
import IconUpload from "~/components/icon/Upload.vue";
import IconView from "~/components/icon/View.vue";
import IconWindowStack from "~/components/icon/WindowStack.vue";
import IconX from "~/components/icon/X.vue";
import IconXCircle from "~/components/icon/XCircle.vue";
import IconXLg from "~/components/icon/XLg.vue";
import IconYoutube from "~/components/icon/Youtube.vue";

export const uiIcons = {
  add: IconPlusLg,
  "arrow-90deg-down": IconArrow90degDown,
  "arrow-clockwise": IconArrowClockwise,
  "arrow-counterclockwise": IconArrowCounterClockwise,
  "arrow-down-short": IconArrowDownShort,
  "arrow-left-short": IconArrowLeftShort,
  "arrow-right-short": IconArrowRightShort,
  "arrow-up-short": IconArrowUpShort,
  "arrows-move": IconArrowsMove,
  bgg: IconBgg,
  bluesky: IconBluesky,
  book: IconBook,
  "calender-plus": IconCalenderPlus,
  chair: IconChair,
  check: IconCheck,
  "check-circle": IconCheckCircle,
  "chevron-down": IconChevronDown,
  "chevron-left": IconChevronLeft,
  "chevron-right": IconChevronRight,
  "clock-history": IconClockHistory,
  copy: IconCopy,
  crosshair: IconCrosshair,
  disabled: IconDisabled,
  discord: IconDiscord,
  dots: IconDots,
  download: IconDownload,
  edit: IconPencilFill,
  "exclamation-circle": IconExclamationCircle,
  "eye-slash": IconEyeSlash,
  facebook: IconFacebook,
  filter: IconFilter,
  github: IconGithub,
  "graph-down": IconGraphDownArrow,
  "graph-up": IconGraphUpArrow,
  grid: IconGrid,
  info: IconInfo,
  "info-circle": IconInfoCircle,
  "journal-next": IconJournalNext,
  "journal-plus": IconJournalPlus,
  "journal-prev": IconJournalPrev,
  "journal-x": IconJournalX,
  journals: IconJournals,
  json: IconBraces,
  kofi: IconKoFi,
  location: IconLocation,
  lock: IconLock,
  mail: IconEnvelope,
  menu: IconList,
  "menu-close": IconMenuClose,
  "menu-open": IconMenuOpen,
  moon: IconMoon,
  pdf: IconFileEarmarkPDF,
  person: IconPerson,
  "person-heart": IconPersonHeart,
  "person-plus": IconPersonPlus,
  pin: IconPin,
  players: IconPlayers,
  "plus-lg": IconPlusLg,
  reply: IconReply,
  search: IconSearch,
  sign: IconSign,
  star: IconStar,
  "star-bordered": IconStarBordered,
  stars: IconStars,
  sun: IconSun,
  table: IconTable,
  trash: IconTrash,
  twitch: IconTwitch,
  twitter: IconTwitter,
  unlock: IconUnlock,
  upload: IconUpload,
  view: IconView,
  website: IconGlobe,
  "window-stack": IconWindowStack,
  x: IconX,
  "x-circle": IconXCircle,
  "x-lg": IconXLg,
  youtube: IconYoutube,
} as const;

export type UiIconId = keyof typeof uiIcons;
