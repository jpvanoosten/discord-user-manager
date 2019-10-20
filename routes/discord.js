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
      scope: ["identify", "email", "guilds", "guilds.join"],
      prompt: "none"
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
      const banReason = await DiscordAdapter.isUserBanned(profile.id);
      if (!banReason) {
        // Update user info.
        await user.update({
          discordId: profile.id,
          discordUsername: profile.username,
          discordDiscriminator: profile.discriminator,
          discordAvatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=512`
        });

        // Now add the user to the discord server:
        await DiscordAdapter.addUser(
          profile.id,
          user.name,
          profile.accessToken
        );
      } else {
        debug(`User ${profile.username} is banned: ${banReason}`);

        req.flash("info", {
          discordLoginError: `Could not connect to the Discord server because your account is banned: ${banReason}. Please contact the Discord owner for more information.`
        });
      }
    } catch (err) {
      debug(
        `An error occured while adding ${user.name} to the Discord server: ${err}`
      );

      req.flash("info", {
        discordLoginError:
          "An error occured when adding you to the Discord server.\nPlease contact the owner of the Discord server for more information."
      });
    }

    // redirect to the home page.
    res.redirect("/");
  })(req, res, next);
});

/* Unlink Discord account from user login */
router.get("/logout", async (req, res) => {
  if (!req.user) {
    // User is not logged in.
    debug("User not logged in.");
    // Redirect to the main page.
    return res.redirect("/");
  }

  const user = req.user;

  await DiscordAdapter.removeUser(user.discordId, "Unlinking Discord account.");

  // Update user info.
  await user.update({
    discordId: null,
    discordUsername: null,
    discordDiscriminator: null,
    discordAvatar: null
  });

  // Redirect to the main page.
  res.redirect("/");
});

module.exports = router;
