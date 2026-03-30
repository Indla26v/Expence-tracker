import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");
const adapter = new PrismaNeon(sql);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: process.env.APP_USER_EMAIL },
    });

    if (existingUser) {
      console.log("✓ User already exists");
      return;
    }

    // Create user with credentials from env
    const user = await prisma.user.create({
      data: {
        email: process.env.APP_USER_EMAIL || "test@example.com",
        password: process.env.APP_USER_PASSWORD_HASH || "",
      },
    });

    console.log("✓ User created:", user.email);
  } catch (error) {
    console.log("Note: Seeding optional -", error instanceof Error ? error.message : "unknown error");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
});
