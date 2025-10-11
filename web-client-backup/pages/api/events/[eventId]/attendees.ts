import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const { currentUser } = await serverAuth(req, res);
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        user: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only event creator can see attendees list
    if (event.userId !== currentUser.id) {
      return res
        .status(403)
        .json({ error: 'Not authorized to view attendees' });
    }

    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {
      eventId: eventId,
    };

    // Filter by RSVP status if provided
    if (
      status &&
      typeof status === 'string' &&
      ['going', 'maybe', 'not_going'].includes(status)
    ) {
      whereClause.status = status;
    }

    const attendees = await prisma.eventRSVP.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const total = await prisma.eventRSVP.count({ where: whereClause });

    // Get RSVP counts by status
    const rsvpCounts = await prisma.eventRSVP.groupBy({
      by: ['status'],
      where: { eventId: eventId },
      _count: {
        status: true,
      },
    });

    const counts = {
      going: 0,
      maybe: 0,
      not_going: 0,
    };

    rsvpCounts.forEach((count: any) => {
      counts[count.status as keyof typeof counts] = count._count.status;
    });

    return res.status(200).json({
      attendees,
      counts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Attendees API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
