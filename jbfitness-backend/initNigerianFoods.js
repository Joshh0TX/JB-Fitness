import mysql from "mysql2/promise";
import dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const initDatabase = async () => {
  let connection;
  try {
    // Create connection (note: host might be a full URL for Railway)
    const config = {
      host: process.env.MYSQL_URL,
      user: process.env.MYSQLUSER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQLPORT || 3306,
    };

    console.log("Connecting to database...");
    console.log(`Host: ${config.host}, User: ${config.user}, Database: ${config.database}`);

    connection = await mysql.createConnection(config);

    // Read the SQL file
    const sqlContent = fs.readFileSync("./jbfitness_nigerian_foods.sql", "utf8");

    // Split by semicolon and execute each statement
    const statements = sqlContent.split(";").filter((stmt) => stmt.trim().length > 0);

    console.log(`Found ${statements.length} SQL statements`);

    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      // Skip comments and MySQL-specific directives
      if (!trimmedStatement.startsWith("/*") && !trimmedStatement.startsWith("!")) {
        try {
          console.log(`Executing: ${trimmedStatement.substring(0, 100)}...`);
          await connection.execute(trimmedStatement);
        } catch (error) {
          // Ignore if table already exists or other non-critical errors
          if (!error.message.includes("already exists")) {
            console.log(`Note: ${error.message}`);
          }
        }
      }
    }

    console.log("✅ Nigerian foods table initialized successfully!");

    // Verify by checking if table exists and counting rows
    const [tables] = await connection.query("SHOW TABLES LIKE 'nigerian_foods'");
    if (tables.length > 0) {
      const [foods] = await connection.query("SELECT COUNT(*) as count FROM nigerian_foods");
      console.log(`✅ Table exists with ${foods[0].count} foods`);
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

initDatabase();
