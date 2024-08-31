export function useDids() {
  const me = useMe();

  const dids = computed(() => {
    if (me.value.status !== Status.SUCCESS) return [];

    return me.value.data.dids || [];
  });

  async function did(did: string) {
    if (me.value.status !== Status.SUCCESS) return;

    const done = await $fetch(`/api/did/${did}`, {
      method: "POST",
    });

    me.value.data.dids?.push(done);
  }

  function isDone(did: string): boolean {
    if (me.value.status !== Status.SUCCESS) return false;

    return me.value.data.dids?.some((d) => d.did === did) || false;
  }

  return { dids, did, isDone };
}
