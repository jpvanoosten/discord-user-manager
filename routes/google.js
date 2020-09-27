const bcrypt = require("bcrypt");
const crypto = require("crypto");
const debug = require("debug")("discord-user-manager:google");
const express = require("express");
const { google } = require("googleapis");
const passport = require("passport");
const path = require("path");
const router = express.Router();
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const models = require("../models");

async function main() {
  const auth = await google.auth.getClient({
    keyFile: path.join(__dirname, "..", "gsa.json"),
    scopes: ["https://www.googleapis.com/auth/admin.directory.group.readonly"],
  });

  const groups = google.admin({ version: "directory_v1", auth }).groups;

  const res = await groups.list({
    userKey: "oosten.j@ade-buas.nl",
    domain: "ade-buas.nl",
  });

  debug(res);
}

main().catch((e) => {
  debug(`An error occured: ${e}`);
  throw e;
});

// Google strategy for autenticating users with a Google account
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Get the email address of the user:
      if (!profile.emails || !profile.emails.length) {
        return done("No email address associated with Google account.");
      }

      const email = profile.emails[0].value;

      models.User.findOrCreate({
        where: {
          username: email,
        },
      })
        .then(([user, created]) => {
          if (created) {
            debug(`New user added to database: ${profile.displayName}`);
          } else {
            debug(`User already registered to database: ${profile.displayName}`);
          }

          user
            .update({
              // Google users get a random password.
              password: user.password || bcrypt.hashSync(crypto.randomBytes(50).toString("base64"), 10),
              googleId: profile.id,
              img: profile.photos[0].value,
              name: profile.displayName,
            })
            .then(() => {
              done(null, user);
            });
        })
        .catch((err) => {
          debug(`An error occured when adding user: ${err}`);
          done(err);
        });
    }
  )
);
/* GET Google Login page. */
router.get(
  "/",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  })
);

/* Google login redirect URI */
router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/google",
  }),
  (req, res) => {
    debug("Google user successfully logged in.");
    // Authentication successful, redirect home.
    res.redirect("/");
  }
);

module.exports = router;
