const debug = require("debug")("discord-user-manager:discord:commands:prune");
const discord = require("discord.js");

module.exports = {
  name: "prune",
  description: "Prune a number of messages from the current channel.",
  args: true,
  usage: "<amount>",
  permissions: [discord.Permissions.FLAGS.MANAGE_MESSAGES],
  guildOnly: false,
  cooldown: 10,
  execute: async (message, args) => {
    let amount = parseInt(args[0]);
    const channel = message.channel;
    switch (channel.type) {
      case "text":
      case "news":
        if (isNaN(amount)) {
          debug(`${amount} is not a valid number.`);
          return message.reply(`${args[0]} is not a valid number.`);
        }

        // Can only delete between 2 and 100 messages.
        amount = Math.min(amount, 100);
        if (amount > 0) {
          try {
            const deletedMessages = await channel.bulkDelete(Math.min(amount + 1, 100), true);
            message.reply(`${deletedMessages.size} message${deletedMessages.size !== 1 ? "s" : ""} deleted.`);
          } catch (err) {
            debug(`Error occured while delete channel messages: ${err}`);
            message.reply(`An error occured while executing command: ${err}`);
          }
          amount -= 100;
        } else {
          message.reply(`Cannot delete ${amount} messages.`);
        }
        break;
      default:
        debug(`Invalid channel type (${channel.type}) for prune command.`);
        message.reply(`Invalid channel type (${channel.type}) for prune command.`);
    }
  },
};
