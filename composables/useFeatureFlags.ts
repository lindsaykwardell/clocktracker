import { defineStore } from "pinia";

export const useFeatureFlags = defineStore("featureFlags", {
  state: () => ({
    flags: new Map<string, boolean>(),
  }),
  getters: {
    isEnabled(): (flag: string) => boolean {
      return (flag: string): boolean => {
        return this.flags.get(flag) || false;
      };
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
  },
});
