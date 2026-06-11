const express = require("express");
const { calculateShippingQuote, finishCheckout } = require("../controllers/checkoutController");
const { jwtAuth } = require("../middlewares/jwtAuth");

const router = express.Router();

router.post("/shipping", calculateShippingQuote);
router.post("/checkout", jwtAuth, finishCheckout);

module.exports = router;
