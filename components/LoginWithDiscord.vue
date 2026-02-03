<template>
    <Button @click="login" icon="discord" color="discord" size="lg" wide>
        Login with Discord
    </Button>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();

async function login() {
    await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
            queryParams: { prompt: "none" },
            redirectTo: `${window.location.origin}`,
        },
    });
}
</script>
