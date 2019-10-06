const debug = require("debug")("discord-user-manager:DiscordAdapter");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const Discord = require("discord.js");

const { User } = require("../models");

// Raw events to handle.
const rawEvents = {
  MESSAGE_REACTION_ADD: "messageReactionAdd",
  MESSAGE_REACTION_REMOVE: "messageReactionRemove"
};

class DiscordAdapter {
  constructor() {
    this.onReady = this.onReady.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onMessageReactionAdd = this.onMessageReactionAdd.bind(this);
    this.onMessageReactionRemove = this.onMessageReactionRemove.bind(this);
    this.onGuildMemberAdd = this.onGuildMemberAdd.bind(this);
    this.onGuildMemberRemove = this.onGuildMemberRemove.bind(this);
    this.addUser = this.addUser.bind(this);

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
    this.client.on("messageReactionAdd", this.onMessageReactionAdd);
    this.client.on("messageReactionRemove", this.onMessageReactionRemove);
    this.client.on("guildMemberAdd", this.onGuildMemberAdd);
    this.client.on("guildMemberRemove", this.onGuildMemberRemove);

    this.client.login(config.token);
  }

  onReady() {
    debug("Ready!");
  }

  /**
   * Fired when a message is sent to the Bot (either as a DM or
   * through a text channel the Bot has access to)
   * @param {Discord.Message} message
   */
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

  onMessageReactionAdd(reaction, user) {
    debug(`${user.username} reacted with ${reaction.emoji.name}.`);
  }

  onMessageReactionRemove(reaction, user) {
    debug(`${user.username} removed their ${reaction.emoji.name} reaction.`);
  }

  /**
   * Emitted whenever a user joins a guild.
   * @param {Discord.GuildMember} guildMember
   */
  async onGuildMemberAdd(guildMember) {
    debug(`Adding guild member: ${guildMember.user.tag}`);

    const user = await User.findOne({
      where: {
        discordId: guildMember.id
      }
    });

    if (user) {
      // Update the guild member's nickname to match their given name.
      await guildMember.setNickname(user.name);
    } else {
      debug(
        `Guild member ${guildMember.user.tag} was not found in the database.`
      );
    }
  }

  /**
   * Emitted whenever a member leaves a guild, or is kicked.
   * @param {Discord.GuildMember} guildMember
   */
  async onGuildMemberRemove(guildMember) {
    debug(`Removing guild member: ${guildMember.user.tag}`);

    const user = await User.findOne({
      where: {
        discordId: guildMember.id
      }
    });

    if (user) {
      // Remove the Discord related data from the user's record.
      await user.update({
        discordId: null,
        discordAccessToken: null,
        discordUsername: null,
        discordDiscriminator: null,
        discordAvatar: null
      });
    }
  }

  // Handle raw events.
  // source: https://discordjs.guide/popular-topics/reactions.html#listening-for-reactions-on-old-messages
  async onRaw(event) {
    // Ignore any raw events not specified in the rawEvents object
    if (!Object.prototype.hasOwnProperty.call(rawEvents, event.t)) return;

    // Use destructring to extract the event data.
    const { d: data } = event;
    const user = this.client.users.get(data.user_id);
    const channel =
      this.client.channels.get(data.channel_id) || (await user.createDM());

    // Ignore cached messages.
    // Without this, reaction events would execute twice for a single
    // reaction if the message was already cached.
    if (channel.messages.has(data.message_id)) return;

    const message = await channel.messages.fetch(data.message_id);
    const emojiKey = data.emoji.id || data.emoji.name;
    const reaction =
      message.reactions.get(emojiKey) || message.reactions.add(data);

    this.client.emit(rawEvents[event.t], reaction, user);
    if (message.reactions.size === 1) message.reactions.delete(emojiKey);
  }

  /**
   * Add a user to the Discord server. The
   * @param {string} discordId The ID of the discord user to add.
   * @param {string} nick The nickname of the user to add to the server.
   * @param {string} accessToken An OAuth2 access token for the user with the guilds.join scope granted to the bot's application.
   * @returns {Promise<Discord.GuildMember>} The GuildMember that is added to the server.
   */
  async addUser(discordId, nick, accessToken) {
    const guild = this.client.guilds.get(config.guildId);
    if (!guild || !guild.available) {
      throw new Error("Guild is currently not available.");
    }
    const defaultRole =
      guild.roles.find(role => role.name === config.defaultRole) ||
      guild.defaultRole;
    let guildMember = guild.members.find(
      guildMember => guildMember.id === discordId
    );

    if (guildMember) {
      debug(`User ${guildMember.user.tag} already in the server.`);
      await guildMember.setNickname(nick);
    } else {
      // Discord user not a member of the guild yet. Add the member and set
      // the nickname.
      const user = await this.client.fetchUser(discordId);
      if (!user) {
        throw new Error(`User with id ${discordId} was not found.`);
      }

      debug(`Adding user ${user.tag}.`);

      guildMember = await guild.addMember(user, {
        accessToken,
        nick,
        roles: [defaultRole]
      });
    }

    return guildMember;
  }
}

module.exports = new DiscordAdapter();
