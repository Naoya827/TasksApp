import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type UserConfig = {
  name: string;
  oldEmail: string;
  email: string;
  password: string;
};

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`環境変数 ${key} が未設定です`);
  }
  return value;
}

async function updateUser(config: UserConfig) {
  const passwordHash = await bcrypt.hash(config.password, 10);
  const existing = await prisma.user.findUnique({
    where: { email: config.oldEmail },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: config.name,
        email: config.email,
        passwordHash,
      },
    });
    console.log(`Updated: ${config.name} (${config.oldEmail} → ${config.email})`);
    return;
  }

  await prisma.user.upsert({
    where: { email: config.email },
    update: {
      name: config.name,
      passwordHash,
    },
    create: {
      name: config.name,
      email: config.email,
      passwordHash,
    },
  });
  console.log(`Upserted: ${config.name} (${config.email})`);
}

async function main() {
  await updateUser({
    name: process.env.USER_NAOYA_NAME ?? "なおや",
    oldEmail: process.env.USER_NAOYA_OLD_EMAIL ?? "naoya@example.com",
    email: requireEnv("USER_NAOYA_EMAIL"),
    password: requireEnv("USER_NAOYA_PASSWORD"),
  });

  await updateUser({
    name: process.env.USER_AYUMI_NAME ?? "あゆみ",
    oldEmail: process.env.USER_AYUMI_OLD_EMAIL ?? "ayumi@example.com",
    email: requireEnv("USER_AYUMI_EMAIL"),
    password: requireEnv("USER_AYUMI_PASSWORD"),
  });

  console.log("Credentials updated successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
