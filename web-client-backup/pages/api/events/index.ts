import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get events
 *     description: Retrieve events from users the current user follows, or events from a specific user, or all public events
 *     tags: [Events]
 *     parameters:
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
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID to get events from (optional)
 *     responses:
 *       200:
 *         description: List of events with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new event
 *     description: Create a new event for the authenticated user
 *     tags: [Events]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - eventDate
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: "Team Meeting"
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: "Weekly team sync meeting"
 *               eventDate:
 *                 type: string
 *                 format: date-time
 *                 description: Event date and time
 *                 example: "2024-12-25T10:00:00Z"
 *               location:
 *                 type: string
 *                 description: Event location
 *                 example: "Conference Room A"
 *               maxAttendees:
 *                 type: integer
 *                 description: Maximum number of attendees
 *                 example: 50
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 default: public
 *                 description: Event visibility
 *               image:
 *                 type: string
 *                 description: Event image URL
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    let currentUser = null;
    try {
      const authResult = await serverAuth(req, res);
      currentUser = authResult.currentUser;
    } catch (authError) {
      // If not authenticated, we'll handle it in the GET case
      if (req.method === 'POST') {
        return res.status(401).json({ error: 'Authentication required' });
      }
    }

    switch (req.method) {
      case 'POST':
        const {
          title,
          description,
          eventDate,
          location,
          maxAttendees,
          visibility,
          image,
        } = req.body;

        if (!title || !eventDate) {
          return res
            .status(400)
            .json({ error: 'Title and event date are required' });
        }

        // Validate event date is in the future
        const eventDateTime = new Date(eventDate);
        if (eventDateTime <= new Date()) {
          return res
            .status(400)
            .json({ error: 'Event date must be in the future' });
        }

        if (!currentUser) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const event = await prisma.event.create({
          data: {
            title,
            description,
            eventDate: eventDateTime,
            location,
            maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
            visibility: visibility || 'public',
            image,
            userId: currentUser.id,
          },
          include: {
            user: {
              select: {
                name: true,
                username: true,
                profileImage: true,
              },
            },
            rsvps: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        });

        return res.status(201).json(event);

      case 'GET':
      default:
        const { page = '1', limit = '10', userId } = req.query;
        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};

        // If userId is provided, get events by that user
        if (userId && typeof userId === 'string') {
          whereClause.userId = userId;
        } else {
          // Get events from users the current user follows + their own events
          if (currentUser) {
            whereClause.userId = {
              in: [...(currentUser.followingIds || []), currentUser.id],
            };
          } else {
            // If not authenticated, show all public events
            whereClause.visibility = 'public';
          }
        }

        // Only show future events
        whereClause.eventDate = {
          gte: new Date(),
        };

        const events = await prisma.event.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                name: true,
                username: true,
                profileImage: true,
              },
            },
            rsvps: {
              include: {
                user: {
                  select: {
                    name: true,
                    username: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
          orderBy: {
            eventDate: 'asc',
          },
          skip,
          take: limitNum,
        });

        const total = await prisma.event.count({ where: whereClause });

        return res.status(200).json({
          events,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        });
    }
  } catch (error: any) {
    console.error('Events API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
