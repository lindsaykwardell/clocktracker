import { useMediaQuery } from "@vueuse/core";

export const useSidebarState = () => {
  const desktopCollapsed = useCookie<boolean>("sidebar_closed", {
    default: () => false,
  });
  const mobileMenuOpen = useState<boolean>("sidebar_mobile_open", () => false);
  const isMobile = useMediaQuery("(max-width: 800px)");
  const route = useRoute();

  const showMenu = computed(() => {
    return isMobile.value ? !mobileMenuOpen.value : desktopCollapsed.value;
  });

  const closeSidebar = () => {
    if (isMobile.value) {
      mobileMenuOpen.value = false;
    }
  };

  const toggleSidebar = () => {
    if (isMobile.value) {
      mobileMenuOpen.value = !mobileMenuOpen.value;
      return;
    }

    desktopCollapsed.value = !desktopCollapsed.value;
  };

  watch(
    () => route.fullPath,
    () => {
      closeSidebar();
    }
  );

  watch(isMobile, (mobile) => {
    if (!mobile) {
      mobileMenuOpen.value = false;
    }
  });

  return { showMenu, toggleSidebar, closeSidebar, isMobile };
};
