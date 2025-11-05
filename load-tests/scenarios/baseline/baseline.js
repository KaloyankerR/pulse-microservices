import { getBaselineOptions } from '../../config/options.js';
import { defaultThresholds } from '../../config/thresholds.js';
import { authTests } from '../../services/auth.js';
import { userTests } from '../../services/user.js';
import { postTests } from '../../services/post.js';
import { messagingTests } from '../../services/messaging.js';
import { notificationTests } from '../../services/notification.js';
import { socialTests } from '../../services/social.js';
import { eventTests } from '../../services/event.js';

// Baseline test configuration
const baselineOptions = getBaselineOptions(defaultThresholds);
// Setup timeout for initial delay
baselineOptions.setupTimeout = '20s';
export const options = baselineOptions;

// Import sleep for setup function
import { sleep } from 'k6';

// Setup function - runs once before all iterations
// This helps avoid rate limiting by spacing out initial requests
export function setup() {
  // Wait before starting to avoid rate limits from previous runs
  // Reduced wait time for faster test execution
  console.log('Waiting 10 seconds before starting to let any rate limits reset...');
  sleep(10);
}

// Main test function - runs all service tests
// Note: We run fewer services per iteration to reduce rate limiting
export default function () {
  // Only run a subset of services per iteration to avoid rate limiting
  // Each VU will cycle through different services
  
  const iteration = __ITER % 7;
  
  switch (iteration) {
    case 0:
      authTests();
      break;
    case 1:
      userTests();
      break;
    case 2:
      postTests();
      break;
    case 3:
      messagingTests();
      break;
    case 4:
      notificationTests();
      break;
    case 5:
      socialTests();
      break;
    case 6:
      eventTests();
      break;
  }
  
  // Small delay between iterations to avoid overwhelming the system
  sleep(1);
}

