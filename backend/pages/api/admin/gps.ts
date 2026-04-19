import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const records = await prisma.gpsLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 200,
  })
  res.status(200).json({ records })
}
