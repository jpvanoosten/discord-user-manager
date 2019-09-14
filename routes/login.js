const debug = require("debug")("discord-user-manager:login");
const express = require("express");
const passport = require("passport");
const router = express.Router();
const settings = require("../settings");

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
      ...settings
    });
  }
});

/* POST login page. */
router.post("/", (req, res, next) => {
  // Athenticate the user using the "local-strategy" (defined in app.js)
  // Note: The `passport.authenticate` method returns an Express middleware function that must be invoked.
  passport.authenticate("local-strategy", (err, user, info) => {
    if (err) {
      debug(`Authentication error ${err}`);
      return next(err);
    } else {
      if (user) {
        req.login(user, err => {
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
