import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

/**
 * @swagger
 * /api/chats/{chatId}/read:
 *   post:
 *     summary: Mark messages as read
 *     description: Mark all messages in a chat as read by the current user
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
 *     responses:
 *       200:
 *         description: Messages marked as read
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
  if (req.method !== 'POST') {
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

    // Mark all unread messages as read
    await prisma.message.updateMany({
      where: {
        chatId,
        NOT: {
          readBy: {
            has: currentUser.id,
          },
        },
      },
      data: {
        readBy: {
          push: currentUser.id,
        },
      },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Mark as read API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
