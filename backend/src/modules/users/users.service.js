import prisma from "../../config/db.js";

const toClientProfile = (user) => ({
  id: user.id,
  username: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  dateOfBirth: user.date_of_birth || "",
  gender: user.gender || "",
  address: user.address || "",
  city: user.city || "",
  state: user.state || "",
  zipCode: user.zip_code || "",
  country: user.country || "",
});

export const getCurrentUserService = async (userId) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: "User not found" };
  return toClientProfile(user);
};

export const updateCurrentUserService = async (userId, payload) => {
  const { username, email, phone, dateOfBirth, gender, address, city, state, zipCode, country } = payload;

  if (!username || !email) throw { status: 400, message: "Name and email are required" };

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.users.findFirst({
    where: { email: normalizedEmail, NOT: { id: userId } },
  });
  if (existing) throw { status: 400, message: "Email already in use" };

  const user = await prisma.users.update({
    where: { id: userId },
    data: {
      name: username.trim().slice(0, 100),
      email: normalizedEmail,
      phone: phone?.trim().slice(0, 30) || null,
      date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender?.trim().slice(0, 20) || null,
      address: address?.trim().slice(0, 500) || null,
      city: city?.trim().slice(0, 100) || null,
      state: state?.trim().slice(0, 100) || null,
      zip_code: zipCode?.trim().slice(0, 20) || null,
      country: country?.trim().slice(0, 100) || null,
    },
  });

  return toClientProfile(user);
};