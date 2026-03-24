// models/User.js (ESM version)

import db from "../config/db.js";   // note the .js extension

const User = {
  findByEmail: (email) => {
    return db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
  },

  create: (name, email, passwordHash) => {
    return db.promise().query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, passwordHash]
    );
  },
};

export default User;

