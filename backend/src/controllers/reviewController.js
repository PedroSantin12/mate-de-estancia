const { fn, col } = require("sequelize");
const Product = require("../models/Product");
const Review = require("../models/Review");
const User = require("../models/User");
const AppError = require("../utils/AppError");

function normalizeReview(review, usersById) {
  const data = review.toJSON();
  const user = usersById.get(Number(data.userId));

  return {
    id: data.id,
    productId: data.productId,
    userId: data.userId,
    customerName: user?.name || "Cliente",
    rating: data.rating,
    comment: data.comment,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function getReviewSummary(productIds) {
  const ids = Array.isArray(productIds) ? productIds.map(Number).filter(Boolean) : [Number(productIds)].filter(Boolean);
  if (!ids.length) return new Map();

  const rows = await Review.findAll({
    attributes: [
      "productId",
      [fn("AVG", col("rating")), "average"],
      [fn("COUNT", col("id")), "count"],
    ],
    where: { productId: ids },
    group: ["productId"],
  });

  return new Map(
    rows.map((row) => {
      const data = row.toJSON();
      return [
        Number(data.productId),
        {
          average: Number(Number(data.average).toFixed(1)),
          count: Number(data.count),
        },
      ];
    })
  );
}

async function listProductReviews(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");

    const reviews = await Review.findAll({
      where: { productId: product.id },
      order: [["createdAt", "DESC"]],
    });
    const users = await User.findAll({ where: { id: reviews.map((review) => review.userId) } });
    const usersById = new Map(users.map((user) => [Number(user.id), user]));
    const summary = (await getReviewSummary(product.id)).get(Number(product.id)) || { average: 0, count: 0 };

    return res.json({
      success: true,
      data: {
        summary,
        items: reviews.map((review) => normalizeReview(review, usersById)),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function saveProductReview(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) throw new AppError("Produto não encontrado.", 404, "PRODUCT_NOT_FOUND");

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError("A nota deve ser um número inteiro entre 1 e 5.", 400, "VALIDATION_ERROR");
    }

    if (comment.length < 5 || comment.length > 500) {
      throw new AppError("O comentário deve possuir entre 5 e 500 caracteres.", 400, "VALIDATION_ERROR");
    }

    const [review, created] = await Review.findOrCreate({
      where: { productId: product.id, userId: req.user.id },
      defaults: { productId: product.id, userId: req.user.id, rating, comment },
    });

    if (!created) {
      await review.update({ rating, comment });
    }

    const usersById = new Map([[Number(req.user.id), req.user]]);
    return res.status(created ? 201 : 200).json({
      success: true,
      data: normalizeReview(review, usersById),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getReviewSummary,
  listProductReviews,
  saveProductReview,
};
