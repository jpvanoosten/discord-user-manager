"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.sequelize.transaction((transaction) => {
      return queryInterface
        .addColumn(
          "Users",
          "azureId",
          {
            type: Sequelize.DataTypes.STRING,
          },
          { transaction }
        )
        .then(() => {
          return queryInterface.addIndex("Users", {
            fields: ["azureId"],
            unique: true,
            transaction,
          });
        });
    });
  },

  down: (queryInterface) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.sequelize.transaction((transaction) => {
      return queryInterface.removeColumn("Users", "azureId", { transaction }).then(() => {
        return queryInterface.removeIndex("Users", "azureId", { transaction });
      });
    });
  },
};
