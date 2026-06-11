const { Sequelize } = require("sequelize");

const commonOptions = {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions:
    process.env.DB_SSL === "true"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || "loja_gaucha",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "",
      {
        ...commonOptions,
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
      }
    );

module.exports = sequelize;
