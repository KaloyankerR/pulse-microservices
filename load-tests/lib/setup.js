import { register } from './auth.js';
import { randomEmail, randomUsername } from './helpers.js';
import { TEST_CREDENTIALS } from './constants.js';

/**
 * Setup function to ensure test user exists
 * This will try to register the test user if login fails
 */
export function setupTestUser() {
  // Try to register the test user
  // This is a best-effort attempt - if it fails, the user should create the account manually
  const email = TEST_CREDENTIALS.email;
  const username = TEST_CREDENTIALS.username;
  const password = TEST_CREDENTIALS.password;

  try {
    const success = register(email, username, password, username);
    if (success) {
      console.log(`Test user created: ${email}`);
    } else {
      console.log(`Test user may already exist: ${email}`);
    }
  } catch (error) {
    console.log(`Could not create test user: ${error.message}`);
    console.log(`Please create a test user with email: ${email} and password: ${password}`);
  }
}






