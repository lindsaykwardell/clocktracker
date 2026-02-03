export const useSidebarState = () => {
  const showMenu = useCookie<boolean>("sidebar_closed", {
    default: () => false,
  });

  const toggleSidebar = () => {
    showMenu.value = !showMenu.value;
  };

  return { showMenu, toggleSidebar };
};
