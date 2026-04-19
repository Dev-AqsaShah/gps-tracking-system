import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // 1. User
    const user = await prisma.user.upsert({
      where: { id: 1 }, update: {},
      create: { id: 1, name: 'Ali Salesman', phone: '03001234567', role: 'salesman' },
    })

    // 2. Office
    await prisma.office.upsert({
      where: { id: 1 }, update: {},
      create: { id: 1, name: 'Head Office Lahore', lat: 31.5204, lng: 74.3587, radius: 100 },
    })

    // 3. Customers
    const customerData = [
      { name: 'Ahmed Store', area: 'Gulberg', lat: 31.5100, lng: 74.3400 },
      { name: 'Bilal Traders', area: 'Model Town', lat: 31.4800, lng: 74.3200 },
      { name: 'Kareem General Store', area: 'Johar Town', lat: 31.4700, lng: 74.2700 },
      { name: 'Salma Mart', area: 'DHA Phase 5', lat: 31.4750, lng: 74.4000 },
      { name: 'Usman Brothers', area: 'Bahria Town', lat: 31.3600, lng: 74.1800 },
    ]
    for (const c of customerData) {
      const exists = await prisma.customer.findFirst({ where: { name: c.name } })
      if (!exists) await prisma.customer.create({ data: c })
    }
    const customers = await prisma.customer.findMany()

    // 4. Attendance
    await prisma.attendance.create({
      data: { userId: user.id, timeIn: new Date(), lat: 31.5204, lng: 74.3587, status: 'present' },
    })

    // 5. Visit
    const visit = await prisma.visit.create({
      data: {
        userId: user.id, customerId: customers[0].id,
        timeIn: new Date(Date.now() - 3600000), timeOut: new Date(),
        notes: 'Achha visit tha',
      },
    })

    // 6. Order
    const order = await prisma.order.create({
      data: {
        customerId: customers[0].id, userId: user.id,
        items: JSON.stringify([{ name: 'Soap', qty: 10, price: 50 }, { name: 'Shampoo', qty: 5, price: 120 }]),
        amount: 1100, status: 'ORDERED',
      },
    })

    // 7. Return
    await prisma.return.create({
      data: { orderId: order.id, reason: 'Product kharab tha', status: 'PENDING' },
    })

    // 8. GPS Logs
    const gpsPoints = [
      { lat: 31.5204, lng: 74.3587 }, { lat: 31.5150, lng: 74.3520 },
      { lat: 31.5100, lng: 74.3450 }, { lat: 31.5080, lng: 74.3420 },
    ]
    for (const p of gpsPoints) {
      await prisma.gpsLog.create({ data: { userId: user.id, ...p, speed: 12.5, accuracy: 5.0 } })
    }

    return res.status(200).json({
      success: true,
      message: 'Test data ban gaya!',
      summary: { users: 1, offices: 1, customers: customers.length, visits: 1, orders: 1, returns: 1, gpsLogs: 4 }
    })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
