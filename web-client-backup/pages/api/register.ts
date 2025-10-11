// Stub for registration API - not used in microservices mode
// Registration is handled by the Spring Boot user-service
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // In microservices mode, registration goes through the user-service API
  // This endpoint is disabled
  return res.status(501).json({
    error: 'Not Implemented',
    message: 'Registration is handled by the microservices API. Use the user-service endpoint instead.'
  });
}
