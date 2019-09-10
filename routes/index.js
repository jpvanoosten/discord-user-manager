var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", {
    title: "Google Discord Server"
  });
});

/* GET privacy-policy page. */
router.get("/privacy-policy", function(req, res, next) {
  res.render("privacy-policy", {
    title: "Privacy Policy - Google Discord Server"
  });
});

/* GET code-of-conduct page. */
router.get("/code-of-conduct", function(req, res, next) {
  res.render("code-of-conduct", {
    title: "Code of Conduct - Google Discord Server"
  });
});

module.exports = router;
