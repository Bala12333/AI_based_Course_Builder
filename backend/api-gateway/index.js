const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const DATA_DIR = path.join(__dirname, 'data');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const promptCache = new Map(); // key: prompt, value: { data, expiresAt }

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists for simple JSON persistence
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Serve a tiny favicon to avoid 404s
app.get('/favicon.ico', (req, res) => {
  // 1x1 transparent PNG
  const png = Buffer.from(
    '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6360000002000154A2F2880000000049454E44AE426082',
    'hex'
  );
  res.set('Content-Type', 'image/png');
  res.send(png);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Course Builder API Gateway',
    timestamp: new Date().toISOString(),
    aiServiceUrl: AI_SERVICE_URL
  });
});

/**
 * Generate course endpoint
 * Receives course generation requests from frontend and forwards to AI service
 */
app.post('/api/generate-course', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid prompt in request body',
        required: 'prompt (string)'
      });
    }
    
    console.log(`Received course generation request: ${prompt.substring(0, 100)}...`);

    // Return cached result if available and fresh
    const cached = promptCache.get(prompt);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }
    
    // Forward request to AI service
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
      prompt: prompt
    }, {
      timeout: 60000, // 60 second timeout for AI generation
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Course generated successfully by AI service');
    
    // Cache and return the AI service response
    promptCache.set(prompt, { data: aiResponse.data, expiresAt: Date.now() + CACHE_TTL_MS });
    res.json(aiResponse.data);
    
  } catch (error) {
    console.error('Error generating course:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service is unavailable',
        message: 'The AI service is not running or not accessible',
        details: `Failed to connect to ${AI_SERVICE_URL}`
      });
    }
    
    if (error.response) {
      // AI service returned an error
      return res.status(error.response.status).json({
        error: 'AI service error',
        message: error.response.data.error || 'Unknown error from AI service',
        details: error.response.data
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'AI service took too long to respond',
        details: 'Request timed out after 60 seconds'
      });
    }
    
    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate course',
      details: error.message
    });
  }
});

/**
 * Save course endpoint
 * Saves course data to Firestore (placeholder for future implementation)
 */
app.post('/api/save-course', async (req, res) => {
  try {
    const courseData = req.body;
    
    // Validate course data
    if (!courseData || !courseData.courseTitle) {
      return res.status(400).json({
        error: 'Invalid course data',
        required: 'courseTitle and course structure'
      });
    }
    
    console.log(`Received course save request for: ${courseData.courseTitle}`);

    const courseId = `course_${Date.now()}`;
    const filePath = path.join(DATA_DIR, `${courseId}.json`);
    const payload = { ...courseData, courseId, savedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Course saved successfully',
      courseId,
      savedAt: payload.savedAt
    });
    
  } catch (error) {
    console.error('Error saving course:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save course',
      details: error.message
    });
  }
});

/**
 * Get saved courses endpoint (placeholder)
 */
app.get('/api/courses', async (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const courses = files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')));
    courses.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
    res.json({ courses });
    
  } catch (error) {
    console.error('Error fetching courses:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch courses',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health',
      'POST /api/generate-course',
      'POST /api/save-course',
      'GET /api/courses'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway server running on port ${PORT}`);
  console.log(`📡 AI Service URL: ${AI_SERVICE_URL}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Course generation: http://localhost:${PORT}/api/generate-course`);
});

module.exports = app;
