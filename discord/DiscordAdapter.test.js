/**
 * @jest-environment node
 */
require("dotenv").config();
process.env.DEBUG = null;
const config = require("./config");

const DiscordAdapter = require("./DiscordAdapter");

beforeAll((done) => {
  DiscordAdapter.once("ready", async () => {
    const user = await DiscordAdapter.resolveUser(process.env.TEST_USER_DISCORD_ID);
    const guildMember = DiscordAdapter.resolveGuildMember(process.env.TEST_USER_DISCORD_ID);
    if (!guildMember) {
      await DiscordAdapter.addUser(user, "Test User", process.env.TEST_USER_ACCESS_TOKEN);
    }
    done();
  });
});

test("resolve welcome channel", async () => {
  let channel = await DiscordAdapter.resolveChannel(config.welcomeChannel);
  expect(channel).toHaveProperty("id");
  channel = await DiscordAdapter.resolveChannel(channel.id);
  expect(channel).toHaveProperty("id");
  channel = await DiscordAdapter.resolveChannel(channel);
  expect(channel).toHaveProperty("id");
});

test("resolve default role", async () => {
  let role = DiscordAdapter.resolveRole(config.defaultRole);
  expect(role).toHaveProperty("id");
  role = DiscordAdapter.resolveRole(role.id);
  expect(role).toHaveProperty("id");
  role = DiscordAdapter.resolveRole(role);
  expect(role).toHaveProperty("id");
});

test("can add user to role", async () => {
  const guildMember = await DiscordAdapter.resolveGuildMember(process.env.TEST_USER_DISCORD_ID);
  expect(guildMember).not.toBeNull();
  await DiscordAdapter.addRole(guildMember, config.defaultRole);
});

test("add user to invalid role", async () => {
  const guildMember = await DiscordAdapter.resolveGuildMember(process.env.TEST_USER_DISCORD_ID);
  expect(guildMember).not.toBeNull();
  await expect(DiscordAdapter.addRole(guildMember, "invalid")).rejects.toThrow();
});

test("add invalid user to role", async () => {
  await expect(DiscordAdapter.addRole(null, config.defaultRole)).rejects.toThrow();
});

test("welcome URL", async () => {
  const welcomeURL = DiscordAdapter.getWelcomeChannelURL();
  expect(welcomeURL).toBeTruthy();
});

test("add existing user", async () => {
  await DiscordAdapter.addUser(process.env.TEST_USER_DISCORD_ID, "Existing User", process.env.TEST_USER_ACCESS_TOKEN);
});

test("add invalid user", async () => {
  await expect(DiscordAdapter.addUser(null, "Invalid User", process.env.TEST_USER_ACCESS_TOKEN)).rejects.toThrow();
});

test("remove invalid user", async () => {
  await expect(DiscordAdapter.removeUser(null)).rejects.toThrow();
});

test("send log to channel", async () => {
  await expect(DiscordAdapter.logInfo("This is an info message.")).not.toBeNull();
  await expect(DiscordAdapter.logDebug("This is a debug message.")).not.toBeNull();
  await expect(DiscordAdapter.logWarning("This is a warning message.")).not.toBeNull();
  await expect(DiscordAdapter.logError("This is an error message.")).not.toBeNull();
});

afterAll(async () => {
  const guildMember = DiscordAdapter.resolveGuildMember(process.env.TEST_USER_DISCORD_ID);
  expect(guildMember).not.toBeNull();
  await DiscordAdapter.removeUser(guildMember);
  await DiscordAdapter.destroy();
});
