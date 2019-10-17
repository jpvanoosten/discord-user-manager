const debug = require("debug")("discord-user-manager:discord");
const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

const DiscordAdapter = require("../discord/DiscordAdapter");

const router = express.Router();

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify", "email", "guilds", "guilds.join"]
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

/* GET Discord Login page. */
router.get("/", passport.authenticate("discord"));

/* Discord login redirect URI */
router.get("/callback", (req, res, next) => {
  passport.authenticate("discord", async (err, profile) => {
    if (!req.user) {
      // The user must be authenticated in order to
      // associate with a Discord user account.
      debug("User not logged in.");
      // Redirect to the login page.
      return res.redirect("/login");
    }

    debug("Discord user succeffully logged in.");
    debug(profile);

    // Update the user's discordId and discordAvatar
    const user = req.user;

    try {
      await user.update({
        discordId: profile.id,
        discordUsername: profile.username,
        discordDiscriminator: profile.discriminator,
        discordAvatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=512`
      });

      // Now add the user to the discord server:
      await DiscordAdapter.addUser(
        user.discordId,
        user.name,
        profile.accessToken
      );
    } catch (err) {
      debug(
        `An error occured while adding ${user.name} to the Discord server: ${err}`
      );
    }

    // redirect to the home page.
    res.redirect("/");
  })(req, res, next);
});

/* Unlink Discord account from user login */
router.get("/logout", async (req, res, next) => {
  if (!req.user) {
    // User is not logged in.
    debug("User not logged in.");
    // Redirect to the main page.
    return res.redirect("/");
  }

  const user = req.user;

  await DiscordAdapter.removeUser(user.discordId, "Unlinking Discord account.");

  // Redirect to the main page.
  res.redirect("/");
});

module.exports = router;
