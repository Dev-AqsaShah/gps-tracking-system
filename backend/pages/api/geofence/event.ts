// pages/api/geofence/event.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async (req: { method: string; body: { userId: any; event: any; lat: any; lng: any } }, res: { status: (arg0: number) => { (): any; new(): any; end: { (): any; new(): any }; json: { (arg0: { ok: boolean }): void; new(): any } } }) => {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, event, lat, lng } = req.body
  // Save to gps_logs or separate table
  await prisma.gpsLog.create({
    data: { userId: Number(userId), lat: Number(lat), lng: Number(lng), timestamp: new Date() }
  })
  // optionally: create attendance/active flag change
  res.status(201).json({ ok: true })
}
