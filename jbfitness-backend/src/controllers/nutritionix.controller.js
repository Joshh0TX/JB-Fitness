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
      console.warn("Nigerian foods database query failed:", dbError.message);
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
