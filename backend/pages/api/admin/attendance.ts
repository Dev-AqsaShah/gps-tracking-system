import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const records = await prisma.attendance.findMany({
    orderBy: { timeIn: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true, companyName: true } } },
  })
  res.status(200).json({ records })
}
