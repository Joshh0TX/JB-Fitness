import prisma from "../../config/db.js";

const FALLBACK_FAQ = [
  {
    category: "For Beginners",
    items: [
      { question: "How do I know how many calories I should eat each day?", answer: "A good starting point is to use an online calculator based on your age, weight, height, and activity level. Most adults need between 1,800–2,500 calories per day. JBFitness uses 2,200 as a default goal." },
      { question: "What's the difference between calories consumed and calories burned?", answer: "Calories consumed are what you eat and drink. Calories burned are what your body uses through daily activity and exercise." },
      { question: "How do I log a meal if I don't know the exact nutrition info?", answer: "Use the search feature in the Nutrition tab to find similar foods. Approximate tracking is often better than nothing." },
      { question: "I'm new to working out—where should I start?", answer: "Start with simple, low-impact activities like walking, light jogging, or bodyweight exercises. Aim for 2–3 sessions per week." },
      { question: "What are macros and why do they matter?", answer: "Macros are the three main nutrients: protein (muscle repair), carbs (energy), and fats (hormones). A balanced diet helps your body perform and recover." },
    ],
  },
  {
    category: "General App Usage",
    items: [
      { question: "How do I add a workout to my daily log?", answer: "Go to the Workouts tab, search for your exercise, enter the duration or reps, and tap Add." },
      { question: "How do I search for and log food or meals?", answer: "Open the Nutrition tab and use the search bar to find foods. Select the food, enter the serving size, and add it to your log." },
      { question: "Can I edit or delete a workout or meal after logging it?", answer: "Yes. From the Workouts or Nutrition tab, find the item in your log and use the edit or delete option." },
      { question: "Is my data private and secure?", answer: "Yes. We use encryption and secure practices to protect your data. Your information is not shared with third parties for marketing." },
    ],
  },
];

export const getFaqService = async () => {
  try {
    const rows = await prisma.faq.findMany({
      orderBy: [{ category: "asc" }, { sort_order: "asc" }, { id: "asc" }],
    });

    if (!rows.length) return FALLBACK_FAQ;

    const byCategory = {};
    for (const row of rows) {
      const cat = row.category || "General";
      if (!byCategory[cat]) byCategory[cat] = { category: cat, items: [] };
      byCategory[cat].items.push({ question: row.question, answer: row.answer });
    }

    return Object.values(byCategory);
  } catch {
    return FALLBACK_FAQ;
  }
};