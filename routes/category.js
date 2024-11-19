const express = require("express");
const router = express.Router();
const { Category } = require("../models");
const { categoryController } = require("../controllers");
const validate = require("../validators/validate");
const isAuth = require("../middleware/isAuth");

router.get("/", isAuth, validate, categoryController.getAllCategories);

module.exports = router;
