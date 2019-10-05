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

    if (!this.client.commands.has(commandName)) {
      return message.reply(
        `The ${commandName} command is not one of the recognized commands.`
      );
    }

    const command = this.client.commands.get(commandName);

    // Check if the author has permission to execute the command.
    if (command.permissions) {
      const guildMember = message.guild.member(message.author);
      if (guildMember && !guildMember.hasPermissions(command.permissions)) {
        return message.reply(
          "You do not have the required permissions to execute that command."
        );
      }
    }

    if (command.args && !args.length) {
      let errorMessage = `The ${command.name} command expects arguments.`;
      if (command.usage) {
        errorMessage += `\nExpected usage: ${config.prefix}${command.name} ${command.usage}`;
      }
      return message.reply(errorMessage);
    }

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
