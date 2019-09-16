// const debug = require("debug")("discord-user-manager:index");
const express = require("express");
const router = express.Router();
const settings = require("../settings");

/* GET home page. */
router.get("/", function(req, res) {
  // eslint-disable-next-line no-unused-vars
  res.render("index", {
    pageTitle: "Home",
    ...settings
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
