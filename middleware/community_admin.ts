export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const communities = useCommunities();
  const slug = to.params.slug as string;
  const community = communities.getCommunity(slug);

  if (!user.value) {
    return navigateTo("/");
  }

  if (community?.status !== Status.SUCCESS) {
    await communities.fetchCommunity(slug);
  }

  if (community?.status === Status.SUCCESS) {
    if (
      !community.data.admins.some((admin) => admin.user_id === user.value?.sub)
    ) {
      return navigateTo(`/community/${slug}`);
    }
  }
});
