import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const [totalSalesmen, todayCheckins, activeNow, gpsPoints] = await Promise.all([
    prisma.user.count(),
    prisma.attendance.count({ where: { timeIn: { gte: startOfDay } } }),
    prisma.attendance.count({ where: { timeIn: { gte: startOfDay }, timeOut: null } }),
    prisma.gpsLog.count({ where: { timestamp: { gte: startOfDay } } }),
  ])

  res.status(200).json({ totalSalesmen, todayCheckins, activeNow, gpsPoints })
}
