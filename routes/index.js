// const debug = require("debug")("discord-user-manager:index");
const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
  const codeOfConduct = req.query.coc || req.cookies.codeOfConduct === "true";
  // Set the Code of Conduct cookie if the user agrees to it.
  res.cookie("codeOfConduct", codeOfConduct);

  // eslint-disable-next-line no-unused-vars
  res.render("index", {
    pageTitle: "Home",
    codeOfConduct
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
