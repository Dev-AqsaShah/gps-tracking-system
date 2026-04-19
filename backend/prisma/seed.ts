import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seed shuru ho raha hai...')

  // 1. User (salesman)
  const user = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Ali Salesman', phone: '03001234567', role: 'salesman' },
  })
  console.log('User bana:', user.name)

  // 2. Office
  const office = await prisma.office.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Head Office Lahore', lat: 31.5204, lng: 74.3587, radius: 100 },
  })
  console.log('Office bana:', office.name)

  // 3. Customers
  const customers = [
    { name: 'Ahmed Store', area: 'Gulberg', lat: 31.5100, lng: 74.3400 },
    { name: 'Bilal Traders', area: 'Model Town', lat: 31.4800, lng: 74.3200 },
    { name: 'Kareem General Store', area: 'Johar Town', lat: 31.4700, lng: 74.2700 },
    { name: 'Salma Mart', area: 'DHA Phase 5', lat: 31.4750, lng: 74.4000 },
    { name: 'Usman Brothers', area: 'Bahria Town', lat: 31.3600, lng: 74.1800 },
  ]
  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { name: c.name } })
    if (!existing) {
      const customer = await prisma.customer.create({ data: c })
      console.log('Customer bana:', customer.name)
    }
  }

  // 4. Sample Attendance
  await prisma.attendance.create({
    data: { userId: 1, timeIn: new Date(), lat: 31.5204, lng: 74.3587, status: 'present' },
  })
  console.log('Attendance record bana')

  // 5. Sample Visit
  const allCustomers = await prisma.customer.findMany()
  const firstCustomer = allCustomers[0]
  const visit = await prisma.visit.create({
    data: {
      userId: 1, customerId: firstCustomer.id,
      timeIn: new Date(Date.now() - 3600000),
      timeOut: new Date(),
      notes: 'Achha hua visit',
    },
  })
  console.log('Visit bana:', visit.id)

  // 6. Sample Order
  const order = await prisma.order.create({
    data: {
      customerId: firstCustomer.id,
      userId: 1,
      items: [{ name: 'Soap', qty: 10, price: 50 }, { name: 'Shampoo', qty: 5, price: 120 }],
      amount: 1100,
      status: 'ORDERED',
    },
  })
  console.log('Order bana:', order.id)

  // 7. Sample Return
  await prisma.return.create({
    data: { orderId: order.id, reason: 'Product kharab tha', status: 'PENDING' },
  })
  console.log('Return bana')

  // 8. Sample GPS Logs
  const gpsPoints = [
    { lat: 31.5204, lng: 74.3587 },
    { lat: 31.5150, lng: 74.3520 },
    { lat: 31.5100, lng: 74.3450 },
    { lat: 31.5080, lng: 74.3420 },
  ]
  for (const p of gpsPoints) {
    await prisma.gpsLog.create({
      data: { userId: 1, lat: p.lat, lng: p.lng, speed: 12.5, accuracy: 5.0 },
    })
  }
  console.log('GPS logs bane:', gpsPoints.length)

  console.log('\n✅ Seed complete! Ab dashboard mein data dikhega.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
