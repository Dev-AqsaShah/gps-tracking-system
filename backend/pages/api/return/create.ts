// backend/pages/api/return/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { orderId, reason, photoUrl, lat, lng } = req.body
  if (!orderId || !reason) return res.status(400).json({ error: 'missing fields' })
  try {
    const ret = await prisma.return.create({
      data: {
        orderId: Number(orderId),
        reason,
        photoUrl: photoUrl ?? null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null
      }
    })
    return res.status(201).json({ success: true, ret })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
