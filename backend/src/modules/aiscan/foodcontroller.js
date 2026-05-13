import { detectFood } from "./roboflowservice.js";

export const scanFood = async (req, res) => {
  try {
    const { image } = req.body;

    const result = await detectFood(image);

    const prediction = result.predictions?.[0];

    return res.json({
      food: prediction?.class,
      confidence: prediction?.confidence
    });

  } catch (err) {
    console.log("Food Scan Error:", err.message);

    return res.status(500).json({
      message: "Food scan failed"
    });
  }
};