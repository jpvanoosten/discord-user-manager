/**
 * This is the Sequilize configuration file.
 */

const path = require("path");
const settings = require("../settings");

const db = {
  dialect: "sqlite",
  storage: path.resolve(settings.db.path, settings.db.file),
  logging: false
};

module.exports = {
  development: {
    ...db,
    logging: true
  },
  test: db,
  production: db
};
