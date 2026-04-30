import prisma from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const AUTH_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const registerService = async ({ username, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const existing = await prisma.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw { status: 400, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      name: username,
      email: normalizedEmail,
      password_hash: hashedPassword,
    },
  });

  const token = jwt.sign(
    { id: user.id, username: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: AUTH_TOKEN_EXPIRES_IN }
  );

  return { token, user: { id: user.id, username: user.name, email: user.email } };
};

export const loginService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const passwordHash = user.password_hash || user.password;
  if (!passwordHash) {
    throw { status: 500, message: "User account is not configured correctly" };
  }

  const isMatch = await bcrypt.compare(password, passwordHash);
  if (!isMatch) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const displayName = user.name || user.username || "User";

  const token = jwt.sign(
    { id: user.id, username: displayName, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: AUTH_TOKEN_EXPIRES_IN }
  );

  return { token, user: { id: user.id, username: displayName, email: user.email } };
};