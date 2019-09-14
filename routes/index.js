const debug = require("debug")("discord-user-manager:index");
const express = require("express");
const router = express.Router();
const settings = require("../settings");

/* GET home page. */
router.get("/", function(req, res) {
  // Remove the title seperator so that only the site title is used to generate the page tite.
  // eslint-disable-next-line no-unused-vars
  const { titleSeperator, ...rest } = settings;
  res.render("index", {
    user: req.user,
    ...rest
  });
});

/* GET privacy-policy page. */
router.get("/privacy-policy", function(req, res) {
  res.render("privacy-policy", {
    pageTitle: "Privacy Policy",
    ...settings
  });
});

/* GET code-of-conduct page. */
router.get("/code-of-conduct", function(req, res) {
  res.render("code-of-conduct", {
    pageTitle: "Code of Conduct",
    ...settings
  });
});

module.exports = router;
