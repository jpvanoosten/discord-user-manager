// const debug = require("debug")("discord-user-manager:index");
const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
  if (req.query.codeOfConduct === "true") {
    res.cookie("codeOfConduct", req.query.codeOfConduct, {
      maxAge: 3.154e10 // 1 year.
    });
  }

  // eslint-disable-next-line no-unused-vars
  res.render("index", {
    pageTitle: "Home"
  });
});

/* GET privacy-policy page. */
router.get("/privacy-policy", function(req, res) {
  res.render("privacy-policy", {
    pageTitle: "Privacy Policy"
  });
});

/* GET code-of-conduct page. */
router.get("/code-of-conduct", function(req, res) {
  res.render("code-of-conduct", {
    pageTitle: "Code of Conduct"
  });
});

module.exports = router;
