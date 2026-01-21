import { User } from "@supabase/supabase-js";
import { getFeatureFlags } from "../utils/featureFlags";

export default defineEventHandler(async (handler) => {
  try {
    const me: User | null = handler.context.user;
    const flags = await getFeatureFlags(me);
    return flags || {};
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    return {};
  }
});
