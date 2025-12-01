import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // Allows global variable in dev to persist across HMR
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use global variable to avoid multiple instances
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

export default prisma;
