const express = require("express");
const basicAuth = require("../middlewares/basicAuth");
const {
  createProduct,
  getProductById,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController");
const { listProductReviews, saveProductReview } = require("../controllers/reviewController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = express.Router();

router.post("/products", basicAuth, createProduct);
router.delete("/product/:id", basicAuth, deleteProduct);
router.get("/product/:id", getProductById);
router.get("/product/:id/reviews", listProductReviews);
router.post("/product/:id/reviews", jwtAuth, saveProductReview);
router.get("/search", searchProducts);

module.exports = router;
