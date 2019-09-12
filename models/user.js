"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: { type: DataTypes.STRING, unique: "compositeKey" },
      discordId: { type: DataTypes.STRING, unique: "compositeKey" }
    },
    {}
  );
  User.associate = function(models) {
    // associations can be defined here
  };
  return User;
};
