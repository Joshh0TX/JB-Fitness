import { getCurrentUserService, updateCurrentUserService } from "./users.service.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await getCurrentUserService(req.user.id);
    return res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to fetch user" });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const user = await updateCurrentUserService(req.user.id, req.body);
    return res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(err.status || 500).json({ message: err.message || "Failed to update profile" });
  }
};