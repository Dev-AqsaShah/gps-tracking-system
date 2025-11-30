// backend/pages/api/visit/check-in.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, customerId, lat, lng, notes, photoUrl } = req.body
  if (!userId || !customerId) return res.status(400).json({ error: 'userId/customerId required' })
  try {
    const visit = await prisma.visit.create({
      data: {
        userId: Number(userId),
        customerId: Number(customerId),
        timeIn: new Date(),
        notes: notes ?? null,
        photoUrl: photoUrl ?? null
      }
    })
    return res.status(201).json({ success: true, visit })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
