import { getStressOptions } from '../../config/options.js';
import { relaxedThresholds } from '../../config/thresholds.js';
import { authTests } from '../../services/auth.js';
import { userTests } from '../../services/user.js';
import { postTests } from '../../services/post.js';
import { messagingTests } from '../../services/messaging.js';
import { notificationTests } from '../../services/notification.js';
import { socialTests } from '../../services/social.js';
import { eventTests } from '../../services/event.js';

// Stress test configuration - find breaking point
export const options = getStressOptions(relaxedThresholds);

// Main test function - runs all service tests
export default function () {
  // Run auth tests
  authTests();

  // Run user service tests
  userTests();

  // Run post service tests
  postTests();

  // Run messaging service tests
  messagingTests();

  // Run notification service tests
  notificationTests();

  // Run social service tests
  socialTests();

  // Run event service tests
  eventTests();
}

