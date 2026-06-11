const express = require("express");

const router = express.Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      service: "mate-de-estancia-api",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
