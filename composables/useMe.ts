export function useMe() {
  const users = useUsers();
  const user = useSupabaseUser();

  return computed(() => users.getUserById(user.value?.id));
}