const createError = require("http-errors");
const debug = require("debug")("discord-user-manager:users");
const express = require("express");
const models = require("../models");
const router = express.Router();

/* GET users listing. */
router.get("/", async (req, res, next) => {
  // Get the query parameters
  const where = req.query.q;
  const limit = req.query.limit || 50;
  const offset = req.query.offset || 0;
  const order = req.query.order;

  debug("Querying users");
  // Get a list of users
  const users = await models.User.findAll({
    where,
    limit,
    offset,
    order,
    raw: true // Just get the fields, but don't attach functions (see: https://sequelize.org/master/manual/models-usage.html#raw-queries)
  });

  res.render("users", {
    pageTitle: "Users",
    users,
    limit,
    offset
  });
});

module.exports = router;
