require("dotenv").config();
const debug = require("debug")("discord-user-manager:get-oauth-token");
const express = require("express");
const session = require("express-session");
const stoppable = require("stoppable");
const open = require("open");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

/**
 * Write the access token to the .env file.
 *
 * @param token {string} The OAuth access token.
 * @param id {string} The ID of the Discord user.
 */
function writeAccessToken(token, id) {
  const envFile = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envFile)) {
    throw new Error(`${envFile} does not exist. Use utils/confiEnv.js to auto configure the .env file.`);
  }

  let env = fs.readFileSync(envFile, "utf8");
  debug(`Access token: ${token}`);
  debug(`Profile ID: ${id}`);

  env = env.replace(/^TEST_USER_ACCESS_TOKEN=(.*)$/m, `TEST_USER_ACCESS_TOKEN=${token}`);
  env = env.replace(/^TEST_USER_DISCORD_ID=(.*)$/m, `TEST_USER_DISCORD_ID=${id}`);

  fs.writeFileSync(envFile, env);

  debug(`${envFile} file updated with new access token.`);
}

const app = express();
const port = process.env.PORT || "3000";
app.set("port", port);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_REDIRECT_URI,
      scope: ["identify", "email", "guilds", "guilds.join"],
      prompt: "none",
    },
    (accessToken, refreshToken, profile, done) => {
      if (accessToken && profile && profile.id) {
        writeAccessToken(accessToken, profile.id);
      }
      done(null, profile);
    }
  )
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", passport.authenticate("discord"));
app.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/failed",
  }),
  (req, res) => {
    res.redirect("/success"); // Authentication was successfull.
  }
);

app.get("/success", (req, res) => {
  res.send("Success! You can close this browser window.");
  server.stop();
});

app.get("/failed", (req, res) => {
  res.send("Something went wrong...");
  server.stop();
});

const server = stoppable(
  app.listen(port, (err) => {
    if (err) return debug(err);
    open(`http://localhost:${port}/`);
  }),
  1000
);
