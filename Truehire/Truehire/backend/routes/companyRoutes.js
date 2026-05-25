const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken, requireUser } = require("../middleware/auth");

router.get("/companies", companyController.getCompanies);
router.get("/companies/ratings", companyController.getCompanyRatingsSummary);
router.get("/companies/ratings/me", verifyToken, requireUser, companyController.getUserCompanyRatings);
router.post("/companies/:id/ratings", verifyToken, requireUser, companyController.rateCompany);

module.exports = router;

