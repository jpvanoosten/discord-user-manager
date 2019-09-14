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
    res.render("login", {
      pageTitle: "Login",
      ...settings
    });
  }
});

/* POST login page. */
router.post(
  "/",
  // Athenticate the user useing the "local-strategy" (defined in app.js)
  passport.authenticate("local-strategy", {
    failureRedirect: "/login",
    failureMessage: "Login failed."
  }),
  (req, res) => {
    debug(`User ${req.user.username} is logged in.`);

    res.redirect("/");
  }
);

module.exports = router;
