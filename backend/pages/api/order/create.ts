// backend/pages/api/order/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { customerId, userId, items, amount } = req.body
  if (!customerId || !userId || !items) return res.status(400).json({ error: 'missing fields' })
  try {
    const order = await prisma.order.create({
      data: {
        customerId: Number(customerId),
        userId: Number(userId),
        items: items,      // items should be JSON (array of {productId, qty, price})
        amount: Number(amount ?? 0)
      }
    })
    return res.status(201).json({ success: true, order })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
