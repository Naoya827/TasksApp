import { existsSync } from "fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function loadEnv() {
  dotenv.config();
  if (existsSync(".env.credentials")) {
    dotenv.config({ path: ".env.credentials", override: true });
  }
}

type UserConfig = {
  name: string;
  oldEmail: string;
  email: string;
  password: string;
};

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(
      `環境変数 ${key} が未設定です。.env.credentials に書くか、コマンドの前に ${key}=... を付けて実行してください。`
    );
  }
  return value;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL が未設定です。.env.credentials に Render の External Database URL を設定してください。"
    );
  }
  if (url.includes("localhost") || url.includes("（")) {
    throw new Error(
      "DATABASE_URL が localhost またはプレースホルダーのままです。.env.credentials に本番の Render DB URL を設定してください。"
    );
  }
  return url;
}

async function updateUser(
  prisma: PrismaClient,
  config: UserConfig
) {
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
  loadEnv();
  const databaseUrl = requireDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  console.log(
    `Connecting to: ${databaseUrl.replace(/:[^:@/]+@/, ":****@")}`
  );

  await updateUser(prisma, {
    name: process.env.USER_NAOYA_NAME ?? "なおや",
    oldEmail: process.env.USER_NAOYA_OLD_EMAIL ?? "naoya@example.com",
    email: requireEnv("USER_NAOYA_EMAIL"),
    password: requireEnv("USER_NAOYA_PASSWORD"),
  });

  await updateUser(prisma, {
    name: process.env.USER_AYUMI_NAME ?? "あゆみ",
    oldEmail: process.env.USER_AYUMI_OLD_EMAIL ?? "ayumi@example.com",
    email: requireEnv("USER_AYUMI_EMAIL"),
    password: requireEnv("USER_AYUMI_PASSWORD"),
  });

  console.log("Credentials updated successfully.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
