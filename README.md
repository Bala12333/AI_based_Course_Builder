# AI Course Builder

A complete microservices application that generates structured course outlines using AI. Built with Node.js, Python Flask, and React.

## 🏗️ Architecture

The application follows a microservices architecture with three main components:

- **Frontend**: React application with Tailwind CSS
- **API Gateway**: Node.js/Express service that handles routing and communication
- **AI Service**: Python Flask service that integrates with Google's Gemini AI

## 📁 Project Structure

```
/ai-course-builder
├── /backend
│   ├── /api-gateway      # Node.js API Gateway service
│   └── /ai-service       # Python AI service with Gemini integration
└── /frontend             # React frontend application
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- Python 3.8+
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ai-course-builder
```

### 2. Setup AI Service (Python)

```bash
cd backend/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the service
python app.py
```

The AI service will run on `http://localhost:5001`

### 3. Setup API Gateway (Node.js)

```bash
cd ../api-gateway

# Install dependencies
npm install

# Set environment variables
cp env.example .env
# Edit .env if you need to change the AI service URL

# Start the service
npm run dev
```

The API Gateway will run on `http://localhost:5000`

### 4. Setup Frontend (React)

```bash
cd ../../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔑 Environment Variables

### AI Service (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
FLASK_ENV=development
```

### API Gateway (.env)
```
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:5001
```

## 📚 API Endpoints

### AI Service (Port 5001)
- `GET /health` - Health check
- `POST /generate` - Generate course outline

### API Gateway (Port 5000)
- `GET /health` - Health check
- `POST /api/generate-course` - Generate course (forwards to AI service)
- `POST /api/save-course` - Save course (placeholder for Firebase)
- `GET /api/courses` - Get saved courses (placeholder)

## 🎯 Usage

1. **Start all services** in the order: AI Service → API Gateway → Frontend
2. **Open the frontend** at `http://localhost:3000`
3. **Enter a course description** in the text area
4. **Click "Generate Course"** to create a course outline
5. **Review the generated course** with modules, lessons, and quizzes
6. **Save the course** or generate a new one

## 🛠️ Development

### Running in Development Mode

```bash
# AI Service
cd backend/ai-service
python app.py

# API Gateway
cd backend/api-gateway
npm run dev

# Frontend
cd frontend
npm run dev
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# API Gateway
cd backend/api-gateway
npm start

# AI Service
cd backend/ai-service
python app.py
```

## 🔧 Configuration

### Gemini AI Integration

The AI service uses Google's Gemini Pro model to generate course content. The service:

- Accepts user prompts for course generation
- Uses a structured schema to ensure consistent output
- Returns JSON with course title, modules, lessons, and quizzes
- Handles API errors gracefully

### Response Schema

The AI service generates courses with this structure:

```json
{
  "courseTitle": "string",
  "modules": [
    {
      "moduleTitle": "string",
      "description": "string",
      "lessons": [
        {
          "lessonTitle": "string",
          "content": "string",
          "duration": "string"
        }
      ],
      "quizzes": [
        {
          "question": "string",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "string"
        }
      ]
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

1. **AI Service Connection Error**
   - Ensure the Python service is running on port 5001
   - Check that the GEMINI_API_KEY is set correctly

2. **Frontend Can't Connect to Backend**
   - Verify both backend services are running
   - Check the proxy configuration in `vite.config.js`

3. **Course Generation Fails**
   - Check the Gemini API key and quota
   - Review the AI service logs for detailed error messages

### Logs

- **AI Service**: Check the Python console output
- **API Gateway**: Check the Node.js console output
- **Frontend**: Check the browser console and network tab

## 🔮 Future Enhancements

- [ ] Firebase Firestore integration for course persistence
- [ ] User authentication and course management
- [ ] Course export to various formats (PDF, SCORM)
- [ ] Advanced course customization options
- [ ] Progress tracking and analytics
- [ ] Multi-language support

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the logs for error details
- Open an issue on the repository
