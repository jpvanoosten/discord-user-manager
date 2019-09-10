const createError = require("http-errors");
const express = require("express");
const router = express.Router();

/* GET users listing. */
router.get("/", function(req, res, next) {
  // TODO: Check if user is logged in.
  req.db
    .readUsers()
    .then(users => {
      res.send("respond with a resource");
    })
    .catch(err => {
      next(createError(err));
    });
});

module.exports = router;
