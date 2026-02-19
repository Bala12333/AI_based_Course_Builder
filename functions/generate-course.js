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

    // Fallback logic: Try configured model (Pro) -> Flash -> Stable Flash
    // Fallback logic: Try configured model -> 2.5 Flash -> 1.5 Flash
    // User testing indicates gemini-2.5-flash is the most reliable free tier model currently
    const preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const modelsToTry = [preferredModel];

    const fallbackModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const model of fallbackModels) {
      if (!modelsToTry.includes(model)) {
        modelsToTry.push(model);
      }
    }

    let lastError = null;
    let generatedText = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting generation with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

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
        generatedText = response.text();

        if (generatedText) {
          console.log(`Success with model: ${modelName}`);
          break; // Stop if successful
        }
      } catch (error) {
        console.warn(`Failed with model ${modelName}:`, error.message);
        lastError = error;
        // Continue to next model
      }
    }

    if (!generatedText) {
      throw lastError || new Error("Failed to generate content with any model");
    }

    console.log("Raw AI response:", generatedText.substring(0, 200) + "...");

    // clean up the response text to extract just the JSON
    if (generatedText.includes('```json')) {
      generatedText = generatedText.split('```json')[1].split('```')[0].trim();
    } else if (generatedText.includes('```')) {
      generatedText = generatedText.split('```')[1].split('```')[0].trim();
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: generatedText,
    };

  } catch (error) {
    console.error('Error generating course:', error);

    if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Service is busy (Quota Exceeded). Please try again in a few moments.' }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate course', details: error.message }),
    };
  }
};
