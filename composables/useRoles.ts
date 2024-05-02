import type { Role, RoleReminder } from "@prisma/client";
import { defineStore } from "pinia";

export enum RoleType {
  TOWNSFOLK = "TOWNSFOLK",
  OUTSIDER = "OUTSIDER",
  MINION = "MINION",
  DEMON = "DEMON",
  TRAVELER = "TRAVELER",
  FABLED = "FABLED",
}

export type RoleRecord = Omit<Role, "type"> & {
  type: RoleType;
  reminders: RoleReminder[];
};

export const useRoles = defineStore("roles", {
  state: () => ({
    roles: new Map<string, RoleRecord>(),
  }),
  getters: {
    getRole(): (roleId: string) => RoleRecord | undefined {
      return (roleId: string) => {
        return this.roles.get(roleId.toLowerCase());
      };
    },
    getRoleByType(): (
      roleType: RoleType,
      includeCustom?: boolean
    ) => RoleRecord[] {
      return (roleType: RoleType, includeCustom: boolean = false) => {
        return Array.from(this.roles.values()).filter(
          (role) =>
            role.type === roleType && (includeCustom || !role.custom_role)
        );
      };
    },
    getAllRoles(): (includeCustom?: boolean) => RoleRecord[] {
      return (includeCustom: boolean = false) => {
        return Array.from(this.roles.values()).filter(
          (role) => includeCustom || !role.custom_role
        );
      };
    },
    getRemindersForRoles(): (
      roleIds: string[]
    ) => (RoleReminder & { token_url: string })[] {
      return (roleIds: string[]) =>
        Array.from(this.roles.values())
          .filter((role) => roleIds.includes(role.id))
          .reduce(
            (reminders, role) => [
              ...reminders,
              ...role.reminders.map((reminder) => ({
                ...reminder,
                token_url: role.token_url,
              })),
            ],
            [] as (RoleReminder & { token_url: string })[]
          );
    },
  },
  actions: {
    async fetchRoles() {
      if (this.roles.size > 0) {
        return;
      }

      const roles = await $fetch<RoleRecord[]>("/api/roles");
      for (const role of roles) {
        this.roles.set(role.id.toLowerCase(), role);
      }
    },
  },
});
