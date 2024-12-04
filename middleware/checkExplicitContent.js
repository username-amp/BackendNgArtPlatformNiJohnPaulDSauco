const path = require("path");
const vision = require("@google-cloud/vision");
const mongoose = require("mongoose");
const User = require("../models/User");

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const checkExplicitContent = async (req, res, next) => {
  try {
    console.log("Middleware triggered: checkExplicitContent");

    if (!req.files || !req.files.length) {
      console.log("No files uploaded");
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log(
      "Files received:",
      req.files.map((file) => file.filename)
    );

    const imagePaths = req.files.map((file) =>
      path.resolve(__dirname, "../uploads", file.filename)
    );
    console.log("Resolved image paths:", imagePaths);

    const results = await Promise.all(
      imagePaths.map(async (filePath) => {
        console.log("Analyzing file:", filePath);
        const [result] = await client.safeSearchDetection(filePath);
        console.log(
          "Analysis result for file:",
          filePath,
          result.safeSearchAnnotation
        );
        return result.safeSearchAnnotation;
      })
    );

    console.log("Safe search results:", results);

    const hasExplicitContent = results.some((result) => {
      const { adult, violence, racy } = result;
      console.log(
        "Content flags - Adult:",
        adult,
        "Violence:",
        violence,
        "Racy:",
        racy
      );
      return (
        adult === "VERY_LIKELY" ||
        violence === "VERY_LIKELY" ||
        racy === "VERY_LIKELY"
      );
    });

    if (hasExplicitContent) {
      const { author_id } = req.body;
      if (mongoose.Types.ObjectId.isValid(author_id)) {
        await User.findByIdAndUpdate(author_id, { $inc: { violations: 1 } });
        console.log("Violation count incremented for user:", author_id);
      }
      return res.status(400).json({
        message: "The uploaded image contains highly explicit content.",
      });
    }

    next();
  } catch (error) {
    console.error("Error analyzing explicit content:", error);
    res.status(500).json({ message: "Error analyzing explicit content." });
  }
};

module.exports = { checkExplicitContent };
