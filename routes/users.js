// const createError = require("http-errors");
const debug = require("debug")("discord-user-manager:users");
const express = require("express");
const models = require("../models");
const router = express.Router();

/* GET users listing. */
router.get("/", async (req, res) => {
  // Get the query parameters
  const where = req.query.q;
  const limit = Math.max(parseInt(req.query.limit || 50), 1);
  const offset = parseInt(req.query.offset || 0);
  const order = req.query.order;

  debug("Querying users");
  // Get a list of users
  const numUsers = await models.User.count({
    where
  });
  const users = await models.User.findAll({
    where,
    limit,
    offset,
    order,
    raw: true // Just get the fields, but don't attach functions (see: https://sequelize.org/master/manual/models-usage.html#raw-queries)
  });

  res.render("users", {
    pageTitle: "Users",
    numUsers,
    users,
    limit,
    offset
  });
});

module.exports = router;
