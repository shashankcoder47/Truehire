const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { verifyToken, requireUser } = require("../middleware/auth");

router.get("/", reviewController.getReviews);
router.post("/", verifyToken, requireUser, reviewController.createReview);

module.exports = router;
