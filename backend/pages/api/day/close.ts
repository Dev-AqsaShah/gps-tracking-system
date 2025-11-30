// backend/pages/api/day/close.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, totalOrders, totalReturns, totalVisits } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })
  try {
    const dc = await prisma.dayClosing.create({
      data: {
        userId: Number(userId),
        totalOrders: Number(totalOrders ?? 0),
        totalReturns: Number(totalReturns ?? 0),
        totalVisits: Number(totalVisits ?? 0)
      }
    })
    return res.status(201).json({ success: true, dc })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
