import { defineStore } from "pinia";

export const useFeatureFlags = defineStore("featureFlags", {
  state: (): {
    flags: Map<string, boolean>;
    scheduledMaintenance: Date | null;
  } => ({
    flags: new Map<string, boolean>(),
    scheduledMaintenance: null,
  }),
  getters: {
    isEnabled(): (flag: string) => boolean {
      return (flag: string): boolean => {
        return this.flags.get(flag) || false;
      };
    },
    maintenanceIsScheduled(): false | Date {
      return this.scheduledMaintenance ?? false;
    },
  },
  actions: {
    async init() {
      const { data, error } = await useFetch<{ [key: string]: boolean }>(
        "/api/feature_flags"
      );

      if (error.value) {
        console.error(error);
        return;
      }

      data.value;

      for (const [key, value] of Object.entries(data.value || {})) {
        this.flags.set(key, value);
      }
    },
    async fetchScheduledMaintenance() {
      const { data: maintenance, error: maintenanceError } = await useFetch(
        "/api/scheduled_maintenance"
      );

      if (maintenanceError.value) {
        console.error(maintenanceError);
        return;
      }

      this.scheduledMaintenance = maintenance.value
        ? new Date(maintenance.value)
        : null;
    }
  },
});
