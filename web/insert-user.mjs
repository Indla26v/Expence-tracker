import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  try {
    // Delete existing user
    await prisma.user.deleteMany({});

    // Create user
    const user = await prisma.user.create({
      data: {
        email: "venkateshindla8368@gmail.com",
        password: "$2b$10$0FzmFREeApRVMdoqcGXeKeZxc9Cg7XinYo6Do7kOpOoy5P8VKHLwe",
      },
    });

    console.log("✅ User created:", user);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
