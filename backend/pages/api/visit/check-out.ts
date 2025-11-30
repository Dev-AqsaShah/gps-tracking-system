// backend/pages/api/visit/check-out.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { visitId } = req.body
  if (!visitId) return res.status(400).json({ error: 'visitId required' })
  try {
    const visit = await prisma.visit.update({
      where: { id: Number(visitId) },
      data: { timeOut: new Date() }
    })
    return res.status(200).json({ success: true, visit })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false })
  }
}
