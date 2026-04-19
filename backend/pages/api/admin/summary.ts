import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [users, customers, orders, visits, returns_, gpsLogs] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.order.count(),
    prisma.visit.count(),
    prisma.return.count(),
    prisma.gpsLog.count(),
  ])
  res.status(200).json({ users, customers, orders, visits, returns: returns_, gpsLogs })
}
