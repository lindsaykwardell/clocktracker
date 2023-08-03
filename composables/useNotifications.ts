import type { User } from "@supabase/supabase-js";
import type { Notification } from "@prisma/client";
import { defineStore } from "pinia";

export const useNotifications = defineStore("notifications", {
  state: () => ({
    notifications: [] as (Notification & {
      from_user: { username: string; display_name: string; avatar: string };
    })[],
  }),
  getters: {
    unreadNotificationCount(): number {
      return this.notifications?.filter((n) => !n.read).length || 0;
    },
  },
  actions: {
    async fetchNotifications() {
      const notifications = await $fetch("/api/notifications");

      this.notifications = notifications as (Notification & {
        from_user: { username: string; display_name: string; avatar: string };
      })[];
    },
    pollNotifications() {
      // Every ten seconds, call fetchNotifications
      // Return a stop function that can be called to stop polling
      const interval = setInterval(() => {
        this.fetchNotifications();
      }, 10000);

      return () => {
        clearInterval(interval);
      };
    },
    async markAsRead() {
      const response = await useFetch("/api/notifications", {
        method: "POST",
      });

      if (response.data.value === true) {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          read: true,
        }));
      }
    },
  },
});
