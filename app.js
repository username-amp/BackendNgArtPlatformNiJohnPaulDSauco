const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const connectMongodb = require("./init/mongodb");
const {
  authRoute,
  categoryRoute,
  postRoute,
  interactionsRoute,
  notificationsRoute,
  userRoute,
} = require("./routes");
const { errorHandler } = require("./middleware/");
const notfound = require("./controllers/notfound");

const app = express();

connectMongodb();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    httpOnly: true,
    
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "500mb" }));
app.use(bodyParser.urlencoded({ limit: "500mb", extended: true }));

app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v2/auth", authRoute);
app.use("/api/v2/category", categoryRoute);
app.use("/api/v2/post", postRoute);
app.use("/api/v2/interactions", interactionsRoute);
app.use(`/api/v2/notifications`, notificationsRoute);
app.use("/api/v2/users", userRoute);

app.use("*", notfound);

app.use(errorHandler);

module.exports = app;
