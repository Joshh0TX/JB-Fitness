import { Pool } from "pg";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const initDatabase = async () => {
  let pool;
  try {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DB_URL ||
      process.env.POSTGRES_URL;

    const config = connectionString
      ? {
          connectionString,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: process.env.PGHOST,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          port: Number(process.env.PGPORT || 5432),
          ssl: { rejectUnauthorized: false },
        };

    console.log("Connecting to database...");
    console.log(`Database: ${config.database || "from connection string"}`);

    pool = new Pool(config);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nigerian_foods (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        serving_size VARCHAR(50),
        calories INT,
        protein NUMERIC(5,2),
        carbs NUMERIC(5,2),
        fat NUMERIC(5,2)
      )
    `);

    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_nigerian_foods_food_name ON nigerian_foods (food_name)"
    );

    // Read the SQL file
    const sqlContent = fs.readFileSync("./jbfitness_nigerian_foods.sql", "utf8");

    const insertStart = sqlContent.indexOf("INSERT INTO nigerian_foods");
    const insertEnd = sqlContent.indexOf(";", insertStart);

    if (insertStart === -1 || insertEnd === -1) {
      throw new Error("Could not find INSERT statement in jbfitness_nigerian_foods.sql");
    }

    const insertSql = sqlContent.slice(insertStart, insertEnd + 1);
    await pool.query(insertSql);

    console.log("✅ Nigerian foods table initialized successfully!");

    // Verify by checking if table exists and counting rows
    const tableCheck = await pool.query(
      "SELECT to_regclass('public.nigerian_foods') AS table_name"
    );
    if (tableCheck.rows[0]?.table_name) {
      const foods = await pool.query("SELECT COUNT(*)::int AS count FROM nigerian_foods");
      console.log(`✅ Table exists with ${foods.rows[0].count} foods`);
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
};

initDatabase();
