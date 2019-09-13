const bcrypt = require("bcrypt");
const debug = require("debug")("discord-user-manager:login");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const settings = require("../settings");
const models = require("../models");

// Returns a signed jwt.
function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
}

/* GET login page. */
router.get("/", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    ...settings
  });
});

/* POST login page. */
router.post("/", (req, res) => {
  const { username, password } = req.body;

  // Check for existing user in database.
  models.Admin.findOne({
    where: {
      username
    }
  }).then(user => {
    if (user) {
      // Check for the correct password
      const passwordsMatch = bcrypt.compareSync(password, user.password);
      if (passwordsMatch) {
        debug(`Admin ${user.username} logged in.`);

        // Get a signed token with the user id.
        const token = sign({ id: user.id });
        res.cookie("token", token, {
          maxAge: 2.592e9,
          httpOnly: true
        });

        // User logged in, redirect to main page.
        res.redirect("/");
      } else {
        debug(`Invalid password for user ${user.username}`);

        res.render("login", {
          pageTitle: "Login",
          username,
          ...settings
        });
      }
    } else {
      debug(`Admin user ${username} not found.`);
    }
  });
});

module.exports = router;
