import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    return res.status(200).json({
      available: !existingUser,
      exists: !!existingUser,
    });
  } catch (error: any) {
    console.error('Error checking username:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
