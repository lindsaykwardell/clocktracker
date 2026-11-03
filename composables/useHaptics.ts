import type { ImpactStyle, NotificationType } from "@capacitor/haptics";

let hapticsModule: typeof import("@capacitor/haptics") | null = null;

async function getHaptics() {
  const config = useRuntimeConfig();
  if (!config.public.isCapacitorBuild) return null;

  if (!hapticsModule) {
    hapticsModule = await import("@capacitor/haptics");
  }
  return hapticsModule.Haptics;
}

export function useHaptics() {
  async function impact(style: ImpactStyle = "Medium" as ImpactStyle) {
    const haptics = await getHaptics();
    await haptics?.impact({ style });
  }

  async function notification(type: NotificationType = "Success" as NotificationType) {
    const haptics = await getHaptics();
    await haptics?.notification({ type });
  }

  async function selectionChanged() {
    const haptics = await getHaptics();
    await haptics?.selectionChanged();
  }

  return { impact, notification, selectionChanged };
}
