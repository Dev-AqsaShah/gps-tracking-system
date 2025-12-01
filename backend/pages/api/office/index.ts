import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const offices = await prisma.office.findMany();
    res.status(200).json({ success: true, offices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'server error' });
  }
}
