#!/usr/bin/env node

/**
 * Frontend Integration Test Script
 * Tests the connection between Next.js frontend and Spring Boot microservices
 */

const https = require('https');
const http = require('http');

// Configuration
const GATEWAY_URL = 'http://localhost:8000'; // Kong Gateway
const FRONTEND_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testServiceHealth() {
  log('\n🔍 Testing Service Health...', 'blue');
  
  try {
    const response = await makeRequest(`${GATEWAY_URL}/actuator/health`);
    
    if (response.status === 200) {
      log('✅ Gateway Service is healthy', 'green');
      return true;
    } else {
      log(`❌ Gateway Service returned status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Gateway Service is not responding: ${error.message}`, 'red');
    return false;
  }
}

async function testUserRegistration() {
  log('\n👤 Testing User Registration...', 'blue');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (response.status === 201) {
      log('✅ User registration successful', 'green');
      return { success: true, user: testUser };
    } else {
      log(`❌ User registration failed: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'yellow');
      return { success: false };
    }
  } catch (error) {
    log(`❌ User registration error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testUserLogin(user) {
  log('\n🔐 Testing User Login...', 'blue');
  
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usernameOrEmail: user.username,
        password: user.password
      })
    });
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data.token) {
        log('✅ User login successful', 'green');
        return { success: true, token: data.token };
      } else {
        log('❌ Login response missing token', 'red');
        return { success: false };
      }
    } else {
      log(`❌ User login failed: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'yellow');
      return { success: false };
    }
  } catch (error) {
    log(`❌ User login error: ${error.message}`, 'red');
    return { success: false };
  }
}

async function testAuthenticatedRequest(token) {
  log('\n🔒 Testing Authenticated Request...', 'blue');
  
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      log('✅ Authenticated request successful', 'green');
      return true;
    } else {
      log(`❌ Authenticated request failed: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Authenticated request error: ${error.message}`, 'red');
    return false;
  }
}

async function testUserSearch() {
  log('\n🔍 Testing User Search...', 'blue');
  
  try {
    const response = await makeRequest(`${GATEWAY_URL}/api/users/active`);
    
    if (response.status === 200) {
      const users = JSON.parse(response.data);
      log(`✅ User search successful - found ${users.length} users`, 'green');
      return true;
    } else {
      log(`❌ User search failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ User search error: ${error.message}`, 'red');
    return false;
  }
}

async function testFrontendConnection() {
  log('\n🌐 Testing Frontend Connection...', 'blue');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    
    if (response.status === 200) {
      log('✅ Frontend is accessible', 'green');
      return true;
    } else {
      log(`❌ Frontend returned status: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend is not responding: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Pulse MVP - Frontend Integration Test', 'bold');
  log('==========================================', 'bold');
  
  const results = {
    serviceHealth: false,
    userRegistration: false,
    userLogin: false,
    authenticatedRequest: false,
    userSearch: false,
    frontendConnection: false
  };
  
  // Test 1: Service Health
  results.serviceHealth = await testServiceHealth();
  
  if (!results.serviceHealth) {
    log('\n❌ Backend services are not running. Please start them first:', 'red');
    log('   ./start-backend.sh', 'yellow');
    return;
  }
  
  // Test 2: User Registration
  const registrationResult = await testUserRegistration();
  results.userRegistration = registrationResult.success;
  
  if (!results.userRegistration) {
    log('\n❌ User registration failed. Check backend logs.', 'red');
    return;
  }
  
  // Test 3: User Login
  const loginResult = await testUserLogin(registrationResult.user);
  results.userLogin = loginResult.success;
  
  if (!results.userLogin) {
    log('\n❌ User login failed. Check backend logs.', 'red');
    return;
  }
  
  // Test 4: Authenticated Request
  results.authenticatedRequest = await testAuthenticatedRequest(loginResult.token);
  
  // Test 5: User Search
  results.userSearch = await testUserSearch();
  
  // Test 6: Frontend Connection
  results.frontendConnection = await testFrontendConnection();
  
  // Summary
  log('\n📊 Test Results Summary:', 'bold');
  log('========================', 'bold');
  
  const tests = [
    { name: 'Service Health', result: results.serviceHealth },
    { name: 'User Registration', result: results.userRegistration },
    { name: 'User Login', result: results.userLogin },
    { name: 'Authenticated Request', result: results.authenticatedRequest },
    { name: 'User Search', result: results.userSearch },
    { name: 'Frontend Connection', result: results.frontendConnection }
  ];
  
  let passedTests = 0;
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    const color = test.result ? 'green' : 'red';
    log(`${status} ${test.name}`, color);
    if (test.result) passedTests++;
  });
  
  log(`\n🎯 Overall: ${passedTests}/${tests.length} tests passed`, 'bold');
  
  if (passedTests === tests.length) {
    log('\n🎉 All tests passed! Frontend integration is working perfectly!', 'green');
    log('\n📱 Next steps:', 'blue');
    log('   1. Open http://localhost:3000 in your browser', 'yellow');
    log('   2. Try the login and registration modals', 'yellow');
    log('   3. Check browser dev tools for API calls', 'yellow');
    log('   4. Verify JWT token in localStorage', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'red');
    log('\n🔧 Troubleshooting:', 'blue');
    log('   1. Ensure backend services are running: ./start-backend.sh', 'yellow');
    log('   2. Check service logs for errors', 'yellow');
    log('   3. Verify environment configuration', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test runner error: ${error.message}`, 'red');
  process.exit(1);
});
