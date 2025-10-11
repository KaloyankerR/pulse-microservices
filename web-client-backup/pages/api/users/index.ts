import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get suggested users to follow
 *     description: Get a list of users that the current user might want to follow (excluding themselves)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of suggested users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const { currentUser } = await serverAuth(req, res);

    const usersCount = await prisma.user.count();
    const skip = Math.floor(Math.random() * usersCount);
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: currentUser!.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length < 3) {
      const remainingUsers = await prisma.user.findMany({
        take: 3 - users.length,
        where: {
          id: {
            not: currentUser!.id,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      users.push(...remainingUsers);
    }

    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(401).end();
  }
}
