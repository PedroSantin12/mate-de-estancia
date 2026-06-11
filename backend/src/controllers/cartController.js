const { calculateCart } = require("../services/cartService");

async function calculateCartSummary(req, res, next) {
  try {
    const summary = await calculateCart(req.body.items, req.body.cupomCode || req.body.couponCode);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { calculateCartSummary };
