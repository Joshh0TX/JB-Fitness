export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
