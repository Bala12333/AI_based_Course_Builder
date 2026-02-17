const axios = require('axios');

// Configuration
const SERVICES = {
  aiService: 'http://localhost:5001',
  apiGateway: 'http://localhost:5000',
  frontend: 'http://localhost:3000'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

/**
 * Test a service endpoint
 */
async function testService(name, url, endpoint = '/health') {
  try {
    console.log(`${colors.blue}Testing ${name}...${colors.reset}`);
    const response = await axios.get(`${url}${endpoint}`, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ ${name} is running${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, response.data);
      return true;
    } else {
      console.log(`${colors.red}✗ ${name} returned status ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`${colors.red}✗ ${name} is not running (connection refused)${colors.reset}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`${colors.yellow}⚠ ${name} is slow to respond (timeout)${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${name} error: ${error.message}${colors.reset}`);
    }
    return false;
  }
}

/**
 * Test course generation
 */
async function testCourseGeneration() {
  try {
    console.log(`\n${colors.blue}Testing course generation...${colors.reset}`);
    
    const testPrompt = "Create a beginner-friendly course on Python programming basics";
    const response = await axios.post(`${SERVICES.apiGateway}/api/generate-course`, {
      prompt: testPrompt
    }, { timeout: 30000 });
    
    if (response.status === 200 && response.data.courseTitle) {
      console.log(`${colors.green}✓ Course generation successful${colors.reset}`);
      console.log(`  Course: ${response.data.courseTitle}`);
      console.log(`  Modules: ${response.data.modules?.length || 0}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Course generation failed - invalid response${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Course generation failed: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.blue}🚀 AI Course Builder - Service Health Check${colors.reset}\n`);
  
  // Test individual services
  const aiServiceOk = await testService('AI Service', SERVICES.aiService);
  const apiGatewayOk = await testService('API Gateway', SERVICES.apiGateway);
  
  // Test course generation if both services are up
  let courseGenOk = false;
  if (aiServiceOk && apiGatewayOk) {
    courseGenOk = await testCourseGeneration();
  }
  
  // Summary
  console.log(`\n${colors.blue}📊 Test Summary:${colors.reset}`);
  console.log(`  AI Service: ${aiServiceOk ? colors.green + '✓ Running' : colors.red + '✗ Failed' + colors.reset}`);
  console.log(`  API Gateway: ${apiGatewayOk ? colors.green + '✓ Running' : colors.red + '✗ Failed' + colors.reset}`);
  console.log(`  Course Generation: ${courseGenOk ? colors.green + '✓ Working' : colors.red + '✗ Failed' + colors.reset}`);
  
  if (aiServiceOk && apiGatewayOk && courseGenOk) {
    console.log(`\n${colors.green}🎉 All tests passed! Your AI Course Builder is ready to use.${colors.reset}`);
    console.log(`\nFrontend should be available at: ${colors.blue}${SERVICES.frontend}${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed. Please check the service logs above.${colors.reset}`);
    console.log(`\nTroubleshooting tips:`);
    console.log(`  1. Ensure all services are started`);
    console.log(`  2. Check that ports 5000, 5001, and 3000 are available`);
    console.log(`  3. Verify your GEMINI_API_KEY is set in the AI service`);
    console.log(`  4. Check the README.md for setup instructions`);
  }
}

// Run tests
runTests().catch(console.error);
