const express = require("express");
const router = express.Router();
const settings = require("../settings");

/* GET home page. */
router.get("/", function(req, res) {
  res.render("index", {
    pageTitle: "Discord User Manager",
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
