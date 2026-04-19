import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const records = await prisma.return.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.status(200).json({ records })
}
