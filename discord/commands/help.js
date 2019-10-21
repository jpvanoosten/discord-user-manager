const debug = require("debug")("discord-user-manager:discord:commands:help");
const discord = require("discord.js");
const { prefix } = require("../config");

// Function to convert an enum value to the enum string.
function enumToString(e, enumValue) {
  for (const k in e) {
    if (e[k] === enumValue) {
      return k;
    }
  }
  return null;
}

module.exports = {
  name: "help",
  description: "List all of the commands or info about a specific command.",
  aliases: ["h", "commands"],
  usage: "[command name]",
  cooldown: 5,
  execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      data.push("This is a list of the commands:");
      data.push(commands.map(command => `\`${command.name}\``).join(", "));
      data.push(
        `\nYou can use \`${prefix}help [command name]\` to get info on a specific command.`
      );

      return message.author
        .send(data, {
          split: true
        })
        .then(() => {
          if (message.channel.type === "dm") return;
          message.reply("I've sent you a DM with all of the commands.");
        })
        .catch(err => {
          debug(`Could not send help DM to ${message.author.tag}: ${err}`);
          message.reply(
            "I tried to DM you with the commands, but something went wrong. Did you disable DM's?"
          );
        });
    }

    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find(c => c.aliases && c.aliases.includes(name));

    if (!command) {
      return message.reply(
        `\`${name}\` is not one of the recognized commands.`
      );
    }

    data.push(`**Name:** \`${command.name}\``);

    if (command.aliases) {
      data.push(`**Aliases:** \`${command.aliases.join(", ")}\``);
    }
    if (command.description) {
      data.push(`**Description:** ${command.description}`);
    }
    if (command.permissions && command.permissions.length) {
      data.push(
        `**Required Permissions:** ${command.permissions
          .map(
            permission =>
              `\`${enumToString(discord.Permissions.FLAGS, permission)}\``
          )
          .join(", ")}`
      );
    }
    if (command.usage) {
      data.push(`**Usage:** \`${prefix}${command.name} ${command.usage}\``);
    }
    if (command.cooldown) {
      data.push(
        `**Cooldown:** ${command.cooldown} second${
          command.cooldown !== 1 ? "s" : ""
        }.`
      );
    }
    if (command.guildOnly) {
      data.push("> This command may only be used within a guild server.");
    }

    message.channel.send(data, { split: true });
  }
};
