import { getUserBadgesService } from "./badges.service.js";

export const getUserBadges = async (req, res) => {
  try {
    const badges = await getUserBadgesService(req.user.id);
    return res.json({ badges });
  } catch (err) {
    console.error("Get user badges error:", err);
    return res.status(500).json({ message: "Failed to fetch badges" });
  }
};