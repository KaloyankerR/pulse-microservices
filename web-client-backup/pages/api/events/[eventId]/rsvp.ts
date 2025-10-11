import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).end();
  }

  try {
    const { currentUser } = await serverAuth(req, res);
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const { status } = req.body;

    if (!status || !['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be one of: going, maybe, not_going',
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rsvps: {
          where: { status: 'going' },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is full when trying to RSVP as "going"
    if (status === 'going' && event.maxAttendees) {
      const currentGoingCount = event.rsvps.length;
      if (currentGoingCount >= event.maxAttendees) {
        return res.status(400).json({
          error: 'Event is full. Cannot RSVP as going.',
        });
      }
    }

    // Upsert RSVP (create or update)
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        userId_eventId: {
          userId: currentUser.id,
          eventId: eventId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        status,
        userId: currentUser.id,
        eventId: eventId,
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            profileImage: true,
          },
        },
        event: {
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
        },
      },
    });

    return res.status(200).json(rsvp);
  } catch (error: any) {
    console.error('RSVP API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
