import { detectFood } from "./roboflowservice.js";

export const scanFood = async (req, res) => {
  try {

    console.log("===== AI SCAN STARTED =====");

    const { image } = req.body;

    // Check image exists
    if (!image) {
      console.log("No image received");

      return res.status(400).json({
        error: "No image provided"
      });
    }

    console.log("Image received");
    console.log("Image size:", image.length);

    // Send to Roboflow
    const result = await detectFood(image);

    console.log("Roboflow FULL Response:");
    console.log(JSON.stringify(result, null, 2));

    const prediction = result.predictions?.[0];

    // No predictions returned
    if (!prediction) {

      console.log("No predictions found");

      return res.status(200).json({
        error: "No food detected",
        raw: result
      });
    }

    console.log("Prediction found:", prediction.class);

    return res.json({
      food: prediction.class,
      confidence: prediction.confidence
    });

  } catch (err) {

    console.log("===== AI SCAN ERROR =====");
    console.log(err.message);

    // Axios / Roboflow detailed errors
    if (err.response) {

      console.log("Roboflow Error Status:", err.response.status);

      console.log("Roboflow Error Data:");
      console.log(err.response.data);
    }

    return res.status(500).json({
      error: "Food scan failed",
      message: err.message
    });
  }
};