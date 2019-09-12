"use strict";
module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    "Admin",
    {
      username: { type: DataTypes.STRING, unique: true },
      password: { type: DataTypes.STRING }
    },
    {}
  );
  Admin.associate = function(models) {
    // associations can be defined here
  };
  return Admin;
};
