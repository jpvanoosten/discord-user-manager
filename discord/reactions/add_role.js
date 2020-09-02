const debug = require("debug")("discord-user-manager:discord:reaction:add_role");
const DiscordAdapter = require("../DiscordAdapter");
const config = require("../config");

module.exports = {
  name: "add_role",
  description:
    "Add/Remove a role from a user when a reaction is added or removed from a message in the welcome channel.",
  guildOnly: true,
  // Executed when a reaction is added.
  reactionAdd: async (reaction, user) => {
    const channel = await DiscordAdapter.resolveChannel(reaction.message.channel);

    // Check to see if the channel matches the welcome channel.
    if (channel && channel.name && channel.name === config.welcomeChannel) {
      // Check if there is a corresponding role for the emoji in the reaction:
      const roleName = config.roles[reaction.emoji.name];
      if (roleName) {
        try {
          await DiscordAdapter.addRole(user, roleName);
        } catch (err) {
          debug(`An error occured while adding role ${roleName} to ${user.tag}: ${err}`);
        }
      } else {
        debug(`No configured role for emoji ${reaction.emoji.name}.`);
      }
    }
  },
  // Executed when a reaction is removed.
  reactionRemove: async (reaction, user) => {
    const channel = await DiscordAdapter.resolveChannel(reaction.message.channel);

    // Check to see if the channel matches the welcome channel.
    if (channel && channel.name && channel.name === config.welcomeChannel) {
      // Check if there is a corresponding role for the emoji in the reaction:
      const roleName = config.roles[reaction.emoji.name];
      if (roleName) {
        try {
          await DiscordAdapter.removeRole(user, roleName);
        } catch (err) {
          debug(`An error occured while adding role ${roleName} to ${user.tag}: ${err}`);
        }
      } else {
        debug(`No configured role for emoji ${reaction.emoji.name}.`);
      }
    }
  },
};
