import { NextApiRequest, NextApiResponse } from 'next';
import MICROSERVICES_CONFIG from '@/config/microservices.config';

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
      return res.status(400).json({ error: 'Invalid username' });
    }

    // For microservices mode, we need to search by username
    // Since the backend uses UUIDs, we'll need to search for the user first
    if (MICROSERVICES_CONFIG.MICROSERVICES_ENABLED) {
      // Use search endpoint to find user by username (backend expects 'q' parameter)
      // Use internal Docker network name for server-side requests
      const gatewayUrl = process.env.INTERNAL_GATEWAY_URL || 'http://kong:8000';
      const searchUrl = `${gatewayUrl}/api/v1/users/search?q=${encodeURIComponent(username)}`;
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        console.error('Search failed:', searchResponse.status);
        return res.status(404).json({ error: 'User not found' });
      }

      const searchResult = await searchResponse.json();
      const users = searchResult.data?.users || searchResult.data || [];
      
      // Find exact username match
      const user = users.find((u: any) => u.username === username);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user data in the format the frontend expects
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.displayName || user.username,
        bio: user.bio,
        profileImage: user.avatarUrl,
        image: user.avatarUrl,
        coverImage: null, // Add if available
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        followingIds: [], // This would come from social-service
        userTwitCount: 0, // This would come from post-service
        userFollowCount: user.followersCount || 0,
        location: user.location,
        website: user.website,
        birthday: user.birthday,
      });
    } else {
      // Fallback to local database (not configured, so return mock data)
      return res.status(503).json({ 
        error: 'Local database not configured. Please enable microservices mode.' 
      });
    }
  } catch (error: any) {
    console.error('Get user by username error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
