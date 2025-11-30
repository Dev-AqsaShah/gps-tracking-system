// backend/pages/api/office/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type Data =
  | { success: true; offices: any[] }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const offices = await prisma.office.findMany({
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        radius: true,
      },
    })

    return res.status(200).json({
      success: true,
      offices,
    })
  } catch (error) {
    console.error('office list error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
