const express = require("express");
const router = express.Router();
const { categoryController } = require("../controllers");
const validate = require("../validators/validate");
const isAuth = require("../middleware/isAuth");

router.get("/", isAuth, validate, categoryController.getAllCategories);

router.post(
  "/deleteCategory",
  isAuth,
  validate,
  categoryController.deleteCategory
);

module.exports = router;
