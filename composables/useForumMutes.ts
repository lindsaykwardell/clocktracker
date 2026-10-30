export function useForumMutes() {
  const user = useUser();
  const key = user.value?.id ?? "anonymous";
  const muted = useState<Record<string, boolean>>(`forum-mutes-${key}`, () => ({}));
  const loaded = useState(`forum-mutes-loaded-${key}`, () => !user.value);
  const loading = useState(`forum-mutes-loading-${key}`, () => false);
  const error = useState(`forum-mutes-error-${key}`, () => false);
  async function refresh() {
    if (loading.value || !user.value) return;
    loading.value = true;
    error.value = false;
    try {
      const preferences = await $fetch('/api/forum/preferences');
      muted.value = Object.fromEntries(preferences.map(item => [item.target_id, true]));
      loaded.value = true;
    } catch { error.value = true; }
    finally { loading.value = false; }
  }
  onMounted(() => { if (!loaded.value) refresh(); });
  return { muted, loaded, error, refresh };
}
