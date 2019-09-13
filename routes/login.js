const express = require("express");
const router = express.Router();
const settings = require("../settings");


/* GET login page. */
router.get("/", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    ...settings
  });
});

/* POST login page. */
router.post("/", (req, res) => {
  res.render("login", {
    pageTitle: "Login",
    ...settings
  });
});

module.exports = router;
