import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Delete existing user if any
    await prisma.user.deleteMany({});

    // Create the user with credentials
    const user = await prisma.user.create({
      data: {
        email: "venkateshindla8368@gmail.com",
        password: "$2b$10$0FzmFREeApRVMdoqcGXeKeZxc9Cg7XinYo6Do7kOpOoy5P8VKHLwe", // Indla
      },
    });

    console.log("✅ User created:", user);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
