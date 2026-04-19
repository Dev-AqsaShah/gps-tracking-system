import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { username, password, name, phone, companyName } = req.body

  if (!username || !password || !name)
    return res.status(400).json({ error: 'username, password and name are required' })

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  try {
    const exists = await prisma.user.findUnique({ where: { username } })
    if (exists) return res.status(409).json({ error: 'Username already taken' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashed, name, phone: phone ?? null, companyName: companyName ?? null },
    })

    return res.status(201).json({
      success: true,
      user: { id: user.id, username: user.username, name: user.name, phone: user.phone, companyName: user.companyName },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
