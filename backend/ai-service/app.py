import os
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyBStjv0hH9JNCoDLJ529MNVE9rHDkuoyzI"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
genai.configure(api_key=GEMINI_API_KEY)

# Define the response schema for structured course generation
COURSE_SCHEMA = """
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
"""

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify service is running"""
    return jsonify({"status": "healthy", "service": "AI Course Builder Service"})

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    # 1x1 transparent PNG to prevent 404 noise in logs
    png_bytes = bytes.fromhex(
        '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C6360000002000154A2F2880000000049454E44AE426082'
    )
    return Response(png_bytes, mimetype='image/png')

@app.route('/generate', methods=['POST'])
def generate_course():
    """
    Generate a structured course outline using Gemini AI
    
    Expected input:
    {
        "prompt": "string - User's course generation prompt"
    }
    
    Returns:
    {
        "courseTitle": "string",
        "modules": [...],
        "lessons": [...],
        "quizzes": [...]
    }
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Missing 'prompt' in request body"}), 400
        
        user_prompt = data['prompt']
        
        if not GEMINI_API_KEY:
            return jsonify({"error": "Gemini API key not configured"}), 500
        
        # Create the full prompt with schema instructions
        full_prompt = f"""
        You are an expert course designer. Based on the following user request, create a comprehensive course outline.
        
        User Request: {user_prompt}
        
        Please generate a structured course outline that follows this exact JSON schema:
        {COURSE_SCHEMA}
        
        Important:
        1. Return ONLY valid JSON that matches the schema exactly
        2. Do not include any markdown formatting or additional text
        3. Ensure the course is practical, engaging, and well-structured
        4. Include 3-5 modules with 2-4 lessons each
        5. Include 1-2 quiz questions per module
        6. Make the content realistic and actionable
        
        Generate the course now:
        """
        
        # Try generation with configured model, fall back to a faster model on 429/quota errors
        def try_generate(model_name: str):
            model = genai.GenerativeModel(model_name)
            return model.generate_content(full_prompt)

        response = None
        tried_models = []
        for attempt, model_name in enumerate([GEMINI_MODEL, 'gemini-1.5-flash'] if GEMINI_MODEL != 'gemini-1.5-flash' else [GEMINI_MODEL]):
            tried_models.append(model_name)
            try:
                response = try_generate(model_name)
                break
            except Exception as e:
                err_str = str(e)
                if '429' in err_str or 'quota' in err_str.lower():
                    # Respect suggested retry delay if available
                    delay_seconds = 5
                    for token in err_str.split():
                        if token.isdigit():
                            delay_seconds = min(15, max(delay_seconds, int(token)))
                            break
                    if attempt == 0 and model_name != 'gemini-1.5-flash':
                        time.sleep(1)
                        continue
                # For other errors or if last attempt, re-raise
                if attempt == (len([GEMINI_MODEL, 'gemini-1.5-flash'] if GEMINI_MODEL != 'gemini-1.5-flash' else [GEMINI_MODEL]) - 1):
                    raise
        if response is None:
            return jsonify({"error": "Failed to generate response", "triedModels": tried_models}), 503
        
        # Extract the generated text
        generated_text = response.text.strip()
        
        # Try to parse the response as JSON
        try:
            # Clean up the response text to extract just the JSON
            if '```json' in generated_text:
                # Extract JSON from markdown code blocks
                start = generated_text.find('```json') + 7
                end = generated_text.find('```', start)
                if end != -1:
                    generated_text = generated_text[start:end].strip()
            elif '```' in generated_text:
                # Extract JSON from regular code blocks
                start = generated_text.find('```') + 3
                end = generated_text.find('```', start)
                if end != -1:
                    generated_text = generated_text[start:end].strip()
            
            # Parse the JSON
            course_data = json.loads(generated_text)
            
            # Validate the structure
            if not all(key in course_data for key in ['courseTitle', 'modules']):
                raise ValueError("Missing required fields in generated course")
            
            return jsonify(course_data)
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return an error with the raw response
            return jsonify({
                "error": "Failed to parse AI response as JSON",
                "raw_response": generated_text,
                "parse_error": str(e)
            }), 500
            
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
