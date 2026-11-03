export function useMe() {
  const users = useUsers();
  const user = useUser();

  return computed(() => users.getUserById(user.value?.id));
}