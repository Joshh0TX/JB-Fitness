import axios from "axios";
import prisma from "../../config/db.js";

const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";
const USDA_FOOD = "https://api.nal.usda.gov/fdc/v1/food";

const NIGERIAN_FOODS_FALLBACK = [
  { food_name: "Jollof Rice", serving_size: "1 cup", calories: 320, protein: 6, carbs: 55, fat: 8 },
  { food_name: "Pounded Yam", serving_size: "1 wrap", calories: 420, protein: 4, carbs: 95, fat: 1 },
  { food_name: "Egusi Soup", serving_size: "1 bowl", calories: 280, protein: 12, carbs: 18, fat: 16 },
  { food_name: "Suya", serving_size: "1 skewer", calories: 280, protein: 28, carbs: 5, fat: 15 },
  { food_name: "Moin Moin", serving_size: "1 piece", calories: 220, protein: 8, carbs: 22, fat: 10 },
  { food_name: "Akara", serving_size: "1 piece", calories: 190, protein: 7, carbs: 18, fat: 9 },
  { food_name: "Eba (Garri)", serving_size: "1 wrap", calories: 360, protein: 2, carbs: 85, fat: 0.5 },
  { food_name: "Amala", serving_size: "1 wrap", calories: 350, protein: 3, carbs: 80, fat: 0.5 },
];

const findNutrient = (nutrients = [], matchWords = []) => {
  for (const n of nutrients) {
    const name = (n.nutrientName || n.name || "").toLowerCase();
    if (matchWords.some((w) => name.includes(w))) return n.value ?? n.amount ?? 0;
  }
  return 0;
};

export const searchNutritionService = async (query) => {
  const lower = query.trim().toLowerCase();

  // Try USDA
  if (process.env.USDA_API_KEY) {
    try {
      const response = await axios.post(`${USDA_SEARCH}?api_key=${process.env.USDA_API_KEY}`,
        { query: query.trim(), pageSize: 10 },
        { headers: { "Content-Type": "application/json" } }
      );
      const foods = response.data.foods || [];
      if (foods.length > 0) {
        return foods.map((f) => ({
          name: f.description || "Unknown",
          fdcId: f.fdcId,
          source: "USDA",
          calories: Math.round(findNutrient(f.foodNutrients, ["energy", "calories"])),
          protein: Math.round(findNutrient(f.foodNutrients, ["protein"])),
          carbs: Math.round(findNutrient(f.foodNutrients, ["carbohydrate"])),
          fats: Math.round(findNutrient(f.foodNutrients, ["fat", "total lipid"])),
        }));
      }
    } catch (err) {
      console.warn("USDA search failed:", err.message);
    }
  }

  // Try Nigerian foods DB
  try {
    const foods = await prisma.nigerian_foods.findMany({
      where: { food_name: { contains: lower, mode: "insensitive" } },
      take: 20,
    });
    if (foods.length > 0) {
      return foods.map((f) => ({ name: f.food_name, source: "Nigerian Foods Database", serving_size: f.serving_size, calories: f.calories, protein: f.protein, carbs: f.carbs, fats: f.fat }));
    }
  } catch (err) {
    console.warn("Nigerian foods DB failed, using fallback:", err.message);
    const fallback = NIGERIAN_FOODS_FALLBACK.filter((f) => f.food_name.toLowerCase().includes(lower));
    if (fallback.length > 0) return fallback.map((f) => ({ name: f.food_name, source: "Nigerian Foods (Fallback)", ...f }));
  }

  return [];
};

export const getNutritionDetailsService = async (fdcId, quantity = 1) => {
  if (!process.env.USDA_API_KEY) throw { status: 500, message: "USDA API key not configured" };

  const response = await axios.get(`${USDA_FOOD}/${fdcId}?api_key=${process.env.USDA_API_KEY}`);
  const food = response.data;
  const nutrients = food.foodNutrients || [];
  const multiplier = Number(quantity) || 1;

  return {
    name: food.description || "Unknown",
    fdcId: food.fdcId,
    calories: Math.round(findNutrient(nutrients, ["energy", "calories"]) * multiplier),
    protein: Math.round(findNutrient(nutrients, ["protein"]) * multiplier),
    carbs: Math.round(findNutrient(nutrients, ["carbohydrate"]) * multiplier),
    fats: Math.round(findNutrient(nutrients, ["fat", "total lipid"]) * multiplier),
  };
};

export const scanNutritionImageService = async (imageData) => {
  if (!process.env.GOOGLE_VISION_API_KEY) throw { status: 500, message: "Google Vision API key not configured" };

  const imageContent = String(imageData).replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    { requests: [{ image: { content: imageContent }, features: [{ type: "LABEL_DETECTION", maxResults: 12 }, { type: "WEB_DETECTION", maxResults: 6 }] }] }
  );

  const annotation = response.data?.responses?.[0] || {};
  const labels = [...(annotation.labelAnnotations || []), ...(annotation.webDetection?.webEntities || [])]
    .filter((l) => l.description)
    .slice(0, 6)
    .map((l) => l.description);

  let results = [];
  for (const label of labels.slice(0, 3)) {
    const found = await searchNutritionService(label);
    results = [...results, ...found];
    if (results.length >= 6) break;
  }

  const unique = Array.from(new Map(results.map((r) => [r.name?.toLowerCase(), r])).values()).slice(0, 8);
  return { labels, results: unique };
};