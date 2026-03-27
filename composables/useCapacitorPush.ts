const fcmToken = ref<string | null>(null);

export function useCapacitorPush() {
  function setToken(token: string | null) {
    fcmToken.value = token;
  }

  return {
    fcmToken: readonly(fcmToken),
    setToken,
  };
}
