import { roleOfTheDay } from "../utils/roleOfTheDay";

export default defineEventHandler(async (handler) => {
  return roleOfTheDay();
});
