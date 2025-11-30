// backend/pages/api/attendance/mark.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { userId, lat, lng, photoUrl } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const attendance = await prisma.attendance.create({
      data: {
        userId: Number(userId),
        timeIn: new Date(),
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        photoUrl: photoUrl ?? null,
      },
    })

    return res.status(201).json({ success: true, attendance })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server error' })
  }
}
