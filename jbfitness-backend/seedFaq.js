/**
 * Seed FAQ table with default content.
 * Run: node seedFaq.js
 */
import db from "./src/config/db.js";
import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const faqItems = [
  ["For Beginners", "How do I know how many calories I should eat each day?", "A good starting point is to use an online calculator based on your age, weight, height, and activity level. Most adults need between 1,800–2,500 calories per day. JBFitness uses 2,200 as a default goal—you can adjust this in your settings as you learn what works for you.", 0],
  ["For Beginners", "What's the difference between calories consumed and calories burned?", "Calories consumed are what you eat and drink. Calories burned are what your body uses through daily activity and exercise. To lose weight, you generally need to burn more than you consume. To gain weight or build muscle, you may need to consume more.", 1],
  ["For Beginners", "How do I log a meal if I don't know the exact nutrition info?", "Use the search feature in the Nutrition tab to find similar foods. You can also estimate or enter a best guess—approximate tracking is often better than nothing. Over time, you can refine your estimates as you learn.", 2],
  ["For Beginners", "I'm new to working out—where should I start?", "Start with simple, low-impact activities like walking, light jogging, or bodyweight exercises. Aim for 2–3 sessions per week and gradually increase. The Workouts tab lets you log any activity and track your progress.", 3],
  ["For Beginners", "How often should I work out to see results?", "Aim for at least 150 minutes of moderate activity per week (about 30 minutes, 5 days). For strength, 2–3 sessions per week is a good start. Consistency matters more than intensity when you first begin.", 4],
  ["For Beginners", "What are macros (protein, carbs, fats) and why do they matter?", "Macros are the three main nutrients: protein (muscle repair), carbs (energy), and fats (hormones, absorption). A balanced diet helps your body perform and recover. JBFitness uses goals like 200g protein, 300g carbs, and 100g fats—adjust based on your needs.", 5],
  ["For Beginners", "Is it okay to eat more on days I work out?", "Yes. Many people eat slightly more on workout days to fuel recovery. The key is to stay within your overall weekly goals. You can use the dashboard to see your daily totals and adjust as needed.", 6],
  ["For Beginners", "How do I set realistic goals for weight loss or muscle gain?", "For weight loss, aim for 0.5–1 lb per week. For muscle gain, aim for 0.25–0.5 lb per week. Set small, achievable goals and celebrate progress. Use the History and Dashboard tabs to track trends over time.", 7],
  ["General App Usage", "How do I add a workout to my daily log?", "Go to the Workouts tab, search for your exercise, enter the duration or reps, and tap Add. The app will estimate calories burned and add it to your dashboard.", 0],
  ["General App Usage", "How do I search for and log food or meals?", "Open the Nutrition tab and use the search bar to find foods. Select the food, enter the serving size, and add it to your log. Your daily macros and calories will update on the dashboard.", 1],
  ["General App Usage", "Can I edit or delete a workout or meal after logging it?", "Yes. From the Workouts or Nutrition tab, find the item in your log and use the edit or delete option. Changes will reflect immediately on your dashboard.", 2],
  ["General App Usage", "How does the app calculate calories burned during exercise?", "Calories are estimated using formulas based on exercise type, duration, and intensity. For strength exercises, reps and weight may be used. The estimate is a starting point—individual results vary.", 3],
  ["General App Usage", "Where can I see my weekly progress and trends?", "The Dashboard shows your weekly calories burned from workouts and nutrition breakdown. Use the History tab for a longer view of your workouts and meals over time.", 4],
  ["General App Usage", "How do I change my calorie or macro goals?", "Go to Settings > App Preferences (or your profile settings) to adjust calorie and macro targets. These goals will update across the app.", 5],
  ["General App Usage", "Does the app work offline, or do I need internet?", "You need an internet connection to log in and sync data. Some features may be limited offline. We recommend keeping the app updated for the best experience.", 6],
  ["General App Usage", "How do I turn on dark mode or change app preferences?", "Go to Settings > App Preferences. You can switch between Light and Dark mode and adjust notification preferences there.", 7],
  ["General App Usage", "Is my data private and secure?", "Yes. We use encryption and secure practices to protect your data. Your information is not shared with third parties for marketing. See our Privacy Policy for full details.", 8],
  ["General App Usage", "How do I reset my password or recover my account?", 'On the Sign In page, use the "Forgot password?" link. You will receive an email with instructions to reset your password. If you have trouble, contact support.', 9],
];

async function seed() {
  try {
    await db.query(
      "CREATE TABLE IF NOT EXISTS faq (id INT AUTO_INCREMENT PRIMARY KEY, category VARCHAR(100), question TEXT, answer TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
    );
    const [existing] = await db.query("SELECT COUNT(*) as c FROM faq");
    if (existing[0].c > 0) {
      console.log("FAQ table already has data. Skipping seed.");
      process.exit(0);
    }
    for (const [cat, q, a, ord] of faqItems) {
      await db.query(
        "INSERT INTO faq (category, question, answer, sort_order) VALUES (?, ?, ?, ?)",
        [cat, q, a, ord]
      );
    }
    console.log(`Seeded ${faqItems.length} FAQ items.`);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
  process.exit(0);
}

seed();
