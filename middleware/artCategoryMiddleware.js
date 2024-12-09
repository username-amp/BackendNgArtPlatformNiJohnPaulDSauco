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
      "installation art",
      "performance art",
      "textile art",
      "street photography",
      "fine art photography",
      "fashion design",
      "crafts",
      "metalwork",
      "woodwork",
      "ceramics",
      "pottery",
      "printmaking",
      "stained glass",
      "photomontage",
      "vintage photography",
      "collage art",
      "abstract sculpture",
      "3D art",
      "kinetic art",
      "art nouveau",
      "baroque art",
      "renaissance art",
      "art brut",
      "outsider art",
      "digital installation",
      "conceptual art",
      "op art",
      "video art",
      "new media art",
      "sound art",
      "street installation",
      "public art",
      "interactive art",
      "urban art",
      "hair",
      "eyebrow",
      "head",
      "lips",
      "black hair",
      "eyelash",
      "facial expression",
      "tooth",
      "happiness",
      "pink",
      "diorama",
      "miniature",
      "model art",
      "craft",
      "art model",
      "architectural model",
      "miniature model",
      "handicraft",
      "wooden sculpture",
      "stone carving",
      "ceramic sculpture",
      "origami",
      "mosaic art",
      "embroidery",
      "jewelry design",
      "leathercraft",
      "pottery craft",
      "outer space",
      "astronomical object",
      "black",
      "astronomy",
      "night",
      "purple",
      "universe",
      "darkness",
      "graphics",
      "fractal art",
      "scale model",
      "woodwork",
      "wooden sculpture",
      "plastic art",
      "plywood art",
      "model building",
      "architectural model",
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
