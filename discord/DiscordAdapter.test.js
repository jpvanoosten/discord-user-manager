/**
 * @jest-environment node
 */
require("dotenv").config();
process.env.DEBUG = "";

const DiscordAdapter = require("./DiscordAdapter");
const testUserId = "619584218380632065";

beforeAll(done => {
  DiscordAdapter.once("ready", () => {
    done();
  });
});

test("can add and remove a user", async () => {
  const user = await DiscordAdapter.resolveUser(testUserId);
  const guildMember = DiscordAdapter.resolveGuildMember(testUserId);
  if (guildMember) {
    await DiscordAdapter.removeUser(guildMember);
    // TODO: Need a way to get an access token for this test to work.
    await DiscordAdapter.addUser(user, "Test User");
  } else {
    await DiscordAdapter.addUser(user, "Test User");
    await DiscordAdapter.removeUser(user);
  }
});
