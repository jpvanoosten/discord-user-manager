/**
 * This is the Sequilize configuration file.
 */

const path = require("path");
const settings = require("../settings");

const db = {
  dialect: "sqlite",
  storage: path.resolve(settings.db.path, settings.db.file)
};

module.exports = {
  development: db,
  test: db,
  production: {
    ...db,
    logging: false
  }
};
