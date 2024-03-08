<template>
  <StandardTemplate>
    <template v-if="me.status === Status.SUCCESS">
      
    </template>
    <template v-else-if="me.status === Status.ERROR"> </template>
    <template v-else>
      <div class="flex h-screen justify-center items-center">
        <Loading />
      </div>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
const users = useUsers();
const user = useSupabaseUser();

const me = computed(() => {
  return users.getUserById(user.value?.id);
});
</script>
