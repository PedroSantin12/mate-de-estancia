const express = require("express");
const basicAuth = require("../middlewares/basicAuth");
const {
  createProduct,
  getProductById,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController");

const router = express.Router();

router.post("/products", basicAuth, createProduct);
router.delete("/product/:id", basicAuth, deleteProduct);
router.get("/product/:id", getProductById);
router.get("/search", searchProducts);

module.exports = router;
