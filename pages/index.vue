<template>
  <LandingPage v-if="me.status === Status.IDLE" />
  <StandardTemplate v-else>
    <UserDashboard />
  </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
const me = useMe();
</script>
