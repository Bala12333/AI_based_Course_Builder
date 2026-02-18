const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const COURSE_SCHEMA = `
{
  "courseTitle": "string - The title of the course",
  "modules": [
    {
      "moduleTitle": "string - Title of the module",
      "description": "string - Description of what the module covers",
      "lessons": [
        {
          "lessonTitle": "string - Title of the lesson",
          "content": "string - Detailed content/description of the lesson",
          "duration": "string - Estimated duration (e.g., '30 minutes')"
        }
      ],
      "quizzes": [
        {
          "question": "string - Quiz question",
          "options": ["string - Option A", "string - Option B", "string - Option C", "string - Option D"],
          "correctAnswer": "string - The correct option (e.g., 'A', 'B', 'C', or 'D')",
          "explanation": "string - Explanation of why this is the correct answer"
        }
      ]
    }
  ]
}
`;

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const userPrompt = data.prompt;

    if (!userPrompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing prompt' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `
        You are an expert course designer. Based on the following user request, create a comprehensive course outline.
        
        User Request: ${userPrompt}
        
        Please generate a structured course outline that follows this exact JSON schema:
        ${COURSE_SCHEMA}
        
        Important:
        1. Return ONLY valid JSON that matches the schema exactly
        2. Do not include any markdown formatting or additional text
        3. Ensure the course is practical, engaging, and well-structured
        4. Include 3-5 modules with 2-4 lessons each
        5. Include 1-2 quiz questions per module
        6. Make the content realistic and actionable
        
        Generate the course now:
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown code blocks if present
    if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0].trim();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: text,
    };

  } catch (error) {
    console.error('Error generating course:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate course', details: error.message }),
    };
  }
};
