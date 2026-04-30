import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error"],
});

// Serialize BigInt as number globally
BigInt.prototype.toJSON = function () {
  return Number(this);
};

export default prisma;