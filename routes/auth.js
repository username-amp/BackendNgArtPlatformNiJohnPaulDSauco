const express = require(`express`);
const router = express.Router();
const { authController } = require(`../controllers`);
const {
  signupValidation,
  signinValidator,
  emailValidator,
  verifyUserValidator,
  recoverPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
} = require(`../validators/auth`);
const validate = require(`../validators/validate`);
const isAuth = require(`../middleware/isAuth`);

router.post(`/signup`, signupValidation, validate, authController.signup);

router.post(`/signin`, signinValidator, validate, authController.signin);

router.post(
  `/send-verification-email`,
  emailValidator,
  validate,
  authController.verifyCode
);

router.post(
  `/verify-user`,
  verifyUserValidator,
  validate,
  authController.verifyUser
);

router.post(
  `/forgot-password-code`,
  emailValidator,
  validate,
  authController.forgotPasswordCode
);

router.post(
  `/recover-password`,
  recoverPasswordValidator,
  validate,
  authController.recoverPassword
);

router.put(
  `/change-password`,
  isAuth,
  changePasswordValidator,
  validate,
  authController.changePassword
);

router.put(
  `/update-profile`,
  isAuth,
  updateProfileValidator,
  validate,
  authController.updateProfile
);

module.exports = router;
