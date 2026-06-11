const express = require("express");
const { calculateCartSummary } = require("../controllers/cartController");

const router = express.Router();

router.post("/cart", calculateCartSummary);

module.exports = router;
