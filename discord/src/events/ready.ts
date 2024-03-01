const { Events } = require("discord.js");

export const name = Events.ClientReady;
export const once = true;
export function execute(client) {
  console.log(`Ready! Logged in as ${client.user.tag}`);
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
