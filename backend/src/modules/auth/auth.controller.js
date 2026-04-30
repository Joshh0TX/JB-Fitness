import { registerService, loginService } from "./auth.service.js";

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  try {
    const data = await registerService({ username, email, password });
    return res.status(201).json({ msg: "User registered successfully", ...data });
  } catch (err) {
    console.error("Register ERROR:", err);
    return res.status(err.status || 500).json({ msg: err.message || "Server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Email and password are required" });
  }

  try {
    const data = await loginService({ email, password });
    return res.json({ msg: "Login successful", ...data });
  } catch (err) {
    console.error("Login ERROR:", err);
    return res.status(err.status || 500).json({ msg: err.message || "Server error" });
  }
};