import axios from "axios";
import db from "../config/db.js";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_FOOD = "https://api.nal.usda.gov/fdc/v1/food";

// Fallback Nigerian foods database when DB connection fails
const NIGERIAN_FOODS_FALLBACK = [
  { food_name: "Jollof Rice", serving_size: "1 cup", calories: 320, protein: 6, carbs: 55, fat: 8 },
  { food_name: "Fried Rice", serving_size: "1 cup", calories: 350, protein: 7, carbs: 50, fat: 12 },
  { food_name: "White Rice", serving_size: "1 cup", calories: 205, protein: 4, carbs: 45, fat: 0.5 },
  { food_name: "Coconut Rice", serving_size: "1 cup", calories: 380, protein: 5, carbs: 52, fat: 15 },
  { food_name: "Ofada Rice", serving_size: "1 cup", calories: 210, protein: 5, carbs: 44, fat: 1 },
  { food_name: "Pounded Yam", serving_size: "1 wrap", calories: 420, protein: 4, carbs: 95, fat: 1 },
  { food_name: "Amala", serving_size: "1 wrap", calories: 350, protein: 3, carbs: 80, fat: 0.5 },
  { food_name: "Eba (Garri)", serving_size: "1 wrap", calories: 360, protein: 2, carbs: 85, fat: 0.5 },
  { food_name: "Semovita", serving_size: "1 wrap", calories: 400, protein: 3, carbs: 88, fat: 1 },
  { food_name: "Fufu", serving_size: "1 wrap", calories: 380, protein: 2, carbs: 90, fat: 0.5 },
  { food_name: "Egusi Soup", serving_size: "1 bowl", calories: 280, protein: 12, carbs: 18, fat: 16 },
  { food_name: "Okra Soup", serving_size: "1 bowl", calories: 160, protein: 8, carbs: 12, fat: 9 },
  { food_name: "Pepper Soup", serving_size: "1 bowl", calories: 120, protein: 14, carbs: 5, fat: 5 },
  { food_name: "Tomato Stew", serving_size: "1 cup", calories: 180, protein: 4, carbs: 15, fat: 11 },
  { food_name: "Gari", serving_size: "1 cup", calories: 360, protein: 1, carbs: 88, fat: 0.5 },
  { food_name: "Moin Moin", serving_size: "1 piece", calories: 220, protein: 8, carbs: 22, fat: 10 },
  { food_name: "Akara", serving_size: "1 piece", calories: 190, protein: 7, carbs: 18, fat: 9 },
  { food_name: "Boli (Roasted Plantain)", serving_size: "1 medium", calories: 130, protein: 1, carbs: 32, fat: 0.3 },
  { food_name: "Cassava Fufu", serving_size: "1 wrap", calories: 310, protein: 1, carbs: 74, fat: 0.5 },
  { food_name: "Suya (Spiced Meat Skewer)", serving_size: "1 skewer", calories: 280, protein: 28, carbs: 5, fat: 15 },
  { food_name: "Peppery Beef", serving_size: "1 cup", calories: 320, protein: 32, carbs: 8, fat: 18 },
  { food_name: "Chicken Stew", serving_size: "1 cup", calories: 290, protein: 26, carbs: 10, fat: 16 },
  { food_name: "Fish Stew", serving_size: "1 cup", calories: 240, protein: 24, carbs: 8, fat: 12 },
  { food_name: "Beans and Plantain", serving_size: "1 serving", calories: 340, protein: 12, carbs: 58, fat: 6 },
  { food_name: "Nigerian Salad", serving_size: "1 bowl", calories: 180, protein: 4, carbs: 22, fat: 9 },
  { food_name: "Plantain Chips", serving_size: "1 handful", calories: 150, protein: 1, carbs: 20, fat: 7 },
  { food_name: "Corn Meal Pap", serving_size: "1 cup", calories: 280, protein: 4, carbs: 60, fat: 2 },
];

function findNutrientValue(nutrients = [], matchWords = []) {
  const lower = (s) => (s || "").toLowerCase();
  for (const n of nutrients) {
    const name = lower(n.nutrientName || n.name || (n.nutrient && n.nutrient.name) || "");
    const value = n.value ?? n.amount ?? (n.nutrient && n.nutrient.value) ?? 0;
    if (matchWords.some((w) => name.includes(w))) return value || 0;
  }
  return 0;
}

async function lookupFoodsByQuery(query) {
  if (!query || query.trim() === "") {
    return [];
  }

  const searchQuery = query.trim().toLowerCase();

  // Attempt USDA first (if configured)
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
      console.warn("USDA API search failed, will try fallbacks:", error.message);
    }
  }

  // If no USDA results, fall back to Nigerian database
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
      console.warn("Nigerian foods database query failed, using fallback:", dbError.message);
      // Use fallback Nigerian foods list
      foods = NIGERIAN_FOODS_FALLBACK.filter((f) =>
        f.food_name.toLowerCase().includes(searchQuery)
      ).map((f) => ({
        name: f.food_name,
        source: "Nigerian Foods (Fallback)",
        serving_size: f.serving_size,
        calories: Math.round(f.calories || 0),
        protein: Math.round(f.protein || 0),
        carbs: Math.round(f.carbs || 0),
        fats: Math.round(f.fat || 0),
      }));
    }
  }

  // Format results
  if (foods.length === 0) {
    return [];
  }

  const cleaned = foods.map((f) => {
    if (f.fdcId) {
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
    }

    return {
      name: f.name || f.food_name,
      source: f.source || "Nigerian Foods Database",
      serving_size: f.serving_size,
      calories: f.calories || 0,
      protein: f.protein || 0,
      carbs: f.carbs || 0,
      fats: f.fats || 0,
    };
  });

  return cleaned;
}

export const searchNutrition = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await lookupFoodsByQuery(String(query));

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No foods found", results: [] });
    }

    res.status(200).json({ message: "Found", results, source: "Search" });
  } catch (error) {
    console.error("Search error:", error?.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      message: error.response?.data?.message || "Search failed",
      error: error.message,
    });
  }
};

async function detectFoodLabelsFromImage(base64Image) {
  if (!process.env.GOOGLE_VISION_API_KEY) {
    return [];
  }

  const imageContent = String(base64Image || "").replace(/^data:image\/[a-zA-Z]+;base64,/, "");
  if (!imageContent) return [];

  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageContent },
            features: [
              { type: "LABEL_DETECTION", maxResults: 12 },
              { type: "WEB_DETECTION", maxResults: 6 },
            ],
          },
        ],
      }
    );

    const annotation = response.data?.responses?.[0] || {};
    const labels = (annotation.labelAnnotations || []).map((l) => ({ description: l.description, score: l.score }));
    const webLabels = (annotation.webDetection?.webEntities || []).map((w) => ({ description: w.description, score: w.score }));

    const combined = [...labels, ...webLabels]
      .filter((item) => item.description)
      .reduce((acc, item) => {
        const key = item.description.toLowerCase();
        if (!acc[key] || acc[key].score < item.score) {
          acc[key] = item;
        }
        return acc;
      }, {});

    return Object.values(combined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);
  } catch (error) {
    console.warn("Vision API failed:", error?.response?.data || error.message);
    return [];
  }
}

export const scanNutritionImage = async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ message: "Image is required" });
    }

    const labels = await detectFoodLabelsFromImage(imageData);
    const foodCandidates = labels.map((l) => l.description).filter(Boolean);

    if (foodCandidates.length === 0) {
      return res.status(200).json({ message: "No food labels detected", results: [] });
    }

    // Search using the first useful candidate plus fallback extras
    let finalResults = [];
    for (const candidate of foodCandidates.slice(0, 3)) {
      const found = await lookupFoodsByQuery(candidate);
      if (found && found.length > 0) {
        finalResults = [...finalResults, ...found];
      }
      if (finalResults.length >= 6) break;
    }

    // Deduplicate by name
    const resultByName = new Map();
    for (const item of finalResults) {
      const key = String(item.name || "").toLowerCase();
      if (!key) continue;
      if (!resultByName.has(key)) {
        resultByName.set(key, item);
      }
    }

    const results = Array.from(resultByName.values()).slice(0, 8);

    if (results.length === 0) {
      return res.status(200).json({ message: "No nutrition match found for detected labels", labels: foodCandidates, results: [] });
    }

    return res.status(200).json({ message: "Found via AI image scan", labels: foodCandidates, results });
  } catch (error) {
    console.error("Scan nutrition error:", error?.response?.data || error.message);
    return res.status(500).json({ message: "Failed to scan food image", error: error.message });
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
