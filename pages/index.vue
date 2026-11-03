<template>
  <LandingPage v-if="me.status === Status.IDLE && !isCapacitor" />
  <StandardTemplate v-else-if="me.status !== Status.IDLE">
    <UserDashboard />
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
const me = useMe();
const config = useRuntimeConfig();
const isCapacitor = config.public.isCapacitorBuild;

// On Capacitor, redirect to login if not authenticated
if (isCapacitor && me.value.status === Status.IDLE) {
  navigateTo("/login", { replace: true });
}
</script>
