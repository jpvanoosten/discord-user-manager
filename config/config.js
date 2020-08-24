/**
 * This is the Sequelize configuration file.
 */
const debug = require("debug")("discord-user-manager:sequelize");
const path = require("path");
const settings = require("../settings");

const db = {
  dialect: "sqlite",
  storage: path.resolve(settings.db.path, settings.db.file),
  logging: false,
};

module.exports = {
  development: {
    ...db,
    logging: debug,
  },
  test: db,
  production: db,
};
