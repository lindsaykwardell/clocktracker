import type { Role } from "@prisma/client";
import { defineStore } from "pinia";

export enum RoleType {
  TOWNSFOLK = "TOWNSFOLK",
  OUTSIDER = "OUTSIDER",
  MINION = "MINION",
  DEMON = "DEMON",
  TRAVELER = "TRAVELER",
  FABLED = "FABLED",
}

export const useRoles = defineStore("roles", {
  state: () => ({
    roles: new Map<string, Role>(),
  }),
  getters: {
    getRole(): (roleId: string) => Role | undefined {
      return (roleId: string) => {
        return this.roles.get(roleId.toLowerCase());
      };
    },
    getRoleByType(): (roleType: RoleType) => Role[] {
      return (roleType: RoleType) => {
        return Array.from(this.roles.values()).filter(
          (role) => role.type === roleType
        );
      };
    },
    getAllRoles(): Role[] {
      return Array.from(this.roles.values());
    },
  },
  actions: {
    async fetchRoles() {
      if (this.roles.size > 0) {
        return;
      }

      const roles = await $fetch("/api/roles");
      for (const role of roles) {
        this.roles.set(role.id.toLowerCase(), role);
      }
    },
  },
});
