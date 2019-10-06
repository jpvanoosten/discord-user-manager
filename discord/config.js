module.exports = {
  // Prefix for bot commands.
  prefix: "!",
  // Bot token (see: https://discordapp.com/developers/applications/)
  token: process.env.DISCORD_BOT_TOKEN,
  // The guild (or server) ID.
  guildId: process.env.DISCORD_SERVER_ID,
  // Channel to post welcome messages.
  welcomeChannel: "welcome",
  // Channel to log messages to.
  logChannel: "logs",
  // Default role for new members.
  defaultRole: "student"
};
