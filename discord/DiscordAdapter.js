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
    this.addUser = this.addUser.bind(this);
    this.addRole = this.addRole.bind(this);
    this.getGuild = this.getGuild.bind(this);
    this.banUser = this.banUser.bind(this);
    this.unban = this.unban.bind(this);
    this.isUserBanned = this.isUserBanned.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onMessageReactionAdd = this.onMessageReactionAdd.bind(this);
    this.onMessageReactionRemove = this.onMessageReactionRemove.bind(this);
    this.onGuildMemberAdd = this.onGuildMemberAdd.bind(this);
    this.onGuildMemberRemove = this.onGuildMemberRemove.bind(this);
    this.onReady = this.onReady.bind(this);
    this.destroy = this.destroy.bind(this);
    this.resolveChannel = this.resolveChannel.bind(this);
    this.resolveGuildMember = this.resolveGuildMember.bind(this);
    this.resolveRole = this.resolveRole.bind(this);
    this.resolveUser = this.resolveUser.bind(this);

    this.client = new Discord.Client({
      partials: ["MESSAGE", "CHANNEL"] // Allow partials (required for handling reactions on uncached messages)
    });
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
    this.client.on("guildMemberAdd", this.onGuildMemberAdd);
    this.client.on("guildMemberRemove", this.onGuildMemberRemove);
    this.client.on("message", this.onMessage);
    this.client.on("messageReactionAdd", this.onMessageReactionAdd);
    this.client.on("messageReactionRemove", this.onMessageReactionRemove);

    this.client.login(config.token);
  }

  onReady() {
    debug("Ready!");
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
   * Fired when a message is sent to the Bot (either as a DM or
   * through a text channel the Bot has access to)
   * @param {Discord.Message} message
   */
  async onMessage(message) {
    if (message.partial) {
      try {
        await message.fetch();
      } catch (err) {
        debug(`An error occured while fetching partial message: ${err}`);
        return message.reply(
          `An error occured while fetching partial message: ${err}`
        );
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
    if (command.permissions && message.guild) {
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

  async onMessageReactionAdd(reaction, user) {
    // When we receive a reaction we check if the message is partial or not
    if (reaction.message.partial) {
      // If the message was removed the fetching might result in an API error, which we need to handle
      try {
        await reaction.message.fetch();
      } catch (err) {
        debug(`An error occure while fetching partial message: ${err}`);
        return;
      }
    }

    // Check if there is a corresponding role for the emoji in the reaction:
    const roleName = config.roles[reaction.emoji.name];
    if (roleName) {
      const role = this.resolveRole(roleName);
      if (role) {
        const guildMember = this.resolveGuildMember(user);
        if (guildMember) {
          try {
            await guildMember.roles.add(
              role,
              `User added ${reaction.emoji.name} reaction.`
            );
          } catch (err) {
            debug(
              `An error occured while adding role ${roleName} to ${guildMember.nickname}: ${err}`
            );
          }
        } else {
          debug(`${user.username} not a guild member.`);
        }
      } else {
        debug(`No role with name ${roleName}.`);
      }
    } else {
      debug(`No configured role for emoji ${reaction.emoji.name}.`);
    }
  }

  async onMessageReactionRemove(reaction, user) {
    // When we receive a reaction we check if the message is partial or not
    if (reaction.message.partial) {
      // If the message was removed the fetching might result in an API error, which we need to handle
      try {
        await reaction.message.fetch();
      } catch (err) {
        debug(`An error occure while fetching partial message: ${err}`);
        return;
      }
    }

    // Check if there is a corresponding role for the emoji in the reaction:
    const roleName = config.roles[reaction.emoji.name];
    if (roleName) {
      const role = this.resolveRole(roleName);
      if (role) {
        const guildMember = this.resolveGuildMember(user);
        if (guildMember) {
          try {
            await guildMember.roles.remove(
              role,
              `User removed ${reaction.emoji.name} reaction.`
            );
          } catch (err) {
            debug(
              `An error occured while removing role ${roleName} from ${guildMember.nickname}: ${err}`
            );
          }
        } else {
          debug(`${user.username} not a guild member.`);
        }
      } else {
        debug(`No role with name ${roleName}.`);
      }
    } else {
      debug(`No configured role for emoji ${reaction.emoji.name}.`);
    }
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
   * Emitted whenever a member leaves a guild, or is kicked or banned.
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
        discordUsername: null,
        discordDiscriminator: null,
        discordAvatar: null
      });
    }
  }

  /**
   * Returns the Discord.Guild specified in the config file.
   * @returns {Discord.Guild}
   * @throws If the guild specified by the guildId in the config file was not found.
   */
  getGuild() {
    const guild = this.client.guilds.get(config.guildId);
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
      guild.channels.get(channelResolvable) ||
      guild.channels.find(
        guildChannel => guildChannel.name === channelResolvable
      );

    if (!channel) {
      channel =
        this.client.channels.get(channelResolvable.id) ||
        channelResolvable.channel;
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
      user =
          userResolvable.user ||
          userResolvable.owner ||
          userResolvable.author ||
          userResolvable;
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
      guildMember = guild.members.get(guildMemberResolvable);
      break;
    case "object":
      guildMember = guild.members.get(guildMemberResolvable.id);
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
      role =
          guild.roles.get(roleResolvable) ||
          guild.roles.find(role => role.name === roleResolvable);
      break;
    case "object":
      role = guild.roles.get(roleResolvable.id);
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
   * Add a user to the Discord server.
   * @param {Discord.UserResolvable|Discord.GuildMemberResolvable} userResolvable Data that resolves to a User or GuildMember object.
   * @param {string} nick The nickname of the user to add to the server.
   * @param {string} accessToken An OAuth2 access token for the user with the guilds.join scope granted to the bot's application.
   * @returns {Promise<Discord.GuildMember>} The GuildMember that was added to the server.
   * @throws If the userResolvable could not be resolved to a User or a GuildMember
   */
  async addUser(userResolvable, nick, accessToken) {
    const guild = this.getGuild();
    if (!guild.available) {
      throw new Error("Guild is currently not available.");
    }

    const defaultRole =
      this.resolveRole(config.defaultRole) || guild.defaultRole;

    // First check if the user is already a member of the guild.
    let guildMember = await this.resolveGuildMember(userResolvable);

    if (guildMember) {
      debug(`User ${guildMember.user.tag} already a member of the guild.`);
      // Just update the nickname.
      await guildMember.setNickname(nick);
    } else {
      // Discord user not a member of the guild yet.
      const discordUser = await this.resolveUser(userResolvable);
      if (!discordUser) {
        throw new Error(
          `User with id ${userResolvable.id || userResolvable} was not found.`
        );
      }

      debug(`Adding user ${discordUser.tag} to the guild.`);

      // Add the member and set the nickname.
      try {
        guildMember = await guild.addMember(discordUser, {
          accessToken,
          nick,
          roles: [defaultRole.id]
        });
      } catch (err) {
        debug(`An error occured while adding user to the guild: ${err}`);
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
      debug(
        `User ${userResolvable.id || userResolvable} not a member of the guild.`
      );
    } else {
      await guildMember.kick(reason);
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
      throw new Error(
        `User ${guildMemberResolvable.id ||
          guildMemberResolvable} is not a member of the guild.`
      );
    }

    const guildRole = await this.resolveRole(roleResolvable);
    if (!guildRole) {
      throw new Error(
        `Role ${roleResolvable} does not resolve to a valid guild role.`
      );
    }

    debug(`Add role ${guildRole.name} to ${guildMember.tag}`);
    await guildMember.roles.add(guildRole.id);
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
        reason
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
        debug(
          `An error occured while unbanning user ${userResolvable}: ${err}`
        );
      }
    } else {
      debug(
        `Failed to unban user ${userResolvable}. Reason: Guild not available.`
      );
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
      debug(`Error fetching ban info: ${err}`);
    }

    return ban && ban.reason;
  }
}

module.exports = new DiscordAdapter();
