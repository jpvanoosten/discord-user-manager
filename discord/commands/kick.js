const debug = require("debug")("discord-user-manager:discord:commands:kick");
const discord = require("discord.js");

module.exports = {
  name: "kick",
  aliases: ["k"],
  description: "Kick a user from the Discord guild server.",
  args: true,
  usage: "<guildUser>",
  permissions: [discord.Permissions.FLAGS.KICK_MEMBERS],
  guildOnly: true,
  cooldown: 1,
  execute: async (message) => {
    if (!message.mentions.users.size) {
      return message.reply("No user mentioned in kick command.");
    }

    const user = message.mentions.users.first();
    if (user === message.author) {
      return message.reply("You can't kick yourself.");
    }

    const member = message.guild.member(user);
    if (member) {
      try {
        await member.kick("Kicked by bot kick command.");
        message.reply(`Successfully kicked ${user.tag}`);
      } catch (err) {
        debug(err);
        message.reply(`Unable to kick ${user.tag}`);
      }
    } else {
      message.reply(`User ${user.tag} is not a guild member.`);
    }
  },
};
