import axios from "axios";

/**
 * Search for nutrition data from Nutritionix API
 * Free API endpoint (no key required)
 */
export const searchNutrition = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Nutritionix Natural Nutrients Endpoint
    // No API key required for this endpoint
    const nutritionixUrl = "https://api.nutritionix.com/v2/natural/nutrients";

    const response = await axios.post(
      nutritionixUrl,
      { query: query.trim() },
      {
        headers: {
          "x-app-id": process.env.NUTRITIONIX_APP_ID || "1",
          "x-app-key": process.env.NUTRITIONIX_API_KEY || "nix_application_id",
          "Content-Type": "application/json",
        },
      }
    );

    // Extract nutrition data from response
    const results = response.data.foods || [];

    if (results.length === 0) {
      return res.status(404).json({
        message: "No nutrition data found for that query",
        results: [],
      });
    }

    // Parse and return clean nutrition data
    const cleanedResults = results.map((food) => ({
      name: food.food_name || "Unknown",
      serving_qty: food.serving_qty || 1,
      serving_unit: food.serving_unit || "serving",
      calories: Math.round(food.nf_calories || 0),
      protein: Math.round(food.nf_protein || 0),
      carbs: Math.round(food.nf_total_carbohydrate || 0),
      fats: Math.round(food.nf_total_fat || 0),
      fiber: Math.round(food.nf_dietary_fiber || 0),
      sugar: Math.round(food.nf_sugars || 0),
    }));

    res.status(200).json({
      message: "Nutrition data found",
      results: cleanedResults,
    });
  } catch (error) {
    console.error("Nutritionix API error:", error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.status(401).json({
        message: "Nutritionix API authentication failed",
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        message: "No foods found matching your search",
        results: [],
      });
    }

    res.status(500).json({
      message: "Failed to fetch nutrition data",
      error: error.message,
    });
  }
};

/**
 * Get detailed nutrition info with optional serving size multiplier
 */
export const getNutritionDetails = async (req, res) => {
  try {
    const { food_name, quantity = 1 } = req.body;

    if (!food_name) {
      return res
        .status(400)
        .json({ message: "Food name is required" });
    }

    const nutritionixUrl = "https://api.nutritionix.com/v2/natural/nutrients";

    const response = await axios.post(
      nutritionixUrl,
      { query: `${quantity} ${food_name}` },
      {
        headers: {
          "x-app-id": process.env.NUTRITIONIX_APP_ID || "1",
          "x-app-key": process.env.NUTRITIONIX_API_KEY || "nix_application_id",
          "Content-Type": "application/json",
        },
      }
    );

    const food = response.data.foods?.[0];

    if (!food) {
      return res.status(404).json({
        message: "Food not found",
      });
    }

    res.status(200).json({
      name: food.food_name,
      serving_qty: food.serving_qty,
      serving_unit: food.serving_unit,
      calories: Math.round(food.nf_calories),
      protein: Math.round(food.nf_protein),
      carbs: Math.round(food.nf_total_carbohydrate),
      fats: Math.round(food.nf_total_fat),
      fiber: Math.round(food.nf_dietary_fiber),
      sugar: Math.round(food.nf_sugars),
      potassium: Math.round(food.nf_potassium || 0),
      sodium: Math.round(food.nf_sodium || 0),
    });
  } catch (error) {
    console.error("Nutrition details error:", error.message);
    res.status(500).json({
      message: "Failed to fetch nutrition details",
      error: error.message,
    });
  }
};
