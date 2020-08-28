// const createError = require("http-errors");
const bcrypt = require("bcrypt");
const debug = require("debug")("discord-user-manager:users");
const express = require("express");
const Sequelize = require("sequelize");
const models = require("../models");
const router = express.Router();

const OR = Sequelize.Op.or;
const SUBSTRING = Sequelize.Op.substring;

/* GET users listing. */
router.get("/", async (req, res) => {
  // Get the query parameters
  const search =
    typeof req.query.q === "undefined" ? (req.session.users && req.session.users.search) || "" : req.query.q;
  const limit = Math.max(parseInt(req.query.limit || (req.session.users && req.session.users.limit) || 50), 1);
  let offset = parseInt(req.query.offset || (req.session.users && req.session.users.offset) || 0);
  const order = req.query.order || (req.session.users && req.session.users.order) || "";

  // Save query parameters to the session if they changed.
  req.session.users = {
    search,
    limit,
    offset,
    order,
  };

  let where;
  if (search) {
    where = {
      [OR]: [
        {
          username: {
            [SUBSTRING]: search,
          },
        },
        {
          name: {
            [SUBSTRING]: search,
          },
        },
      ],
    };
  }

  debug("Querying users");
  // Get a list of users
  const numUsers = await models.User.count({
    where,
  });

  // Limit offset so that it doesn't exceed the maximum number of users.
  offset = Math.min(offset, numUsers - 1);

  const users = await models.User.findAll({
    where,
    limit,
    offset,
    order,
    raw: true, // Just get the fields, but don't attach functions (see: https://sequelize.org/master/manual/models-usage.html#raw-queries)
  });

  const flashMessages = req.flash("info")[0];

  res.render("users", {
    pageTitle: "Users",
    numUsers,
    users,
    limit,
    offset,
    search,
    ...flashMessages,
  });
});

// Add a user
router.post("/add", async (req, res) => {
  const username = req.body.username;
  const name = req.body.name;
  const password = bcrypt.hashSync(req.body.password, 10);
  const isAdmin = req.body.isAdmin ? true : false;

  // Check if user already exists.
  // Usernames must be uniqe.
  let user = await models.User.findOne({
    where: {
      username,
    },
  });

  if (user) {
    req.flash("info", {
      errorAlert: `User with username ${username} already exists.`,
    });

    return res.redirect("back");
  }

  debug(`Adding user ${name} (${username})`);

  user = await models.User.create({
    username,
    name,
    password,
    isAdmin,
  });

  if (!user) {
    req.flash("info", {
      errorAlert: `Error adding user ${name} (${username})`,
    });

    return res.redirect("back");
  }

  req.flash("info", {
    successAlert: `Successfully added ${user.name} (${user.username})`,
  });

  return res.redirect("back");
});

// Edit a user
router.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const username = req.body.username;
  const name = req.body.name;
  const password = req.body.password ? bcrypt.hashSync(req.body.password, 10) : undefined;
  const isAdmin = req.body.isAdmin ? true : false;
  //  const discordId = req.body.discordId;

  const user = await models.User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return res.redirect("/users");
  }

  debug(`Editing user [${id}] ${user.username}`);

  // Perform the update
  await user.update({
    username,
    name,
    password,
    isAdmin,
  });

  // Send a flash message that the user was edited.
  req.flash("info", {
    successAlert: `User with id ${id} has been succesfully edited.`,
  });

  res.redirect("/users");
});

// Delete a user.
router.post("/delete/:id", async (req, res) => {
  const id = req.params.id;

  const user = await models.User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return res.redirect("/users");
  }

  debug(`Deleting user [${id}] ${user.username}`);

  // Perform the delete
  await user.destroy();

  // Send a flash message that the user was deleted.
  req.flash("info", {
    infoAlert: `User with id ${id} has been succesfully deleted.`,
  });

  res.redirect("/users");
});

module.exports = router;
