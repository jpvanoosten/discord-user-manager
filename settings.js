const path = require("path");

module.exports = {
  // Site title (will be used in page titles.)
  siteTitle: "Discord User Manager",
  // Title seperator seperates the page title and the site title.
  // The page title is constructed as `${pageTitle}${titleSperator}${siteTitle}`
  titleSeperator: " | ",
  // Database path and file name.
  db: {
    path: path.resolve("data"),
    file: "sqlite.db",
  },
};
