import { Context } from "hono";
import { PrismaClient } from "../generated/prisma/client";
import { Env } from "../types/types";
import { env } from "hono/adapter";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | undefined;

export const createPrismaClient = (c: Context<Env>) => {
  if (!prisma) {
    const { DATABASE_URL } = env<Env["Bindings"]>(c);
    const adapter = new PrismaPg({ connectionString: DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
};
