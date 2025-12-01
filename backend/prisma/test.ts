import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const offices = await prisma.office.findMany();
    res.status(200).json({ success: true, offices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'server error' });
  } finally {
    await prisma.$disconnect();
  }
}
