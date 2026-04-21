import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })

  try {
    const latest = await prisma.attendance.findFirst({
      where: { userId: Number(userId), timeOut: null },
      orderBy: { timeIn: 'desc' },
    })

    if (!latest) return res.status(404).json({ error: 'No active session found' })

    const updated = await prisma.attendance.update({
      where: { id: latest.id },
      data: { timeOut: new Date() },
    })

    return res.status(200).json({ success: true, attendance: updated })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
