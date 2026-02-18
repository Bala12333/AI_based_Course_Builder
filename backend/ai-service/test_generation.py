import google.generativeai as genai
import os
from dotenv import load_dotenv
import time

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
genai.configure(api_key=GEMINI_API_KEY)

print(f"Using API Key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
print(f"Using Model: {GEMINI_MODEL}")

COURSE_SCHEMA = """
{
  "courseTitle": "string",
  "modules": []
}
"""

full_prompt = f"""
You are an expert course designer. Create a course outline for 'Introduction to Web Development'.
Please generate a structured course outline that follows this exact JSON schema:
{COURSE_SCHEMA}
"""

def test_generation():
    main_model = 'gemini-2.5-pro'
    fallback_model = 'gemini-pro-latest'
    
    target_models = [main_model, fallback_model]
    
    print(f"Target models: {target_models}")

    for attempt, model_name in enumerate(target_models):
        print(f"Attempting with model: {model_name}")
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(full_prompt)
            print("Success!")
            print(response.text[:200])
            return
        except Exception as e:
            err_str = str(e)
            print(f"Attempt failed with model {model_name}: {err_str}")
            
            if '429' in err_str or 'quota' in err_str.lower():
                print("Quota error detected, sleeping...")
                time.sleep(1)
                continue
            
            # If it's a 404, maybe try adding 'models/' prefix?
            if '404' in err_str and not model_name.startswith('models/'):
                 print(f"Retrying {model_name} with 'models/' prefix...")
                 try:
                    model = genai.GenerativeModel(f"models/{model_name}")
                    response = model.generate_content(full_prompt)
                    print("Success with prefix!")
                    print(response.text[:200])
                    return
                 except Exception as e2:
                     print(f"Prefix retry failed: {e2}")

if __name__ == "__main__":
    test_generation()
