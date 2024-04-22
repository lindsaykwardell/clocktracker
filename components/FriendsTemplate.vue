<template>
  <StandardTemplate>
    <template v-if="shouldRenderFriendsPage">
      <div class="flex gap-4 xl:max-w-[1200px] m-auto mt-4">
        <nav
          class="flex flex-col md:w-[300px] w-[100px] min-w-[100px] md:min-w-[300px] items-center"
        >
          <ul class="w-full sticky top-16 md:top-4">
            <li class="w-full bg-stone-300 dark:bg-stone-700">
              <nuxt-link
                to="/friends"
                class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
                active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
              >
                My Friends
              </nuxt-link>
              <nuxt-link
                to="/friends/requests"
                class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
                active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
              >
                Friend Requests
              </nuxt-link>
              <nuxt-link
                to="/friends/suggested"
                class="block w-full p-2 hover:bg-stone-200 dark:hover:bg-stone-900 duration-150"
                active-class="bg-stone-200 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-950"
              >
                Suggested Friends
              </nuxt-link>
            </li>
          </ul>
        </nav>
        <section class="flex-grow">
          <slot
            :friends="
              friends.friends.status === Status.SUCCESS
                ? friends.friends.data
                : []
            "
            :requests="
              friends.requests.status === Status.SUCCESS
                ? friends.requests.data
                : []
            "
            :suggested="
              friends.recommended.status === Status.SUCCESS
                ? friends.recommended.data
                : []
            "
          />
        </section>
      </div>
    </template>
    <template v-else>
      <div class="flex justify-center items-center h-[100vh]">
        <Loading />
      </div>
    </template>
  </StandardTemplate>
</template>

<script setup lang="ts">
const friends = useFriends();

const props = defineProps<{
  fetchFriends: boolean;
  fetchRequests: boolean;
  fetchSuggested: boolean;
}>();

const shouldRenderFriendsPage = computed(() => {
  let shouldRender = true;

  if (props.fetchFriends && friends.friends.status !== Status.SUCCESS)
    shouldRender = false;

  if (props.fetchRequests && friends.requests.status !== Status.SUCCESS)
    shouldRender = false;

  if (props.fetchSuggested && friends.recommended.status !== Status.SUCCESS)
    shouldRender = false;

  if (!props.fetchFriends && !props.fetchRequests && !props.fetchSuggested)
    shouldRender = false;

  return shouldRender;
});

onMounted(() => {
  if (props.fetchFriends) friends.fetchFriends();
  if (props.fetchRequests) friends.fetchRequests();
  if (props.fetchSuggested) friends.fetchRecommended();
});
</script>
