<template>
    <template v-if="me.status === Status.IDLE">
        <LoginForm v-if="isCapacitor" />
        <LandingPage v-else />
    </template>
    <StandardTemplate v-else>
        <UserDashboard />
    </StandardTemplate>
</template>

<script setup lang="ts">
import { Status } from "~/composables/useFetchStatus";
const me = useMe();
const isCapacitor = useRuntimeConfig().public.isCapacitorBuild;
</script>
