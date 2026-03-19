<template>
    <Button @click="login" icon="discord" color="discord" size="lg" wide>
        Login with Discord
    </Button>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const config = useRuntimeConfig();

async function login() {
    if (config.public.isCapacitorBuild) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                queryParams: { prompt: "none" },
                redirectTo: `${config.public.apiBaseUrl}/auth/mobile-callback`,
                skipBrowserRedirect: true,
            },
        });
        if (data?.url) {
            const { Browser } = await import("@capacitor/browser");
            await Browser.open({ url: data.url });
        }
    } else {
        await supabase.auth.signInWithOAuth({
            provider: "discord",
            options: {
                queryParams: { prompt: "none" },
                redirectTo: `${window.location.origin}`,
            },
        });
    }
}
</script>
