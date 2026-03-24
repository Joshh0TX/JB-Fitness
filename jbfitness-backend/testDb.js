import db from "./src/config/db.js"; // correct path to your db.js

const test = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM workouts WHERE user_id = ?", [1]);
    console.log("Rows:", rows);
  } catch (error) {
    console.error("DB ERROR:", error);
  } finally {
    db.end();
  }
};

test();
