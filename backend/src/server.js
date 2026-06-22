require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
const User = require("./models/User");
require("./models/Review");
const { hashPassword } = require("./services/authService");

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const orderColumns = await sequelize.getQueryInterface().describeTable("orders");
    if (!orderColumns.customer) {
      await sequelize.getQueryInterface().addColumn("orders", "customer", {
        type: require("sequelize").DataTypes.JSONB,
        allowNull: true,
      });
    }

    const configuredAdmin = String(process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "admin").toLowerCase();
    const adminEmail = configuredAdmin.includes("@") ? configuredAdmin : `${configuredAdmin}@mate.com`;
    const adminPassword = process.env.ADMIN_PASSWORD || "troque_esta_senha";
    const [admin, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: { name: "Administrador", email: adminEmail, passwordHash: await hashPassword(adminPassword), role: "admin" },
    });
    if (!created) {
      admin.passwordHash = await hashPassword(adminPassword);
      admin.role = "admin";
      await admin.save();
    }

    console.log("Conexão com o PostgreSQL estabelecida.");

    app.listen(PORT, () => {
      console.log(`Servidor disponível em http://localhost:${PORT}`);
      console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Não foi possível iniciar o servidor.");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
