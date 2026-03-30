import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Delete existing user if any
  await prisma.user.deleteMany({});

  // Create the user with credentials
  const user = await prisma.user.create({
    data: {
      email: "venkateshindla8368@gmail.com",
      password: "$2b$10$0FzmFREeApRVMdoqcGXeKeZxc9Cg7XinYo6Do7kOpOoy5P8VKHLwe", // Indla
    },
  });

  console.log("User created:", user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
