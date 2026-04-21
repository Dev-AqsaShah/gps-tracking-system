import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const userId = Number(req.query.userId)
  if (!userId) return res.status(400).json({ error: 'userId required' })

  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.findFirst({
      where: { userId, timeIn: { gte: startOfDay } },
      orderBy: { timeIn: 'desc' },
    })

    return res.status(200).json({ attendance: attendance ?? null })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
