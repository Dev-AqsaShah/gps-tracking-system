import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [logs, users] = await Promise.all([
    prisma.gpsLog.findMany({ orderBy: { timestamp: 'desc' }, take: 200 }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ])
  const userMap: Record<number, string> = {}
  for (const u of users) userMap[u.id] = u.name

  const records = logs.map(l => ({ ...l, userName: userMap[l.userId] ?? `User ${l.userId}` }))
  res.status(200).json({ records })
}
