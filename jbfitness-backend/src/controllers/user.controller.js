import db from "../config/db.js";

const PROFILE_COLUMNS = [
  "phone",
  "date_of_birth",
  "gender",
  "address",
  "city",
  "state",
  "zip_code",
  "country",
];

let profileColumnsEnsured = false;

const ensureProfileColumns = async () => {
  if (profileColumnsEnsured) return;

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100)
  `);

  profileColumnsEnsured = true;
};

const toClientProfile = (row = {}) => ({
  id: row.id,
  username: row.name || "",
  email: row.email || "",
  phone: row.phone || "",
  dateOfBirth: row.date_of_birth || "",
  gender: row.gender || "",
  address: row.address || "",
  city: row.city || "",
  state: row.state || "",
  zipCode: row.zip_code || "",
  country: row.country || "",
});

const normalizeString = (value, maxLength) => {
  if (value == null) return "";
  const trimmed = String(value).trim();
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const normalizeDateInput = (value) => {
  const dateStr = normalizeString(value, 10);
  if (!dateStr) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  return dateStr;
};

export const getCurrentUser = async (req, res) => {
  try {
    await ensureProfileColumns();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, phone, date_of_birth, gender, address, city, state, zip_code, country
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(toClientProfile(rows[0]));
  } catch (err) {
    console.error("Failed to fetch user profile:", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    await ensureProfileColumns();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = req.body || {};

    const username = normalizeString(payload.username, 100);
    const email = normalizeString(payload.email, 100).toLowerCase();
    const phone = normalizeString(payload.phone, 30);
    const dateOfBirth = normalizeDateInput(payload.dateOfBirth);
    const gender = normalizeString(payload.gender, 20);
    const address = normalizeString(payload.address, 500);
    const city = normalizeString(payload.city, 100);
    const state = normalizeString(payload.state, 100);
    const zipCode = normalizeString(payload.zipCode, 20);
    const country = normalizeString(payload.country, 100);

    if (!username || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const [emailRows] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, userId]
    );

    if (emailRows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    await db.query(
      `UPDATE users
       SET name = ?,
           email = ?,
           phone = ?,
           date_of_birth = ?,
           gender = ?,
           address = ?,
           city = ?,
           state = ?,
           zip_code = ?,
           country = ?
       WHERE id = ?`,
      [
        username,
        email,
        phone || null,
        dateOfBirth,
        gender || null,
        address || null,
        city || null,
        state || null,
        zipCode || null,
        country || null,
        userId,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, name, email, phone, date_of_birth, gender, address, city, state, zip_code, country
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "Profile updated successfully", user: toClientProfile(rows[0]) });
  } catch (err) {
    console.error("Failed to update user profile:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};
