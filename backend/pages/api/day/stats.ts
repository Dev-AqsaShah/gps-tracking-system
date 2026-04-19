import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = Number(req.query.userId)
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  try {
    const [orders, returns, visits] = await Promise.all([
      prisma.order.count({ where: { userId, createdAt: { gte: todayStart } } }),
      prisma.return.count({ where: { order: { userId }, createdAt: { gte: todayStart } } }),
      prisma.visit.count({ where: { userId, createdAt: { gte: todayStart } } }),
    ])
    return res.status(200).json({ success: true, stats: { orders, returns, visits } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
