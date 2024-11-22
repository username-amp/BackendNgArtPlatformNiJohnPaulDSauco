const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/keys");

const isAuth = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = isAuth;
