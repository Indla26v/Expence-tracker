const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`SELECT date_trunc('day', "date") as day FROM "Expense" LIMIT 1`;
  console.log(result);
  console.log("Type of day:", typeof result[0].day, result[0].day);
  await prisma.$disconnect();
}
main().catch(console.error);
