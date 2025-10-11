import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get user's chats
 *     description: Retrieve all chats for the authenticated user
 *     tags: [Chats]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of user's chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new chat
 *     description: Create a new chat between the authenticated user and another user
 *     tags: [Chats]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to start a chat with
 *     responses:
 *       201:
 *         description: Chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { currentUser } = await serverAuth(req, res);

    switch (req.method) {
      case 'GET':
        const chats = await prisma.chat.findMany({
          where: {
            userIds: {
              has: currentUser.id,
            },
          },
          include: {
            messages: {
              take: 1,
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        // Get user information for each chat
        const chatsWithUsers = await Promise.all(
          chats.map(async (chat: any) => {
            const userIds = chat.userIds.filter((id: any) => id !== currentUser.id);
            const users = await prisma.user.findMany({
              where: {
                id: {
                  in: userIds,
                },
              },
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            });
            return {
              ...chat,
              users,
            };
          })
        );

        return res.status(200).json(chatsWithUsers);

      case 'POST':
        const { userId } = req.body;

        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        if (userId === currentUser.id) {
          return res
            .status(400)
            .json({ error: 'Cannot create chat with yourself' });
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!targetUser) {
          return res.status(400).json({ error: 'User not found' });
        }

        // Check if chat already exists between these users
        const existingChat = await prisma.chat.findFirst({
          where: {
            userIds: {
              hasEvery: [currentUser.id, userId],
            },
          },
        });

        if (existingChat) {
          // Get user information for existing chat
          const users = await prisma.user.findMany({
            where: {
              id: {
                in: [userId],
              },
            },
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          });

          const existingChatWithUsers = {
            ...existingChat,
            users,
          };

          return res.status(200).json(existingChatWithUsers);
        }

        // Create new chat
        const chat = await prisma.chat.create({
          data: {
            userIds: [currentUser.id, userId],
          },
          include: {
            messages: true,
          },
        });

        // Get user information for the new chat
        const users = await prisma.user.findMany({
          where: {
            id: {
              in: [userId],
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        });

        const chatWithUsers = {
          ...chat,
          users,
        };

        return res.status(201).json(chatWithUsers);

      default:
        return res.status(405).end();
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
