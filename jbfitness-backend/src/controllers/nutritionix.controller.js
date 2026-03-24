import axios from "axios";
import db from "../config/db.js";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_FOOD = "https://api.nal.usda.gov/fdc/v1/food";

function findNutrientValue(nutrients = [], matchWords = []) {
  const lower = (s) => (s || "").toLowerCase();
  for (const n of nutrients) {
    const name = lower(n.nutrientName || n.name || (n.nutrient && n.nutrient.name) || "");
    const value = n.value ?? n.amount ?? (n.nutrient && n.nutrient.value) ?? 0;
    if (matchWords.some((w) => name.includes(w))) return value || 0;
  }
  return 0;
}

export const searchNutrition = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const searchQuery = query.trim().toLowerCase();

    // Step 1: Try USDA API first
    let foods = [];
    let usedUSDA = false;

    if (process.env.USDA_API_KEY) {
      try {
        const response = await axios.post(
          `${USDA_SEARCH}?api_key=${process.env.USDA_API_KEY}`,
          { query: query.trim(), pageSize: 10 },
          { headers: { "Content-Type": "application/json" } }
        );

        foods = response.data.foods || [];
        usedUSDA = foods.length > 0;
      } catch (error) {
        console.warn("USDA API search failed, will try Nigerian foods fallback:", error.message);
      }
    }

    // Step 2: If USDA didn't return results, try Nigerian foods database
    if (foods.length === 0) {
      try {
        const connection = await db.getConnection();
        try {
          const [nigerianFoods] = await connection.query(
            "SELECT id, food_name, serving_size, calories, protein, carbs, fat FROM nigerian_foods WHERE LOWER(food_name) LIKE ?",
            [`%${searchQuery}%`]
          );

          if (nigerianFoods && nigerianFoods.length > 0) {
            foods = nigerianFoods.map((f) => ({
              name: f.food_name,
              source: "Nigerian Foods Database",
              serving_size: f.serving_size,
              calories: Math.round(f.calories || 0),
              protein: Math.round(f.protein || 0),
              carbs: Math.round(f.carbs || 0),
              fats: Math.round(f.fat || 0),
            }));
          }
        } finally {
          connection.release();
        }
      } catch (dbError) {
        console.warn("Nigerian foods database query failed:", dbError.message);
      }
    }

    // If still no results
    if (foods.length === 0) {
      return res.status(404).json({ message: "No foods found", results: [] });
    }

    // Format results
    const cleaned = foods.map((f) => {
      if (f.fdcId) {
        // USDA format
        const nutrients = f.foodNutrients || [];
        const calories = findNutrientValue(nutrients, ["energy", "calories"]) || 0;
        const protein = findNutrientValue(nutrients, ["protein"]) || 0;
        const carbs = findNutrientValue(nutrients, ["carbohydrate", "carb"]) || 0;
        const fats = findNutrientValue(nutrients, ["fat", "total lipid"]) || 0;

        return {
          name: f.description || f.foodName || f.brandName || "Unknown",
          fdcId: f.fdcId,
          brandOwner: f.brandOwner || f.brandName || null,
          source: "USDA",
          calories: Math.round(calories),
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fats: Math.round(fats),
        };
      } else {
        // Nigerian foods format
        return {
          name: f.name || f.food_name,
          source: f.source || "Nigerian Foods Database",
          serving_size: f.serving_size,
          calories: f.calories || 0,
          protein: f.protein || 0,
          carbs: f.carbs || 0,
          fats: f.fats || 0,
        };
      }
    });

    res.status(200).json({ 
      message: "Found", 
      results: cleaned,
      source: usedUSDA ? "USDA" : "Nigerian Foods Database"
    });
  } catch (error) {
    console.error("Search error:", error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      message: error.response?.data?.message || "Search failed",
      error: error.message,
    });
  }
};

export const getNutritionDetails = async (req, res) => {
  try {
    const { fdcId, quantity = 1 } = req.body;

    if (!fdcId) {
      return res.status(400).json({ message: "fdcId is required" });
    }

    if (!process.env.USDA_API_KEY) {
      return res.status(500).json({
        message: "USDA API key not configured. Set USDA_API_KEY in your backend .env",
      });
    }

    const response = await axios.get(`${USDA_FOOD}/${fdcId}?api_key=${process.env.USDA_API_KEY}`);
    const food = response.data;

    const nutrients = food.foodNutrients || [];

    const calories = findNutrientValue(nutrients, ["energy", "calories"]) || 0;
    const protein = findNutrientValue(nutrients, ["protein"]) || 0;
    const carbs = findNutrientValue(nutrients, ["carbohydrate"]) || 0;
    const fats = findNutrientValue(nutrients, ["fat", "total lipid"]) || 0;

    const multiplier = Number(quantity) || 1;

    res.status(200).json({
      name: food.description || food.foodName || "Unknown",
      fdcId: food.fdcId,
      calories: Math.round((calories || 0) * multiplier),
      protein: Math.round((protein || 0) * multiplier),
      carbs: Math.round((carbs || 0) * multiplier),
      fats: Math.round((fats || 0) * multiplier),
    });
  } catch (error) {
    console.error("USDA details error:", error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({ message: "Failed to fetch food details", error: error.message });
  }
};
