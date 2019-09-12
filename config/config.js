const path = require("path");
const settings = require("../settings");

module.exports = {
  development: {
    dialect: "sqlite",
    storage: path.resolve(settings.db.path, settings.db.file)
  },
  test: {
    dialect: "sqlite",
    storage: path.resolve(settings.db.path, settings.db.file)
  },
  production: {
    dialect: "sqlite",
    storage: path.resolve(settings.db.path, settings.db.file)
  }
};
