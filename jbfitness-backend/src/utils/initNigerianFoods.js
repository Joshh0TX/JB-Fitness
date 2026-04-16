import { sql } from "../config/db-postgres.js";
import * as fs from "fs";

export const initNigerianFoods = async () => {
  try {
    console.log("🍲 Checking Nigerian foods table...");

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'nigerian_foods'
      )
    `;

    if (tableExists[0].exists) {
      // Check if table has data
      const count = await sql`SELECT COUNT(*)::int AS count FROM nigerian_foods`;
      if (count[0].count > 0) {
        console.log(`✅ Nigerian foods table already initialized with ${count[0].count} foods`);
        return;
      }
    }

    console.log("🍲 Initializing Nigerian foods table...");

    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS nigerian_foods (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        serving_size VARCHAR(50),
        calories INT,
        protein NUMERIC(5,2),
        carbs NUMERIC(5,2),
        fat NUMERIC(5,2)
      )
    `;

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_nigerian_foods_food_name ON nigerian_foods (food_name)
    `;

    // Read and insert data
    const sqlContent = fs.readFileSync("./jbfitness_nigerian_foods.sql", "utf8");
    const insertStart = sqlContent.indexOf("INSERT INTO nigerian_foods");
    const insertEnd = sqlContent.indexOf(";", insertStart);

    if (insertStart === -1 || insertEnd === -1) {
      throw new Error("Could not find INSERT statement in jbfitness_nigerian_foods.sql");
    }

    const insertSql = sqlContent.slice(insertStart, insertEnd + 1);
    await sql.unsafe(insertSql);

    // Verify
    const finalCount = await sql`SELECT COUNT(*)::int AS count FROM nigerian_foods`;
    console.log(`✅ Nigerian foods table initialized with ${finalCount[0].count} foods`);

  } catch (error) {
    console.error("❌ Error initializing Nigerian foods:", error.message);
    // Don't throw - we don't want this to crash the app
  }
};