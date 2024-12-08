<template>
  <div ref="container" class="h-screen overflow-y-hidden">
    <div class="sections-menu">
      <span
        class="menu-point"
        v-bind:class="{ active: data.activeSection == index }"
        v-on:click="scrollToSection(index)"
        v-for="(offset, index) in data.offsets"
        v-bind:key="index"
      >
      </span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
const container = ref<HTMLElement | null>(null);

const data = reactive<{
  inMove: boolean;
  inMoveDelay: number;
  activeSection: number;
  offsets: number[];
  touchStartY: number;
}>({
  inMove: false,
  inMoveDelay: 1000,
  activeSection: 0,
  offsets: [],
  touchStartY: 0,
});

function calculateSectionOffsets() {
  let sections = container.value?.getElementsByTagName("section");

  if (!sections) return;

  let length = sections.length;

  for (let i = 0; i < length; i++) {
    let sectionOffset = sections[i].offsetTop;
    data.offsets.push(sectionOffset);
  }
}
/**
 * Handle the 'mousewheel' event for other browsers
 */
function handleMouseWheel(e: any) {
  if (e.wheelDelta < 30 && !data.inMove) {
    moveUp();
  } else if (e.wheelDelta > 30 && !data.inMove) {
    moveDown();
  }

  e.preventDefault();
  return false;
}
/**
 * Handle the 'DOMMouseScroll' event for Firefox
 */
function handleMouseWheelDOM(e: any) {
  if (e.detail > 0 && !data.inMove) {
    moveUp();
  } else if (e.detail < 0 && !data.inMove) {
    moveDown();
  }

  return false;
}
/**
 * Move to the previous section or the last section if you're on the first section
 */
function moveDown() {
  if (data.inMove) return false;

  data.inMove = true;
  data.activeSection--;

  if (data.activeSection < 0) data.activeSection = data.offsets.length - 1;

  scrollToSection(data.activeSection, true);
}
/**
 * Move to the next section or the first section if you're on the last section
 */
function moveUp() {
  if (data.inMove) return false;

  data.inMove = true;
  data.activeSection++;

  if (data.activeSection > data.offsets.length - 1) data.activeSection = 0;

  scrollToSection(data.activeSection, true);
}
/**
 * Scrolls to the passed section id if the section exists and the delay is over
 */
function scrollToSection(id: number, force = false) {
  if (data.inMove && !force) return false;

  data.activeSection = id;
  data.inMove = true;

  // get section and scroll into view if it exists
  let section = document.getElementsByTagName("section")[id];
  if (section) {
    document
      .getElementsByTagName("section")
      [id].scrollIntoView({ behavior: "smooth" });
  }

  setTimeout(() => {
    data.inMove = false;
  }, data.inMoveDelay);
}
/**
 * Handles the 'touchstart' event on mobile devices
 */
function touchStart(e: any) {
  e.preventDefault();

  data.touchStartY = e.touches[0].clientY;
}
/**
 * Handles the 'touchmove' event on mobile devices
 */
function touchMove(e: any) {
  if (data.inMove) return false;
  e.preventDefault();

  const currentY = e.touches[0].clientY;

  if (data.touchStartY < currentY) {
    moveDown();
  } else {
    moveUp();
  }

  data.touchStartY = 0;
  return false;
}
/**
 * mounted() hook executes after page load and call the section offset calculation and registers all events
 */
onMounted(() => {
  calculateSectionOffsets();

  window.addEventListener("DOMMouseScroll", handleMouseWheelDOM); // Mozilla Firefox
  window.addEventListener("mousewheel", handleMouseWheel, {
    passive: false,
  }); // Other browsers

  window.addEventListener("touchstart", touchStart, { passive: false }); // mobile devices
  window.addEventListener("touchmove", touchMove, { passive: false }); // mobile devices
});
/**
 * destroyed() hook executes on page destroy and removes all registered event listeners
 */
onUnmounted(() => {
  // remove all event listeners
  window.removeEventListener("DOMMouseScroll", handleMouseWheelDOM);
  window.removeEventListener("mousewheel", handleMouseWheel);
  window.removeEventListener("touchstart", touchStart);
  window.removeEventListener("touchmove", touchMove);
});
</script>

<style scoped>
:slotted(section) {
  height: 100dvh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;

  & > * {
    padding: 2rem;
  }
}

.sections-menu {
  position: fixed;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.sections-menu .menu-point {
  width: 10px;
  height: 10px;
  background-color: #fff;
  display: block;
  margin: 1rem 0;
  opacity: 0.6;
  transition: 0.4s ease-in-out all;
  cursor: pointer;
}

.sections-menu .menu-point.active {
  opacity: 1;
  transform: scale(1.5);
}

.sections-menu .menu-point:hover {
  opacity: 1;
  transform: scale(1.2);
}
</style>
