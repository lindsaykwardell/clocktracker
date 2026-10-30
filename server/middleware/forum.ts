import { isForumNewcomer } from "~/server/utils/forumSafety";
import { getFeatureFlags } from "~/server/utils/featureFlags";
import { createForumRequestGuard } from "~/server/utils/forumRequestGuard";
import { sharedLimit } from "~/server/utils/sharedRequestLimit";

// Runs after auth.ts. URL flags never grant API access.
export default createForumRequestGuard({
  enabled: async (event) => !!(await getFeatureFlags(event.context.user ?? null)).forum,
  consume: sharedLimit,
  newcomer: isForumNewcomer,
});
