const { User, Post } = require(`../models`);
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
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message:
          "Your account has been banned due to violations. Please contact support.",
      });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 4800000,
      sameSite: "Strict",
    });

    return res.status(200).json({
      code: 200,
      status: true,
      message: "User logged in successfully",
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

    if (!email || !code) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: "Email and verification code are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: "User not found.",
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: "Invalid verification code.",
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    return res.status(200).json({
      code: 200,
      status: true,
      message: "User verified successfully!",
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
      return res.status(404).json({ message: "User Not Found" });
    }

    const match = await comparePassword(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Old Password does not match" });
    }

    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "You are providing the old password" });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      code: 200,
      status: true,
      message: "Password Changed Successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;

    const user = await User.findById(_id).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }

    return res.status(200).json({
      code: 200,
      status: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const { username, email, bio } = req.body;

    const profilePicture = req.files?.profile_picture
      ? req.files.profile_picture[0]
      : null;
    const coverPhoto = req.files?.cover_photo ? req.files.cover_photo[0] : null;

    console.log("Received profile picture:", profilePicture);
    console.log("Received cover photo:", coverPhoto);

    const user = await User.findById(_id).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      res
        .status(404)
        .json({ code: 404, status: false, message: "User Not Found" });
      return;
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;

    if (profilePicture) {
      console.log(
        "Setting profile_picture:",
        `/uploads/${profilePicture.filename}`
      );
      user.profile_picture = `/uploads/${profilePicture.filename}`;
    }

    if (coverPhoto) {
      console.log("Setting cover_photo:", `/uploads/${coverPhoto.filename}`);
      user.cover_photo = `/uploads/${coverPhoto.filename}`;
    }

    if (email) {
      user.isVerified = false;
    }

    await user.save();
    console.log("User profile updated in database:", user);

    res.status(200).json({
      code: 200,
      status: true,
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    next(error);
  }
};

const getProfileWithDetails = async (req, res, next) => {
  try {
    const { _id } = req.user;

    const user = await User.findById(_id).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      return res.status(404).json({ code: 404, message: "User not found" });
    }

    const followerCount = user.followers.length;
    const followingCount = user.following.length;
    const postCount = await Post.countDocuments({ user: _id });

    return res.status(200).json({
      code: 200,
      status: true,
      user: {
        username: user.username,
        email: user.email,
        profilePicture: user.profile_picture,
        bio: user.bio,
        followers: followerCount,
        following: followingCount,
        posts: postCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const authorProfileDetails = async (req, res, next) => {
  try {
    const { authorId } = req.params;

    const user = await User.findById(authorId).select(
      "-password -verificationCode -forgotPasswordCode"
    );

    if (!user) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: "User not found",
      });
    }

  

    res.status(200).json({
      code: 200,
      status: true,
      message: "User profile details fetched successfully",
      user: {
        username: user.username,
        email: user.email,
        profilePicture: user.profile_picture,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length,
        posts: await Post.countDocuments({ user: authorId }),
      },
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
  getProfile,
  getProfileWithDetails,
  authorProfileDetails,
};
