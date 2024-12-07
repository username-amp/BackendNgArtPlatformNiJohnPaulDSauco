require("dotenv").config();
const vision = require("@google-cloud/vision");

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

async function detectExplicitContent(imagePath) {
  try {
    const [result] = await client.safeSearchDetection(imagePath);
    const detections = result.safeSearchAnnotation;

    console.log("SafeSearch Detection:");
    console.log(`Adult: ${detections.adult}`);
    console.log(`Violence: ${detections.violence}`);
    console.log(`Racy: ${detections.racy}`);

    return detections;
  } catch (error) {
    console.error("Error detecting explicit content:", error);
    throw error;
  }
}

const imagePath =
  "C:\\Users\\Merlyn M. Ramos\\Downloads\\merrill__5_by_joneddd_dinmf4w-375w-2x.jpg";
detectExplicitContent(imagePath).then((detections) => {
  console.log("Explicit Content Analysis Complete");
});
