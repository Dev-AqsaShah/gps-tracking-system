import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [gpsLogs, customers, offices, visits, users] = await Promise.all([
      prisma.gpsLog.findMany({
        orderBy: { timestamp: 'asc' },
        take: 1000,
      }),
      prisma.customer.findMany(),
      prisma.office.findMany(),
      prisma.visit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { customer: { select: { name: true, lat: true, lng: true } } },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, username: true, companyName: true },
      }),
    ])

    // Build user lookup map
    const userMap: Record<number, { name: string; username: string; companyName: string | null }> = {}
    for (const u of users) userMap[u.id] = { name: u.name, username: u.username, companyName: u.companyName }

    // Attach user info to GPS logs
    const gpsLogsWithUser = gpsLogs.map(log => ({
      ...log,
      userName: userMap[log.userId]?.name ?? `User ${log.userId}`,
      userUsername: userMap[log.userId]?.username ?? '',
    }))

    // Get last known position per user
    const lastPositions: Record<number, any> = {}
    for (const log of gpsLogs) {
      lastPositions[log.userId] = {
        userId: log.userId,
        lat: log.lat,
        lng: log.lng,
        timestamp: log.timestamp,
        userName: userMap[log.userId]?.name ?? `User ${log.userId}`,
        userUsername: userMap[log.userId]?.username ?? '',
      }
    }

    res.status(200).json({
      gpsLogs: gpsLogsWithUser,
      lastPositions: Object.values(lastPositions),
      customers,
      offices,
      visits,
      users,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load map data' })
  }
}
