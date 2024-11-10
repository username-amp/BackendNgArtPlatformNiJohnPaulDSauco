const express = require(`express`)
const router = express.Router()
const { authController } = require(`../controllers`)
const { signupValidation, signinValidator, emailValidator } = require(`../validators/auth`)
const validate = require(`../validators/validate`)

router.post(`/signup`,signupValidation,validate, authController.signup)

router.post(`/signin`, signinValidator,validate, authController.signin)

router.post(`/send-verification-email`,emailValidator,validate, authController.verifyCode)

module.exports = router