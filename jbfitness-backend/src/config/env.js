import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envName = String(process.env.NODE_ENV || "").trim().toLowerCase();

const envCandidatesByMode = {
  production: [".env.production", ".env"],
  development: [".env.development", ".env"],
  test: [".env.test", ".env"],
};

const defaultCandidates = [".env", ".env.production", ".env.development"];
const candidates = envCandidatesByMode[envName] || defaultCandidates;

for (const fileName of candidates) {
  const fullPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(fullPath)) {
    continue;
  }

  dotenv.config({ path: fullPath });
  process.env.ENV_FILE_USED = fileName;
  break;
}
