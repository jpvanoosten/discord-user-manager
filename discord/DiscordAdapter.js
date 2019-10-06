const debug = require("debug")("discord-user-manager:DiscordAdapter");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const Discord = require("discord.js");

class DiscordAdapter {
  constructor() {
    this.onReady = this.onReady.bind(this);
    this.onMessage = this.onMessage.bind(this);

    this.client = new Discord.Client();
    this.client.commands = new Discord.Collection();
    this.cooldowns = new Discord.Collection();

    const commandFiles = fs
      .readdirSync(path.join(__dirname, "commands"))
      .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`);
      debug(`Adding command: ${command.name}`);
      this.client.commands.set(command.name, command);
    }

    this.client.once("ready", this.onReady);
    this.client.on("message", this.onMessage);

    this.client.login(config.token);
  }

  onReady() {
    debug("Ready!");
  }

  onMessage(message) {
    if (!message.content.startsWith(config.prefix) || message.author.bot) {
      return;
    }

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check for the command or an alias of the command.
    const command =
      this.client.commands.get(commandName) ||
      this.client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (!command) {
      return message.reply(
        `The ${commandName} command is not one of the recognized commands.`
      );
    }

    // Check to see if this is a guild only command being executed outside of a guild.
    if (command.guildOnly && !message.guild) {
      return message.reply(
        `The \`${command.name}\` command can only be executed from within a guild server.`
      );
    }

    // Check if the author has permission to execute the command.
    if (command.permissions) {
      const guildMember = message.guild.member(message.author);
      if (guildMember && !guildMember.hasPermission(command.permissions)) {
        return message.reply(
          "You do not have the required permissions to execute that command."
        );
      }
    }

    // Check if the command is on cooldown
    // source: https://discordjs.guide/command-handling/adding-features.html#cooldowns
    if (!this.cooldowns.has(command.name)) {
      this.cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = this.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 0) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return message.reply(
          `Please wait ${timeLeft} more second${
            timeLeft !== 1.0 ? "s" : ""
          } before executing the ${command.name} command again.`
        );
      }
    }

    if (cooldownAmount > 0) {
      // Set the timestamp and delete it when the cooldown expires.
      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    // Check if the command has any arguments.
    if (command.args && !args.length) {
      let errorMessage = `The ${command.name} command expects arguments.`;
      if (command.usage) {
        errorMessage += `\nExpected usage: ${config.prefix}${command.name} ${command.usage}`;
      }
      return message.reply(errorMessage);
    }

    // Try to execute the command.
    try {
      debug(`Processing command: ${command.name}`);
      command.execute(message, args);
    } catch (err) {
      debug(err);
      message.reply(
        `There was an error trying to execute the ${command.name} command: ${err}`
      );
    }
  }
}

module.exports = new DiscordAdapter();
