import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

/**
 * @swagger
 * /api/chats/{chatId}/messages:
 *   get:
 *     summary: Get messages for a chat
 *     description: Retrieve all messages for a specific chat
 *     tags: [Messages]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not part of this chat
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Send a message
 *     description: Send a new message to a chat
 *     tags: [Messages]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 description: Message content
 *                 example: "Hello! How are you?"
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User not part of this chat
 *       404:
 *         description: Chat not found
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
    const { chatId } = req.query;

    if (!chatId || typeof chatId !== 'string') {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    // Check if chat exists and user is part of it
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (!chat.userIds.includes(currentUser.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    switch (req.method) {
      case 'GET':
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [messages, totalMessages] = await Promise.all([
          prisma.message.findMany({
            where: { chatId },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.message.count({
            where: { chatId },
          }),
        ]);

        const totalPages = Math.ceil(totalMessages / limit);

        return res.status(200).json({
          messages: messages.reverse(), // Reverse to show oldest first
          pagination: {
            page,
            limit,
            total: totalMessages,
            pages: totalPages,
          },
        });

      case 'POST':
        const { body } = req.body;

        if (!body || body.trim().length === 0) {
          return res.status(400).json({ error: 'Message body is required' });
        }

        if (body.length > 1000) {
          return res.status(400).json({ error: 'Message too long' });
        }

        const message = await prisma.message.create({
          data: {
            body: body.trim(),
            userId: currentUser.id,
            chatId,
            readBy: [currentUser.id], // Mark as read by sender
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },
          },
        });

        // Update chat's updatedAt timestamp
        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        return res.status(201).json(message);

      default:
        return res.status(405).end();
    }
  } catch (error: any) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
