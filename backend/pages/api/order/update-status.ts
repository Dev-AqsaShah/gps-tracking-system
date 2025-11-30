// backend/pages/api/order/update-status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { orderId, status } = req.body
  if (!orderId || !status) return res.status(400).json({ error: 'missing fields' })
  try {
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status }
    })
    return res.status(200).json({ success: true, order })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
