import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

import prisma from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { exclude } from '@/utils/helpers';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

const serverAuth = async (req: NextApiRequest, res: NextApiResponse) => {
  // First, try to get JWT token from microservice authentication
  const authHeader = req.headers.authorization;
  let currentUser = null;

  if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED && authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, MICROSERVICES_CONFIG.JWT_SECRET) as any;
      
      // Find user by username (since JWT contains username)
      currentUser = await prisma.user.findUnique({
        where: {
          username: decoded.sub, // JWT subject is typically the username
        },
        include: {
          posts: true,
          comments: true,
          notifications: true,
        },
      });

      if (currentUser) {
        const userWithoutPassword = exclude(currentUser, ['hashedPassword']);
        return { currentUser: userWithoutPassword };
      } else {
        // User exists in microservice but not in Next.js database
        // Create a minimal user record for Next.js features
        console.log('Creating user record for microservice user:', decoded.sub);
        
        try {
          // Create a minimal user record with proper relationships
          const newUser = await prisma.user.create({
            data: {
              username: decoded.sub,
              email: `${decoded.sub}@microservice.local`, // Placeholder email
              name: decoded.sub,
              hashedPassword: '', // No password needed for microservice users
              followingIds: [], // Initialize empty following array
            },
            include: {
              posts: true,
              comments: true,
              notifications: true,
            },
          });

          const userWithoutPassword = exclude(newUser, ['hashedPassword']);
          return { currentUser: userWithoutPassword };
        } catch (createError: any) {
          console.error('Failed to create user record:', createError);
          
          // If we can't create the user due to MongoDB replica set issues,
          // create a minimal user object for the session
          if (createError?.message?.includes('replica set')) {
            console.log('MongoDB replica set issue detected, creating minimal user object');
            const minimalUser = {
              id: decoded.sub,
              username: decoded.sub,
              email: `${decoded.sub}@microservice.local`,
              name: decoded.sub,
              followingIds: [],
              posts: [],
              comments: [],
              notifications: [],
            };
            return { currentUser: minimalUser };
          }
          
          // Fall through to NextAuth
        }
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
      // Fall through to NextAuth
    }
  }

  // Fallback to NextAuth session
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    throw new Error('Not signed in');
  }

  currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      posts: true,
      comments: true,
      notifications: true,
    },
  });

  if (!currentUser) {
    throw new Error('Not signed in');
  }

  const userWithoutPassword = exclude(currentUser, ['hashedPassword']);
  return { currentUser: userWithoutPassword };
};

export default serverAuth;
