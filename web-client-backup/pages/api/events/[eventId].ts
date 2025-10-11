import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/libs/prismadb';
import serverAuth from '@/libs/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).end();
  }

  try {
    const { currentUser } = await serverAuth(req, res);
    const { eventId } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    switch (req.method) {
      case 'GET':
        const event = await prisma.event.findUnique({
          where: {
            id: eventId,
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

        if (!event) {
          return res.status(404).json({ error: 'Event not found' });
        }

        return res.status(200).json(event);

      case 'PUT':
        const {
          title,
          description,
          eventDate,
          location,
          maxAttendees,
          visibility,
          image,
        } = req.body;

        // Check if user owns the event
        const existingEvent = await prisma.event.findUnique({
          where: { id: eventId },
        });

        if (!existingEvent) {
          return res.status(404).json({ error: 'Event not found' });
        }

        if (existingEvent.userId !== currentUser.id) {
          return res
            .status(403)
            .json({ error: 'Not authorized to edit this event' });
        }

        // Validate event date is in the future if provided
        if (eventDate) {
          const eventDateTime = new Date(eventDate);
          if (eventDateTime <= new Date()) {
            return res
              .status(400)
              .json({ error: 'Event date must be in the future' });
          }
        }

        const updatedEvent = await prisma.event.update({
          where: { id: eventId },
          data: {
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(eventDate && { eventDate: new Date(eventDate) }),
            ...(location !== undefined && { location }),
            ...(maxAttendees !== undefined && {
              maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
            }),
            ...(visibility && { visibility }),
            ...(image !== undefined && { image }),
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

        return res.status(200).json(updatedEvent);

      case 'DELETE':
        // Check if user owns the event
        const eventToDelete = await prisma.event.findUnique({
          where: { id: eventId },
        });

        if (!eventToDelete) {
          return res.status(404).json({ error: 'Event not found' });
        }

        if (eventToDelete.userId !== currentUser.id) {
          return res
            .status(403)
            .json({ error: 'Not authorized to delete this event' });
        }

        await prisma.event.delete({
          where: { id: eventId },
        });

        return res.status(200).json({ message: 'Event deleted successfully' });
    }
  } catch (error: any) {
    console.error('Event API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
