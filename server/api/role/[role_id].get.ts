import { roleStats } from "~/server/utils/stats";

export default defineEventHandler(async (handler) => {
  const role_id = handler.context.params?.role_id as string;

  const stats = await roleStats(role_id);

  return {
    ...stats,
    popular_scripts: stats.popular_scripts.slice(0, 10),
  };
});
