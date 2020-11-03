const EventEmitter = require("events");
const debug = require("debug")("discord-user-manager:DiscordAdapter");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const Discord = require("discord.js");

const { User } = require("../models");

class DiscordAdapter extends EventEmitter {
  constructor() {
    super();
    // Bind functions to class instance.
    this.log = this.log.bind(this);
    this.logInfo = this.logInfo.bind(this);
    this.logWarning = this.logWarning.bind(this);
    this.logError = this.logError.bind(this);
    this.logDebug = this.logDebug.bind(this);
    this.setNickname = this.setNickname.bind(this);
    this.addUser = this.addUser.bind(this);
    this.addRole = this.addRole.bind(this);
    this.removeRole = this.removeRole.bind(this);
    this.getGuild = this.getGuild.bind(this);
    this.banUser = this.banUser.bind(this);
    this.unban = this.unban.bind(this);
    this.isUserBanned = this.isUserBanned.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onMessageReactionAdd = this.onMessageReactionAdd.bind(this);
    this.onMessageReactionRemove = this.onMessageReactionRemove.bind(this);
    this.onGuildMemberAdd = this.onGuildMemberAdd.bind(this);
    this.onGuildMemberRemove = this.onGuildMemberRemove.bind(this);
    this.onGuildBanAdd = this.onGuildBanAdd.bind(this);
    this.onGuildBanRemove = this.onGuildBanRemove.bind(this);
    this.onReady = this.onReady.bind(this);
    this.destroy = this.destroy.bind(this);
    this.resolveChannel = this.resolveChannel.bind(this);
    this.resolveGuildMember = this.resolveGuildMember.bind(this);
    this.resolveRole = this.resolveRole.bind(this);
    this.resolveUser = this.resolveUser.bind(this);

    this.client = new Discord.Client({
      partials: ["MESSAGE", "CHANNEL", "REACTION"], // Allow partials (required for handling reactions on uncached messages)
    });
    this.client.commands = new Discord.Collection();
    this.client.reactions = new Discord.Collection();
    this.cooldowns = new Discord.Collection();

    this.client.once("ready", this.onReady);
    this.client.on("guildMemberAdd", this.onGuildMemberAdd);
    this.client.on("guildMemberRemove", this.onGuildMemberRemove);
    this.client.on("guildBanAdd", this.onGuildBanAdd);
    this.client.on("guildBanRemove", this.onGuildBanRemove);
    this.client.on("message", this.onMessage);
    this.client.on("messageReactionAdd", this.onMessageReactionAdd);
    this.client.on("messageReactionRemove", this.onMessageReactionRemove);
    // this.client.on("debug", this.logDebug); // Only enable this event if you need debug messages from the bot.
    this.client.on("warn", this.logWarning);
    this.client.on("error", this.logError);

    this.client.login(config.token);
  }

  onReady() {
    // Load commands.
    // This must be done after the constructor for DiscordAdapter is finished
    // otherwise commands and reactions that depend on DiscordAdapter will get
    // an incomplete object.
    const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(path.join(__dirname, "commands", file));
      debug(`Adding command: ${command.name}`);
      this.client.commands.set(command.name, command);
    }

    const reactionFiles = fs.readdirSync(path.join(__dirname, "reactions")).filter((file) => file.endsWith(".js"));

    for (const file of reactionFiles) {
      const reaction = require(path.join(__dirname, "reactions", file));
      debug(`Adding reaction: ${reaction.name}`);
      this.client.reactions.set(reaction.name, reaction);
    }

    this.logInfo(`
    Platform    : ${process.platform}
    Node version: ${process.version}`);

    this.logInfo("Ready!");
    // Emit the ready event (usefull for setup of test frameworks like Jest)
    this.emit("ready");
  }

  /**
   * Destroy the Log out of Discord.
   */
  async destroy() {
    await this.client.destroy();
  }

  /**
   *
   * @param {string} logLevel The log level. Can be "info", "warning", "error", or "debug"
   * @param {string|object|Array<string>} message The message to log.
   * @returns {Promise<Discord.Message|null>}
   */
  async log(logLevel) {
    const args = [...arguments].slice(1);
    const message = args
      .map((arg) => {
        switch (typeof arg) {
          case "string":
            return arg;
          case "object":
            return [...arg];
        }
      })
      .join(" ");

    // Also log a message to the console using the debug logger.
    debug("[%s]: %s", logLevel, message);

    const logColors = {
      info: "GREEN",
      warning: "ORANGE",
      error: "RED",
      debug: "BLUE",
    };

    try {
      const logChannel = await this.resolveChannel(config.logChannel);
      if (logChannel && logChannel.send) {
        const logMessage = new Discord.MessageEmbed()
          .setTitle(logLevel)
          .setColor(logColors[logLevel])
          .setDescription(message);

        return await logChannel.send(logMessage);
      }
    } catch (err) {
      debug(`An error occured while logging to the ${config.logChannel} channel: ${err}`);
    }
  }

  /**
   * Log an info message.
   * @param {string|object|Array<string>} message The message to log.
   * @returns {Promise<Discord.Message|null>} Return the Discord.Message that was sent, or null if the log channel was not found.
   */
  // eslint-disable-next-line no-unused-vars
  async logInfo(message) {
    return await this.log("info", arguments);
  }

  /**
   * Log a warning message.
   * @param {string|object|Array<string>} message The message to log.
   * @returns {Promise<Discord.Message|null>} Return the Discord.Message that was sent, or null if the log channel was not found.
   */
  // eslint-disable-next-line no-unused-vars
  async logWarning(message) {
    return await this.log("warning", arguments);
  }

  /**
   * Log an error message.
   * @param {string|object|Array<string>} message The message to log.
   * @returns {Promise<Discord.Message|null>} Return the Discord.Message that was sent, or null if the log channel was not found.
   */
  // eslint-disable-next-line no-unused-vars
  async logError(message) {
    return await this.log("error", arguments);
  }

  /**
   * Log a debug message.
   * @param {string|object|Array<string>} message The message to log.
   * @returns {Promise<Discord.Message|null>} Return the Discord.Message that was sent, or null if the log channel was not found.
   */
  // eslint-disable-next-line no-unused-vars
  async logDebug(message) {
    return await this.log("debug", arguments);
  }

  /**
   * Fired when a message is sent to the Bot (either as a DM or
   * through a text channel the Bot has access to)
   * @param {Discord.Message} message
   */
  async onMessage(message) {
    if (message.partial) {
      try {
        await message.fetch();
      } catch (err) {
        this.logError(`An error occured while fetching partial message: ${err}`);
        return message.reply(`An error occured while fetching partial message: ${err}`);
      }
    }

    if (!message.content.startsWith(config.prefix) || message.author.bot) {
      return;
    }

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Check for the command or an alias of the command.
    const command =
      this.client.commands.get(commandName) ||
      this.client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
      return message.reply(`The ${commandName} command is not one of the recognized commands.`);
    }

    // Check to see if this is a guild only command being executed outside of a guild.
    if (command.guildOnly && !message.guild) {
      return message.reply(`The \`${command.name}\` command can only be executed from within a guild server.`);
    }

    // Check if the author has permission to execute the command.
    if (command.permissions && message.guild) {
      const guildMember = message.guild.member(message.author);
      if (guildMember && !guildMember.hasPermission(command.permissions)) {
        return message.reply("You do not have the required permissions to execute that command.");
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
          `Please wait ${timeLeft} more second${timeLeft !== 1.0 ? "s" : ""} before executing the ${
            command.name
          } command again.`
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
      this.logDebug(`Processing command: ${command.name}`);
      command.execute(message, args);
    } catch (err) {
      this.logError(`There was an error executing the ${command.name} command: ${err}`);
      message.reply(`There was an error trying to execute the ${command.name} command: ${err}`);
    }
  }

  async onMessageReactionAdd(reaction, user) {
    // When we receive a reaction we check if the message is partial or not
    if (reaction.message.partial) {
      // If the message was removed the fetching might result in an API error, which we need to handle
      try {
        await reaction.message.fetch();
      } catch (err) {
        this.logError(`An error occure while fetching partial message: ${err}`);
        return;
      }
    }

    try {
      this.client.reactions.map((r) => {
        if (r.reactionAdd) {
          r.reactionAdd(reaction, user);
        }
      });
    } catch (err) {
      this.logError(`An error occured while processing reactions: ${err}`);
    }
  }

  async onMessageReactionRemove(reaction, user) {
    // When we receive a reaction we check if the message is partial or not
    if (reaction.message.partial) {
      // If the message was removed the fetching might result in an API error, which we need to handle
      try {
        await reaction.message.fetch();
      } catch (err) {
        this.logError(`An error occure while fetching partial message: ${err}`);
        return;
      }
    }

    try {
      this.client.reactions.map((r) => {
        if (r.reactionRemove) {
          r.reactionRemove(reaction, user);
        }
      });
    } catch (err) {
      this.logError(`An error occured while processing reactions: ${err}`);
    }
  }

  /**
   * Emitted whenever a user joins a guild.
   * @param {Discord.GuildMember} guildMember
   */
  async onGuildMemberAdd(guildMember) {
    this.logInfo(`${guildMember} has been added to the server.`);

    const user = await User.findOne({
      where: {
        discordId: guildMember.id,
      },
    });

    if (user) {
      // Update the guild member's nickname to match their given name.
      try {
        await guildMember.setNickname(user.name);
      } catch (err) {
        this.logError(`An error occured while setting the nickname for ${user.name}: ${err}`);
      }
    } else {
      this.logWarning(`${guildMember} was added to the server but was not found in the database.`);
    }
  }

  /**
   * Emitted whenever a member leaves a guild, or is kicked or banned.
   * @param {Discord.GuildMember} guildMember
   */
  async onGuildMemberRemove(guildMember) {
    this.logInfo(`${guildMember} was removed from the server.`);

    const user = await User.findOne({
      where: {
        discordId: guildMember.id,
      },
    });

    if (user) {
      // Remove the Discord related data from the user's record.
      await user.update({
        discordId: null,
        discordUsername: null,
        discordDiscriminator: null,
        discordAvatar: null,
      });
    }
  }

  async onGuildBanAdd(guild, user) {
    await this.logInfo(`${user} was banned.`);
  }

  async onGuildBanRemove(guild, user) {
    await this.logInfo(`${user} ban removed.`);
  }

  /**
   * Returns the Discord.Guild specified in the config file.
   * @returns {Discord.Guild}
   * @throws If the guild specified by the guildId in the config file was not found.
   */
  getGuild() {
    const guild = this.client.guilds.resolve(config.guildId);
    if (!guild) {
      throw new Error(`Guild with id ${config.guildId} was not found.`);
    }
    return guild;
  }

  /**
   * Resolve to a Discord.Channel
   * @param {Discord.ChannelResolvable} channelResolvable Data that can be resolved to give a Channel object.
   * @returns {Promise<Discord.Channel>} A Discord channel that was resolved or null if the channel couldn't be resolved.
   */
  async resolveChannel(channelResolvable) {
    let channel = null;
    let guild = this.getGuild();

    channel =
      guild.channels.resolve(channelResolvable) ||
      guild.channels.cache.find((guildChannel) => guildChannel.name === channelResolvable);

    if (!channel) {
      channel = this.client.channels.resolve(channelResolvable.id) || channelResolvable.channel;
    }

    return channel;
  }

  /**
   * Resolve to a Discord.User.
   * @param {Discord.UserResolvable} userResolvable Data that resolves to give a User object.
   * @returns {Promise<Discord.User>} The Discord.User that is resolved.
   * @throws If the userResolvable is of an unexpected type.
   */
  async resolveUser(userResolvable) {
    let user = null;
    switch (typeof userResolvable) {
      case "string":
        user = await this.client.users.fetch(userResolvable);
        break;
      case "object":
        user = userResolvable.user || userResolvable.owner || userResolvable.author || userResolvable;
        break;
    }

    return user;
  }

  /**
   * Resolve a Discord GuildMember.
   * @param {Discord.GuildMemberResolvable} guildMemberResolvable Either the ID of the Discord user (string) or the Discord.User, or the Discord.GuildMember to reslolve to the Discord.User.
   * @returns {Discord.GuildMember} The Discord.User that was resolved.
   * @throws If the guildMemberResolvable is not one of the expected types.
   */
  resolveGuildMember(guildMemberResolvable) {
    const guild = this.getGuild();
    let guildMember = null;
    switch (typeof guildMemberResolvable) {
      case "string":
        guildMember = guild.members.resolve(guildMemberResolvable);
        break;
      case "object":
        guildMember = guild.members.resolve(guildMemberResolvable.id);
        break;
    }

    return guildMember;
  }

  /**
   * Resolve a role name to a Discord.Role.
   * @param {Discord.RoleResolvable} roleResolvable Data that can be resolved to a Role object.
   * @returns {Discord.Role} The resolved role.
   */
  resolveRole(roleResolvable) {
    const guild = this.getGuild();
    if (!guild || !guild.available) {
      throw new Error("Guild is currently not available.");
    }

    let role = null;
    switch (typeof roleResolvable) {
      case "string":
        role = guild.roles.resolve(roleResolvable) || guild.roles.cache.find((role) => role.name === roleResolvable);
        break;
      case "object":
        role = guild.roles.resolve(roleResolvable.id);
        break;
    }

    return role;
  }

  /**
   * Get the URL of the welcome channel.
   * @returns {string} The URL of the welcome channel (see welcomeChannel in config.js)
   */
  async getWelcomeChannelURL() {
    const guild = this.getGuild();
    const channel = await this.resolveChannel(config.welcomeChannel);

    return `https://discordapp.com/channels/${guild.id}/${channel.id}`;
  }

  /**
   * Set the nickname of a guild user.
   * @param {Discord.UserResolvable|Discord.GuildMemberResolvable} userResolvable Data that resolves to a User or GuildMember object.
   * @param {string} nickname The nickname of the user.
   */
  async setNickname(userResolvable, nickname) {
    const guildMember = await this.resolveGuildMember(userResolvable);
    if (guildMember) {
      try {
        await guildMember.setNickname(nickname);
        this.logInfo(`Updated nickname for ${guildMember}`);
      } catch (err) {
        this.logError(`Could not set nickname (${nickname}) for ${guildMember}: ${err}`);
        throw err;
      }
    } else {
      this.logError(`Could not find ${userResolvable}`);
    }
  }

  /**
   * Add a user to the Discord server.
   * @param {Discord.UserResolvable|Discord.GuildMemberResolvable} userResolvable Data that resolves to a User or GuildMember object.
   * @param {string} nick The nickname of the user to add to the server.
   * @param {string} accessToken An OAuth2 access token for the user with the guilds.join scope granted to the bot's application.
   * @returns {Promise<Discord.GuildMember>} The GuildMember that was added to the server.
   * @throws If the userResolvable could not be resolved to a User or a GuildMember or if the nickname of the user couldn't be updated.
   */
  async addUser(userResolvable, nick, accessToken) {
    const guild = this.getGuild();
    if (!guild.available) {
      throw new Error("Guild is currently not available.");
    }

    const defaultRole = this.resolveRole(config.defaultRole) || guild.defaultRole;

    // First check if the user is already a member of the guild.
    let guildMember = await this.resolveGuildMember(userResolvable);

    if (guildMember) {
      this.logInfo(`User ${guildMember.user.tag} is already a member of the guild.`);
      // Just update the nickname.
      this.setNickname(userResolvable, nick);
    } else {
      // Discord user not a member of the guild yet.
      const discordUser = await this.resolveUser(userResolvable);
      if (!discordUser) {
        throw new Error(`User with id ${userResolvable.id || userResolvable} was not found.`);
      }

      // Add the member and set the nickname.
      try {
        guildMember = await guild.addMember(discordUser, {
          accessToken,
          nick,
          roles: [defaultRole.id],
        });
      } catch (err) {
        this.logError(`DiscordAdapter.addUser: Could not add ${nick} to the server: ${err}`);
        throw new Error(err);
      }
    }

    return guildMember;
  }

  /**
   * Remove a member from the Discord server.
   * @param {Discord.UserResolvable} userResolvable Data that resolves to a User or GuildMember object.
   * @param {string} reason Reason for kicking user.
   */
  async removeUser(userResolvable, reason = "Kicked by bot.") {
    const guildMember = await this.resolveGuildMember(userResolvable);

    if (!guildMember) {
      this.logWarning(`User ${userResolvable.id || userResolvable} not a member of the guild.`);
    } else {
      try {
        await guildMember.kick(reason);
      } catch (err) {
        this.logError(`An error occured while removing ${guildMember.tag}: ${err}`);
      }
    }
  }

  /**
   * Add a role to a Discord user.
   * @param {Discord.GuildMemberResolvable} guildMemberResolvable Data that resolves to give a GuildMember object.
   * @param {Discord.RoleResolvable} roleResolvable Either the name of the role or the Discord.Role to give to the user.
   * @throws If the user does not resolve to a guild member or the role does not resovle to a valid role.
   */
  async addRole(guildMemberResolvable, roleResolvable) {
    const guildMember = await this.resolveGuildMember(guildMemberResolvable);
    if (!guildMember) {
      throw new Error(`User ${guildMemberResolvable.id || guildMemberResolvable} is not a member of the guild.`);
    }

    const guildRole = await this.resolveRole(roleResolvable);
    if (!guildRole) {
      throw new Error(`Role ${roleResolvable} does not resolve to a valid guild role.`);
    }

    try {
      await guildMember.roles.add(guildRole.id);
      await this.logInfo(`${guildMember} has been added to role ${guildRole}`);
    } catch (err) {
      this.logError(`An error occured while adding ${guildMember.nickname} to role ${guildRole.name}: ${err}`);
    }
  }

  /**
   * Remove a role from a Discord user.
   * @param {Discord.GuildMemberResolvable} guildMemberResolvable Data that resolves to give a GuildMember object.
   * @param {Discord.RoleResolvable} roleResolvable Either the name of the role or the Discord.Role to remove from the user.
   * @throws If the user does not resolve to a guild member or the role does not resovle to a valid role.
   */
  async removeRole(guildMemberResolvable, roleResolvable) {
    const guildMember = await this.resolveGuildMember(guildMemberResolvable);
    if (!guildMember) {
      throw new Error(`User ${guildMemberResolvable.id || guildMemberResolvable} is not a member of the guild.`);
    }

    const guildRole = await this.resolveRole(roleResolvable);
    if (!guildRole) {
      throw new Error(`Role ${roleResolvable} does not resolve to a valid guild role.`);
    }

    try {
      await guildMember.roles.remove(guildRole.id);
      await this.logInfo(`${guildMember} has been removed from role ${guildRole}`);
    } catch (err) {
      this.logError(`An error occured while removing the role ${guildRole} from ${guildMember}: ${err}`);
    }
  }

  /**
   * Ban a user from the Discord server.
   * @param {Discord.UserResolvable} userResolvable Data that resolves to give a User object.
   * @param {string} reason Reason for banning.
   */
  async banUser(userResolvable, reason) {
    const guild = this.getGuild();
    if (guild && guild.available) {
      await guild.ban(userResolvable, {
        reason,
      });
    }
  }

  /**
   * Unban a user from the discord server.
   * @param {Discord.UserResolvable} userResolvable The user to unban.
   */
  async unban(userResolvable) {
    const guild = this.getGuild();
    if (guild && guild.available) {
      try {
        await guild.unban(userResolvable);
      } catch (err) {
        this.logError(`An error occured while unbanning user ${userResolvable}: ${err}`);
      }
    } else {
      this.logError(`Failed to unban user ${userResolvable}. Reason: Guild not available.`);
    }
  }

  /**
   * Check to see if a user is banned from the server.
   * @param {Discord.UserResolvable} userResolvable Data that resolves to give a User object.
   * @returns {string|null} The reason the user was banned or null if the user is not banned.
   */
  async isUserBanned(userResolvable) {
    const guild = this.getGuild();
    const user = await this.resolveUser(userResolvable);

    let ban = null;
    try {
      const bans = await guild.fetchBans();
      ban = bans.get(user.id);
    } catch (err) {
      this.logError(`Error fetching ban info: ${err}`);
    }

    return ban && ban.reason;
  }
}

module.exports = new DiscordAdapter();
