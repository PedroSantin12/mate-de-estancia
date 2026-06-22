const { Op, cast, col, where: sequelizeWhere } = require("sequelize");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");

function parsePositiveInteger(value, fallback, fieldName, maximum = 100) {
  if (value === undefined || value === "") return fallback;

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1 || number > maximum) {
    throw new AppError(
      `${fieldName} deve ser um número inteiro entre 1 e ${maximum}.`,
      400,
      "INVALID_PARAMETER"
    );
  }

  return number;
}

function validateProductBody(body) {
  const requiredFields = ["name", "slug", "description", "category", "price", "image"];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new AppError(`O campo "${field}" é obrigatório.`, 400, "VALIDATION_ERROR");
    }
  }

  if (Number(body.price) <= 0) {
    throw new AppError("O preço deve ser maior que zero.", 400, "VALIDATION_ERROR");
  }

  if (body.stock !== undefined && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) {
    throw new AppError("O estoque deve ser um número inteiro maior ou igual a zero.", 400, "VALIDATION_ERROR");
  }
}

function getProductOrder(sort) {
  const options = {
    price_asc: [["price", "ASC"]],
    price_desc: [["price", "DESC"]],
    name_asc: [["name", "ASC"]],
  };

  return options[sort] || [
    ["featured", "DESC"],
    ["id", "ASC"],
  ];
}

async function createProduct(req, res, next) {
  try {
    validateProductBody(req.body);

    const product = await Product.create({
      ...req.body,
      category: String(req.body.category).toLowerCase(),
      price: Number(req.body.price),
      stock: Number(req.body.stock || 0),
      featured: Boolean(req.body.featured),
      attributes: req.body.attributes || {},
      variants: req.body.variants || [],
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return next(new AppError("Já existe um produto com este slug.", 409, "DUPLICATE_SLUG"));
    }

    return next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    validateProductBody(req.body);
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");

    await product.update({
      ...req.body,
      category: String(req.body.category).toLowerCase(),
      price: Number(req.body.price),
      stock: Number(req.body.stock || 0),
      featured: Boolean(req.body.featured),
      attributes: req.body.attributes || product.attributes || {},
      variants: req.body.variants || product.variants || [],
    });
    return res.json({ success: true, data: product });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return next(new AppError("Já existe um produto com este slug.", 409, "DUPLICATE_SLUG"));
    }
    return next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    await product.destroy();

    return res.status(200).json({
      success: true,
      data: {
        message: "Produto removido com sucesso.",
        id: Number(req.params.id),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function searchProducts(req, res, next) {
  try {
    const page = parsePositiveInteger(req.query.page, 1, "page", 100000);
    const limit = parsePositiveInteger(req.query.limit, 12, "limit", 50);
    const query = String(req.query.query || "").trim();
    const category = String(req.query.cat || "").trim().toLowerCase();
    const sort = String(req.query.sort || "").trim();

    if (query.length > 100) {
      throw new AppError("A pesquisa deve possuir até 100 caracteres.", 400, "INVALID_PARAMETER");
    }

    const conditions = [];

    if (category && category !== "todos") {
      conditions.push({ category });
    }

    if (query) {
      const queryLike = `%${query}%`;

      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: queryLike } },
          { description: { [Op.iLike]: queryLike } },
          { category: { [Op.iLike]: queryLike } },
          sequelizeWhere(cast(col("attributes"), "TEXT"), {
            [Op.iLike]: queryLike,
          }),
          sequelizeWhere(cast(col("variants"), "TEXT"), {
            [Op.iLike]: queryLike,
          }),
        ],
      });
    }

    const result = await Product.findAndCountAll({
      where: conditions.length ? { [Op.and]: conditions } : {},
      limit,
      offset: (page - 1) * limit,
      order: getProductOrder(sort),
    });

    return res.status(200).json({
      success: true,
      data: {
        items: result.rows,
        pagination: {
          page,
          limit,
          totalItems: result.count,
          totalPages: Math.ceil(result.count / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProduct,
  updateProduct,
  getProductById,
  deleteProduct,
  searchProducts,
};
