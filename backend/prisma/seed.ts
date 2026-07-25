import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  // 旧 Seed（ore@example.com / 俺）からの移行
  const legacy = await prisma.user.findUnique({
    where: { email: "ore@example.com" },
  });
  if (legacy) {
    await prisma.user.update({
      where: { id: legacy.id },
      data: { name: "なおや", email: "naoya@example.com" },
    });
  }

  const naoya = await prisma.user.upsert({
    where: { email: "naoya@example.com" },
    update: {
      name: "なおや",
      passwordHash,
    },
    create: {
      name: "なおや",
      email: "naoya@example.com",
      passwordHash,
    },
  });

  const ayumi = await prisma.user.upsert({
    where: { email: "ayumi@example.com" },
    update: {
      name: "あゆみ",
      passwordHash,
    },
    create: {
      name: "あゆみ",
      email: "ayumi@example.com",
      passwordHash,
    },
  });

  console.log("Seed completed:", { naoya: naoya.name, ayumi: ayumi.name });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
