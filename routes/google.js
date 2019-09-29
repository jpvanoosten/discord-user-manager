const debug = require("debug")("discord-user-manager:google");
const express = require("express");
const passport = require("passport");
const router = express.Router();
const settings = require("../settings");

/* GET Google Login page. */
router.get(
  "/",
  passport.authenticate("google", {
    scope: ["email", "profile"]
  })
);

/* Google login redirect URI */
router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/google"
  }),
  (req, res) => {
    debug("Google user successfully logged in.");
    // Authentication successful, redirect home.
    res.redirect("/");
  }
);

module.exports = router;
