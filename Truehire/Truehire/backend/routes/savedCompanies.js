const express = require("express");
const { verifyToken } = require("../middleware/auth");
const savedCompaniesController = require("../controllers/savedCompaniesController");

const router = express.Router();

router.post("/:companyId", verifyToken, savedCompaniesController.saveCompany);
router.delete("/:companyId", verifyToken, savedCompaniesController.unsaveCompany);
router.get("/", verifyToken, savedCompaniesController.getSavedCompanies);
router.get("/check/:companyId", verifyToken, savedCompaniesController.checkCompanySaved);

module.exports = router;
