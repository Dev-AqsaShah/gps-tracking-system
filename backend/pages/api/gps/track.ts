// backend/pages/api/gps/track.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Data = 
  | { success: true; log: any } 
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') 
    return res.status(405).json({ error: 'Method not allowed' })

  const { userId, lat, lng, speed, accuracy, timestamp } = req.body

  if (!userId || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'userId, lat and lng are required' })
  }

  try {
    const log = await prisma.gpsLog.create({
      data: {
        userId: Number(userId),
        lat: Number(lat),
        lng: Number(lng),
        speed: speed != null ? Number(speed) : undefined,
        accuracy: accuracy != null ? Number(accuracy) : undefined,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      },
    })

    return res.status(201).json({ success: true, log })
  } catch (error) {
    console.error('gps/track error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
