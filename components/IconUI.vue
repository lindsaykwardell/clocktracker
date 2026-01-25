<template>
  <span
    :class="[
      'inline-flex items-center justify-center',
      props.size,
      {
        'icon-rounded rounded-full dark:bg-black dark:text-white': props.rounded,
        'hover:bg-purple-600 transition-colors duration-200 ease-in-out z-10': props.rounded && !noHover,
        'bg-black text-white': props.rounded && props.dark,
        'bg-white text-black': props.rounded && !props.dark,
        'shadow': props.rounded && props.shadow,
      }
    ]"
  >
    <component 
      :is="icon"
      width="16" 
      height="16" 
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden="true"
      class="ui-icon"
      :class="[
        `ui-icon-${props.id}`,
        props.class,
        props.size,
        colorScheme,
        {'animate-spin': spin },
      ]"
    />  
    
  </span>
</template>

<script setup lang="ts">
  const props = defineProps<{
    id: string;
    class?: string;
    rounded?: boolean;
    shadow?: boolean;
    dark?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    spin?: boolean;
    color?: "primary" | "neutral" | "positive" | "caution" | "negative" | "bgg" | "yellow";
    noHover?: boolean;
  }>();

  const ArrowRightShort = resolveComponent("IconArrowRightShort");
  const Bgg = resolveComponent("IconBgg");
  const Json = resolveComponent("IconBraces");
  const CalenderPlus = resolveComponent("IconCalenderPlus");
  const Check = resolveComponent("IconCheck");
  const CheckCircle = resolveComponent("IconCheckCircle");
  const ChevronDown = resolveComponent("IconChevronDown");
  const ChevronLeft = resolveComponent("IconChevronLeft");
  const ChevronRight = resolveComponent("IconChevronRight");
  const Copy = resolveComponent("IconCopy");
  const Disabled = resolveComponent("IconDisabled");
  const Discord = resolveComponent("IconDiscord");
  const Dots = resolveComponent("IconDots");
  const Download = resolveComponent("IconDownload");
  const Edit = resolveComponent("IconPencilFill");
  const ExclamationCircle = resolveComponent("IconExclamationCircle");
  const Mail = resolveComponent("IconEnvelope");
  const EyeSlash = resolveComponent("IconEyeSlash");
  const Filter = resolveComponent("IconFilter");
  const Grid = resolveComponent("IconGrid");
  const Info = resolveComponent("IconInfo");
  const InfoCircle = resolveComponent("IconInfoCircle");
  const JournalNext = resolveComponent("IconJournalNext");
  const JournalPlus = resolveComponent("IconJournalPlus");
  const JournalPrev = resolveComponent("IconJournalPrev");
  const JournalX = resolveComponent("IconJournalX");
  const Location = resolveComponent("IconLocation");
  const Person = resolveComponent("IconPerson");
  const PersonHeart = resolveComponent("IconPersonHeart");
  const PersonPlus = resolveComponent("IconPersonPlus");
  const PlusLg = resolveComponent("IconPlusLg");
  const Reply = resolveComponent("IconReply");
  const Sign = resolveComponent("IconSign");
  const Star = resolveComponent("IconStar");
  const StarBordered = resolveComponent("IconStarBordered");
  const Stars = resolveComponent("IconStars");
  const Table = resolveComponent("IconTable");
  const Trash = resolveComponent("IconTrash");
  const Upload = resolveComponent("IconUpload");
  const View = resolveComponent("IconView");
  const WindowStack = resolveComponent("IconWindowStack");
  const X = resolveComponent("IconX");
  const XCircle = resolveComponent("IconXCircle");
  const XLg = resolveComponent("IconXLg");
  const PDF = resolveComponent("IconFileEarmarkPDF");
  const Menu = resolveComponent("IconList");
  const Players = resolveComponent("IconPlayers");
  const Chair = resolveComponent("IconChair");
  const GraphUpArrow = resolveComponent("IconGraphUpArrow");
  const GraphDownArrow = resolveComponent("IconGraphDownArrow");

  // Socials
  const Website = resolveComponent("IconGlobe");
  const Github = resolveComponent("IconGithub");
  const Twitter = resolveComponent("IconTwitter");
  const Twitch = resolveComponent("IconTwitch");
  const Youtube = resolveComponent("IconYoutube");
  const Bluesky = resolveComponent("IconBluesky");
  const Facebook = resolveComponent("IconFacebook");
  const KoFi = resolveComponent("IconKoFi");

  const icon = computed(() => {
    switch (props.id) {
      case "edit":
        return Edit;
      case "person":
        return Person;
      case "person-plus":
        return PersonPlus;
      case "person-heart":
        return PersonHeart;
      case "info":
        return Info;
      case "table":
        return Table;
      case "grid":
        return Grid;
      case "filter":
        return Filter;
      case "bgg":
        return Bgg;
      case "view":
        return View;
      case "disabled":
        return Disabled;
      case "reply":
        return Reply;
      case "dots":
        return Dots;
      case "sign":
        return Sign;
      case "upload":
        return Upload;
      case "download":
        return Download;
      case "journal-plus":
        return JournalPlus;
      case "journal-x":
        return JournalX;
      case "journal-prev":
        return JournalPrev;
      case "journal-next":
        return JournalNext;
      case "location":
        return Location; 
      case "arrow-right-short":
        return ArrowRightShort;
      case "mail":
        return Mail;
      case "discord":
        return Discord;
      case "chevron-down":
        return ChevronDown;
      case "chevron-left":
        return ChevronLeft;
      case "chevron-right":
        return ChevronRight;
      case "calender-plus":
        return CalenderPlus;
      case "star":
        return Star;
      case "star-bordered":
        return StarBordered;
      case "stars":
        return Stars;
      case "copy":
        return Copy;
      case "check":
        return Check;
      case "website":
        return Website;
      case "window-stack":
        return WindowStack;
      case "x":
        return X;
      case "x-lg":
        return XLg;
      case "twitter":
        return Twitter;
      case "github":
        return Github;
      case "twitch":
        return Twitch;
      case "youtube":
        return Youtube;
      case "bluesky":
        return Bluesky;
      case "facebook":
        return Facebook;
      case "json":
        return Json;
      case "pdf":
        return PDF;
      case "menu":
        return Menu;
      case "players":
        return Players;
      case "chair":
        return Chair;  
      case "kofi":
        return KoFi;
      case "trash":
        return Trash;
      case "add":
      case "plus-lg":
        return PlusLg;
      case "graph-down":
        return GraphDownArrow;
      case "graph-up":
        return GraphUpArrow;   
      case "check-circle":
        return CheckCircle;
      case "exclamation-circle":
        return ExclamationCircle;
      case "info-circle":
        return InfoCircle; 
      case "x-circle":
        return XCircle;       
      default:
        return EyeSlash;
    }
  });

  const primary = 
    "text-purple-700";
  const neutral = 
    "text-stone-700";    
  const positive = 
    "text-green-700";
  const caution = 
    "text-amber-700";  
  const negative = 
    "text-red-700";
  const bggColor =
    "text-[#ff5100]"
  const yellow =
    "text-yellow-400"  

  const colorScheme = computed(() => {
    if (props.color === "primary") {
      return `${primary}`;
    }
    else if (props.color === "neutral") {
      return `${neutral}`;
    }
    else if (props.color === "positive") {
      return `${positive}`;
    }
    else if (props.color === "caution") {
      return `${caution}`;
    }
    else if (props.color === "negative") {
      return `${negative}`;
    }
    else if (props.color === "bgg") {
      return `${bggColor}`;
    }
    else if (props.color === "yellow") {
      return `${yellow}`;
    }
  });
</script>

<style scoped>
  span.icon-rounded {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    
    @apply w-6 h-6 md:w-8 md:h-8;

    &.sm {
      @apply w-4 h-4 md:w-6 md:h-6;
    }
  }

  svg {
    inline-size: auto;
    @apply h-[0.875rem] md:h-[1.125rem];

    &.xxl {
      @apply h-[1.75rem] md:h-[1.875rem];
    }

    &.xl {
      @apply h-[1.5rem] md:h-[1.75rem];
    }

    &.lg {
      @apply h-[1rem] md:h-[1.25rem];
    }

    &.sm {
      @apply h-[0.75rem] md:h-[.875rem];
    }

    &.xs {
      @apply h-[0.625rem] md:h-[.75rem];
    }
  }
</style>
