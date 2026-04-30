import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const users = await prisma.users.findMany({
  take: 5,
  select: { id: true, email: true, password_hash: true }
});

console.log(users);
await prisma.$disconnect();