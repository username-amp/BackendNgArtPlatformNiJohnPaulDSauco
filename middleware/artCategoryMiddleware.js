const path = require("path");
const vision = require("@google-cloud/vision");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Post = require("../models/Post"); 

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
    ];

    const matchingLabels = labels.filter((label) => artLabels.includes(label));

   
    const categoryTitle = matchingLabels.join(", ");
    const existingCategory = await Category.findOne({ title: categoryTitle });

    let category;
    if (!existingCategory) {
      category = new Category({ title: categoryTitle });
      await category.save();
    } else {
      category = existingCategory;
    }

    req.body.categoryTitle = category.title;

    next();
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ message: "Error categorizing image based on art" });
  }
};

module.exports = artCategoryMiddleware;
