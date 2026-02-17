import axios from "axios";

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

    if (!process.env.USDA_API_KEY) {
      return res.status(500).json({
        message: "USDA API key not configured. Set USDA_API_KEY in your backend .env",
      });
    }

    const response = await axios.post(
      `${USDA_SEARCH}?api_key=${process.env.USDA_API_KEY}`,
      { query: query.trim(), pageSize: 10 },
      { headers: { "Content-Type": "application/json" } }
    );

    const foods = response.data.foods || [];

    if (foods.length === 0) {
      return res.status(404).json({ message: "No foods found", results: [] });
    }

    const cleaned = foods.map((f) => {
      const nutrients = f.foodNutrients || f.foodNutrients || [];

      const calories = findNutrientValue(nutrients, ["energy", "calories"]) || 0;
      const protein = findNutrientValue(nutrients, ["protein"]) || 0;
      const carbs = findNutrientValue(nutrients, ["carbohydrate", "carb"]) || 0;
      const fats = findNutrientValue(nutrients, ["fat", "total lipid"]) || 0;

      return {
        name: f.description || f.foodName || f.brandName || "Unknown",
        fdcId: f.fdcId,
        brandOwner: f.brandOwner || f.brandName || null,
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
      };
    });

    res.status(200).json({ message: "Found", results: cleaned });
  } catch (error) {
    console.error("USDA search error:", error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      message: error.response?.data?.message || "USDA search failed",
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
