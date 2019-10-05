const debug = require("debug")("discord-user-manager:discord:kick");
const discord = require("discord.js");

module.exports = {
  name: "kick",
  description: "Kick a user from the discord server.",
  args: true,
  usage: "<user>",
  permissions: [discord.Permissions.FLAGS.KICK_MEMBERS],
  guildOnly: true,
  execute(message, args) {
    if (!message.mentions.users.size) {
      return message.reply("No user mentioned in kick command.");
    }

    const user = message.mentions.users.first();
    if (user === message.author) {
      return message.reply("You can't kick yourself.");
    }

    const member = message.guild.member(user);
    if (member) {
      member
        .kick("Kicked by bot kick command.")
        .then(() => {
          message.reply(`Successfully kicked ${user.tag}`);
        })
        .catch(err => {
          debug(err);
          message.reply(`Unable to kick ${user.tag}`);
        });
    } else {
      message.reply(`User ${user.tag} is not a guild member.`);
    }
  }
};
