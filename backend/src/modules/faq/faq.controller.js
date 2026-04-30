import { getFaqService } from "./faq.service.js";

export const getFaq = async (req, res) => {
  try {
    const faq = await getFaqService();
    return res.json(faq);
  } catch (err) {
    console.error("FAQ error:", err);
    return res.status(500).json({ message: "Failed to fetch FAQ" });
  }
};