const debug = require("debug")("discord-user-manager:discord");
const express = require("express");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

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
      debug(profile);
      done(null, profile);
    }
  )
);

/* GET Discrod Login page. */
router.get("/", passport.authenticate("discord"));

/* Discord login redirect URI */
router.get(
  "/callback",
  passport.authenticate("discord", {
    failureRedirect: "/"
  }),
  (req, res) => {
    debug("Discord user successfully logged in.");
    // Authentication successful, redirect home.
    res.redirect("/");
  }
);

module.exports = router;
