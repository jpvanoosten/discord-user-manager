/**
 * Configuration settings specifically for the Discord Bot
 * @see {@link DiscordAdapter}.
 */

module.exports = {
  // Prefix for bot commands.
  prefix: "!",
  // Bot token (see: https://discord.com/developers/applications/)
  token: process.env.DISCORD_BOT_TOKEN,
  // The guild (or server) ID.
  guildId: process.env.DISCORD_SERVER_ID,
  // Channel to post welcome messages.
  welcomeChannel: "welcome",
  // Channel to log messages to.
  logChannel: "logs",
  // Default role for new members.
  defaultRole: "student",
  // Reactions => roles
  roles: {
    "1⃣": "y1",
    "2⃣": "y2",
    "3⃣": "y3",
    "4⃣": "y4",
    "🤖": "pr",
    "🎨": "va",
    "💭": "dp",
    "🎓": "alumni",
    "👍": "test",
  },
};
