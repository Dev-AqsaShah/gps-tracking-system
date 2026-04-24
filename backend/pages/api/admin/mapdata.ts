import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [gpsLogs, users] = await Promise.all([
      prisma.gpsLog.findMany({ orderBy: { timestamp: 'asc' }, take: 2000 }),
      prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    ])

    const userMap: Record<number, { name: string; email: string }> = {}
    for (const u of users) userMap[u.id] = { name: u.name, email: u.email }

    // Group logs by user
    const logsByUser: Record<number, typeof gpsLogs> = {}
    for (const log of gpsLogs) {
      if (!logsByUser[log.userId]) logsByUser[log.userId] = []
      logsByUser[log.userId].push(log)
    }

    // Last position + total distance per user
    const lastPositions = Object.entries(logsByUser).map(([uid, logs], i) => {
      const userId = Number(uid)
      const last = logs[logs.length - 1]

      let distanceM = 0
      for (let j = 1; j < logs.length; j++) {
        distanceM += haversine(logs[j - 1].lat, logs[j - 1].lng, logs[j].lat, logs[j].lng)
      }
      const distanceKm = (distanceM / 1000).toFixed(2)

      return {
        userId,
        lat: last.lat,
        lng: last.lng,
        timestamp: last.timestamp,
        userName: userMap[userId]?.name ?? `User ${userId}`,
        userEmail: userMap[userId]?.email ?? '',
        distanceKm,
        totalPoints: logs.length,
      }
    })

    const gpsLogsWithUser = gpsLogs.map(log => ({
      ...log,
      userName: userMap[log.userId]?.name ?? `User ${log.userId}`,
    }))

    res.status(200).json({ gpsLogs: gpsLogsWithUser, lastPositions, users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load map data' })
  }
}
