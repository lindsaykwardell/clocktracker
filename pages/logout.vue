<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <Loading />
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
onMounted(async () => {
  await supabase.auth.signOut();
  router.push("/");
});
</script>
