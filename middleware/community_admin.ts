export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser();
  const communities = useCommunities();
  const route = useRoute();
  const slug = route.params.slug as string;
  const community = communities.getCommunity(slug);

  if (!user.value) {
    return navigateTo("/");
  }

  if (community?.status !== Status.SUCCESS) {
    await communities.fetchCommunity(slug);
  }

  if (community?.status === Status.SUCCESS) {
    if (
      !community.data.admins.some((admin) => admin.user_id === user.value?.id)
    ) {
      return navigateTo(`/community/${slug}`);
    }
  }
});
