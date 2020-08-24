const bcrypt = require("bcrypt");
const debug = require("debug")("discord-user-manager:login");
const express = require("express");
const passport = require("passport");
const router = express.Router();
const settings = require("../settings");
const LocalStrategy = require("passport-local").Strategy;

const models = require("../models");

// Use a local database lookup for local logins.
passport.use(
  new LocalStrategy((username, password, done) => {
    // Find user by username in the User table.
    models.User.findOne({
      where: {
        username,
      },
    })
      .then((user) => {
        if (user) {
          // Check for the correct password
          const passwordsMatch = bcrypt.compareSync(password, user.password);
          if (passwordsMatch) {
            // Passwords match, return the user.
            return done(null, user);
          } else {
            // Passwords don't match, return null.
            return done(null, null, {
              message: `Invalid password for user ${username}`,
              passwordError: "Invalid password.",
              username,
            });
          }
        } else {
          // User with specified username was not found in the Admin table.
          return done(null, null, {
            message: `User ${username} not found.`,
            usernameError: "Invalid username.",
            username,
          });
        }
      })
      .catch((err) => {
        debug(`An error occured while querying the user: ${err}`);
        return done(err);
      });
  })
);

/* GET login page. */
router.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    debug(`User ${req.user.username} is already authenticated.`);

    res.redirect("/");
  } else {
    // Parse the flash info (if any) coming from the login POST
    // (see POST handler below). If the login failed, the flashInfo
    // should contain either usernameError or passwordError indicating
    // what went wrong.
    const flashInfo = req.flash("info")[0];

    res.render("login", {
      pageTitle: "Login",
      ...flashInfo,
      ...settings,
    });
  }
});

/* POST login page. */
router.post("/", (req, res, next) => {
  // Athenticate the user using the "local-strategy" (defined in app.js)
  // Note: The `passport.authenticate` method returns an Express middleware function that must be invoked.
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      debug(`Authentication error ${err}`);
      return next(err);
    } else {
      if (user) {
        req.login(user, (err) => {
          if (err) {
            debug(`Error logging in: ${err}`);
            return next(err);
          }
          debug(`User ${user.username} logged in.`);

          // Redirect to the homepage.
          res.redirect("/");
        });
      } else {
        debug(`Login failed: ${info.message}`);

        req.flash("info", info);
        res.redirect("/login");
      }
    }
  })(req, res, next);
});

module.exports = router;
