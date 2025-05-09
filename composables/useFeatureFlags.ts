import { defineStore } from "pinia";
import { useRoute } from "#app"; // Nuxt 3 auto-import for vue-router's useRoute

export const useFeatureFlags = defineStore("featureFlags", {
  state: (): {
    flags: Map<string, boolean>;
    scheduledMaintenance: Date | null;
  } => ({
    flags: new Map<string, boolean>(),
    scheduledMaintenance: null,
  }),
  getters: {
    isEnabled(state): (flagName: string) => boolean {
      return (flagName: string): boolean => {
        // 1. Check if the flag is enabled via API (already in state.flags)
        const apiEnabled = state.flags.get(flagName) || false;

        // 2. Check if the flag is enabled via URL query parameter
        const route = useRoute();
        let urlEnabled = false;
        const featureFlagsQuery = route.query.featureFlags;

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

        return apiEnabled || urlEnabled;
      };
    },
    maintenanceIsScheduled(state): false | Date {
      return state.scheduledMaintenance ?? false;
    },
  },
  actions: {
    async init() {
      const { data, error } = await useFetch<{ [key: string]: boolean } | null>(
        "/api/feature_flags"
      );

      if (error.value) {
        console.error("Error fetching feature flags:", error.value);
        return;
      }

      this.flags.clear(); // Clear existing flags before setting new ones
      if (data.value) {
        // Check if data.value is not null or undefined
        for (const [key, value] of Object.entries(data.value)) {
          this.flags.set(key, value);
        }
      }
    },
    async fetchScheduledMaintenance() {
      const { data: maintenance, error: maintenanceError } = await useFetch<
        string | null
      >("/api/scheduled_maintenance");

      if (maintenanceError.value) {
        console.error(
          "Error fetching scheduled maintenance:",
          maintenanceError.value
        );
        return;
      }

      this.scheduledMaintenance = maintenance.value
        ? new Date(maintenance.value)
        : null;
    },
  },
});
