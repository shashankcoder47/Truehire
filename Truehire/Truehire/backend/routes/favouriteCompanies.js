const express = require("express");
const { verifyToken, requireUser } = require("../middleware/auth");
const favouriteCompaniesController = require("../controllers/favouriteCompaniesController");

const router = express.Router();

router.post("/:companyId", verifyToken, requireUser, favouriteCompaniesController.favouriteCompany);
router.delete("/:companyId", verifyToken, requireUser, favouriteCompaniesController.unfavouriteCompany);
router.get("/check/:companyId", verifyToken, requireUser, favouriteCompaniesController.checkFavouriteCompany);
router.get("/", verifyToken, requireUser, favouriteCompaniesController.getFavouriteCompanies);

module.exports = router;
