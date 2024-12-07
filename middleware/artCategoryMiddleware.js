const path = require("path");
const vision = require("@google-cloud/vision");
const mongoose = require("mongoose");
const Category = require("../models/Category");

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const artCategoryMiddleware = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imagePaths = req.files.map((file) =>
      path.resolve(__dirname, "../uploads", file.filename)
    );

    const labelDetectionResults = await Promise.all(
      imagePaths.map(async (filePath) => {
        const [result] = await client.labelDetection(filePath);
        return result.labelAnnotations;
      })
    );

    const labels = labelDetectionResults
      .flat()
      .map((label) => label.description.toLowerCase());

    console.log("Detected Labels:", labels);

    const artLabels = [
      "painting",
      "drawing",
      "art",
      "sculpture",
      "photography",
      "abstract",
      "artwork",
      "canvas",
      "digital art",
      "gallery",
      "illustration",
      "portrait",
      "museum",
      "street art",
      "pop art",
      "fine art",
      "graffiti",
      "modern art",
      "oil painting",
      "watercolor",
      "charcoal",
      "collage",
      "mosaic",
      "mixed media",
      "digital painting",
      "concept art",
      "art deco",
      "minimalism",
      "surrealism",
      "impressionism",
      "realism",
      "expressionism",
      "photorealism",
      "interior design",
      "furniture",
      "decoration",
    ];

    const matchingLabels = labels.filter((label) =>
      artLabels.some((artLabel) => label.includes(artLabel))
    );

    if (!matchingLabels.length) {
      req.body.categoryTitle = "Uncategorized Art";
      return next();
    }

    const categoryTitle = matchingLabels[0];

    const existingCategory = await Category.findOne({ title: categoryTitle });

    if (!existingCategory) {
      const newCategory = new Category({ title: categoryTitle });
      await newCategory.save();
      req.body.categoryTitle = newCategory.title;
    } else {
      req.body.categoryTitle = existingCategory.title;
    }

    next();
  } catch (error) {
    console.error("Error analyzing image:", error.message);
    res.status(500).json({ message: "Error categorizing image based on art" });
  }
};

module.exports = artCategoryMiddleware;
