require("dotenv").config();

const sequelize = require("./config/database");
const Product = require("./models/Product");
const extraProducts = require("./data/extraProducts");

async function seedExtra() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    let created = 0;

    for (const product of extraProducts) {
      const [, wasCreated] = await Product.findOrCreate({
        where: { slug: product.slug },
        defaults: product,
      });

      if (wasCreated) created += 1;
    }

    console.log(`${created} produto(s) adicional(is) inserido(s).`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedExtra();
