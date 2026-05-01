import { getBadgeProgressService, getUserBadgesService } from "./badges.service.js";

export const getBadgeProgress = async (req, res) => {
  try {
    const data = await getBadgeProgressService(req.user.id);
    return res.json(data);
  } catch (err) {
    console.error("Get badge progress error:", err);
    return res.status(500).json({ message: "Failed to fetch badge progress" });
  }
};

export const getUserBadges = async (req, res) => {
  try {
    const badges = await getUserBadgesService(req.user.id);
    return res.json({ badges });
  } catch (err) {
    console.error("Get user badges error:", err);
    return res.status(500).json({ message: "Failed to fetch badges" });
  }
};