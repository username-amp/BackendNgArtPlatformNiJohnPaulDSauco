const { User } = require(`../models`);
const hashPassword = require(`../utils/hashPassword`);
const comparePassword = require(`../utils/comparePassword`);
const generateToken = require(`../utils/generateToken`);
const generateCode = require(`../utils/generateCode`);
const sendEmail = require(`../utils/sendEmail`);

const signup = async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      username,
      email,
      password,
      profile_picture,
      cover_photo,
      bio,
      followers,
      following,
      saved_posts,
    } = req.body;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      res.status(400).json({ code: 400, message: "Email already exists" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profile_picture,
      cover_photo,
      bio,
      followers,
      following,
      saved_posts,
    });
    await newUser.save();
    res.status(201).json({
      code: 201,
      status: "success",
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.code = 401;
      throw new Error(`Invalid Credentials`);
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      res.code = 401;
      throw new Error(`Invalid Credentials`);
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true, secure: true });
    res.status(200).json({
      code: 200,
      status: true,
      message: `User logged in Successfully`,
      //  data: { token }
    });
  } catch (error) {
    next(error);
  }
};

const verifyCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.code = 401;
      throw new Error(`User not found`);
    }

    if (user.isVerified) {
      res.code = 400;
      throw new Error(`User already verified`);
    }

    const code = generateCode(6);

    user.verificationCode = code;
    await user.save();

    await sendEmail({
      emailTo: user.email,
      subject: `Email Verification Code`,
      code,
      content: `Verify your account`,
    });

    // send email
    res.status(200).json({
      code: 200,
      status: true,
      message: `User verified successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.code = 404;
      throw new Error(`User Not Found`);
    }

    if (user.verificationCode !== code) {
      res.code = 400;
      throw new Error(`Invalid Verification Code`);
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      code: 200,
      status: true,
      message: `User Verified Successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.code = 404;
      throw new Error(`User Not Found`);
    }

    const code = generateCode(6);

    user.forgotPasswordCode = code;
    await user.save();

    await sendEmail({
      emailTo: user.email,
      subject: `Forgot Password Code`,
      code,
      content: `change your password`,
    });

    res.status(200).json({
      code: 200,
      status: true,
      message: `Forgot Password Code Sent Successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const recoverPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.code = 404;
      throw new Error(`User Not Found`);
    }

    if (user.forgotPasswordCode !== code) {
      res.code = 400;
      throw new Error(`Invalid Forgot Password Code`);
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.forgotPasswordCode = null;
    await user.save();

    res.status(200).json({
      code: 200,
      status: true,
      message: `Password Recovered Successfully`,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { _id } = req.user;

    const user = await User.findById(_id);
    if (!user) {
      res.code = 404;
      throw new Error(`User Not Found`);
    }

    const match = await comparePassword(oldPassword, user.password);
    if (!match) {
      res.code = 400;
      throw new Error(`Old Password does not match`);
    }

    if (oldPassword === newPassword) {
      res.code = 400;
      throw new Error(`You are providing the old password`);
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      code: 200,
      status: true,
      message: `Password Changed Successfully`,
    });

    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { username, email, profile_picture, cover_photo, bio } = req.body;

    const user = await User.findById(_id).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      res.code = 404;
      throw new Error(`User Not Found`);
    }

    if (email) {
      const isUserExist = await User.findOne({ email });
      if (
        isUserExist &&
        isUserExist.email === email &&
        String(user._id) !== String(isUserExist._id)
      ) {
        res.status(400).json({ code: 400, message: "Email already exists" });
        return;
      }
    }

    user.username = username ? username : user.username;
    user.email = email ? email : user.email;
    user.profile_picture = profile_picture
      ? profile_picture
      : user.profile_picture;
    user.cover_photo = cover_photo ? cover_photo : user.cover_photo;
    user.bio = bio ? bio : user.bio;

    if (email) {
      user.isVerified = false;
    }
    await user.save();

    res.status(200).json({
      code: 200,
      status: true,
      message: `Profile Updated Successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  signin,
  verifyCode,
  verifyUser,
  forgotPasswordCode,
  recoverPassword,
  changePassword,
  updateProfile,
};
