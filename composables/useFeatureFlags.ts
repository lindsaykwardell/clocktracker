import { defineStore } from "pinia";
import type { LocationQuery } from "vue-router";

export const useFeatureFlags = defineStore("featureFlags", {
  state: (): {
    flags: Map<string, boolean>;
    scheduledMaintenance: Date | null;
  } => ({
    flags: new Map<string, boolean>(),
    scheduledMaintenance: null,
  }),
  getters: {
    isEnabled(
      state
    ): (flagName: string, queryParams?: LocationQuery) => boolean {
      return (flagName: string, queryParams?: LocationQuery): boolean => {
        // 1. Check if the flag is enabled via API (already in state.flags)
        const apiEnabled = state.flags.get(flagName) || false;

        // 2. Check if the flag is enabled via URL query parameter
        let urlEnabled = false;
        const params = queryParams || useRoute().query;

        if (params?.featureFlags) {
          const featureFlagsQuery = params.featureFlags;

          if (
            typeof featureFlagsQuery === "string" &&
            featureFlagsQuery.length > 0
          ) {
            const urlFlags = featureFlagsQuery
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f.length > 0);
            if (urlFlags.includes(flagName)) {
              urlEnabled = true;
            }
          } else if (Array.isArray(featureFlagsQuery)) {
            // Handles cases like ?featureFlags=flagA&featureFlags=flagB
            const urlFlags = featureFlagsQuery
              .flatMap((q) =>
                typeof q === "string" ? q.split(",").map((f) => f.trim()) : []
              )
              .filter((f) => f.length > 0);
            if (urlFlags.includes(flagName)) {
              urlEnabled = true;
            }
          }
        }

        return apiEnabled || urlEnabled;
      };
    },
    maintenanceIsScheduled(state): false | Date {
      return state.scheduledMaintenance ?? false;
    },
  },
  actions: {
    async init() {
      const flags = await $fetch<{ [key: string]: boolean }>(
        "/api/feature_flags"
      );

      this.flags.clear(); // Clear existing flags before setting new ones
      if (flags) {
        // Check if data.value is not null or undefined
        for (const [key, value] of Object.entries(flags)) {
          this.flags.set(key, value);
        }
      }
    },
    async fetchScheduledMaintenance() {
      const maintenance = await $fetch<string | null>(
        "/api/scheduled_maintenance"
      );

      this.scheduledMaintenance = maintenance ? new Date(maintenance) : null;
    },
  },
});
