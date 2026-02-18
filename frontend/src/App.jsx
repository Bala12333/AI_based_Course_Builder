import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration (placeholder - replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

function App() {
  // State management
  const [prompt, setPrompt] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  // Authentication state
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in:", error);
      setError("Failed to sign in. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCourseData(null); // Clear data on logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  /**
   * Handle course generation request
   * Sends prompt to API Gateway which forwards to AI service
   */
  const handleGenerateCourse = async () => {
    if (!prompt.trim()) {
      setError('Please enter a course description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage('');

    try {
      const response = await axios.post('/api/generate-course', {
        prompt: prompt.trim()
      });

      setCourseData(response.data);
      setMessage('Course generated successfully! You can now save it or generate a new one.');

    } catch (err) {
      console.error('Error generating course:', err);

      if (err.response) {
        setError(err.response.data.message || 'Failed to generate course');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Unable to connect to the server. Please check if the backend services are running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save course to database
   * Sends course data to API Gateway for storage
   */
  const saveCourse = async () => {
    if (!courseData) return;

    try {
      const token = user ? await user.getIdToken() : null;
      console.log('Sending token:', token); // Debugging

      const response = await axios.post('/api/save-course',
        {
          ...courseData,
          userId: user?.uid,
          userEmail: user?.email
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setMessage('Course saved successfully!');

      // Clear the form after saving
      setTimeout(() => {
        setCourseData(null);
        setPrompt('');
        setMessage('');
      }, 2000);

    } catch (err) {
      console.error('Error saving course:', err);
      setError('Failed to save course. Please try again.');
    }
  };

  /**
   * Clear current course and start over
   */
  const clearCourse = () => {
    setCourseData(null);
    setPrompt('');
    setError(null);
    setMessage('');
    setRevealedAnswers(new Set());
    setExpandedModules(new Set());
  };

  /**
   * Render course modules with lessons and quizzes
   */
  const renderCourseContent = () => {
    if (!courseData) return null;

    return (
      <div className="fade-in space-y-6">
        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">{courseData.courseTitle}</h1>
          <p className="text-blue-100">
            {courseData.modules?.length || 0} modules •
            {courseData.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lessons
          </p>
        </div>

        {/* Modules */}
        <div className="space-y-6">
          {courseData.modules?.map((module, moduleIndex) => (
            <div key={moduleIndex} className="bg-white rounded-lg shadow-md border border-gray-200">
              {/* Module Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  Module {moduleIndex + 1}: {module.moduleTitle}
                </h2>
                <p className="text-gray-600 mt-1">
                  {expandedModules.has(moduleIndex)
                    ? module.description
                    : (module.description || '').slice(0, 160)}
                  {module.description && module.description.length > 160 && !expandedModules.has(moduleIndex) && '...'}
                </p>
                {module.description && module.description.length > 160 && (
                  <button
                    onClick={() => {
                      const next = new Set(expandedModules);
                      if (next.has(moduleIndex)) {
                        next.delete(moduleIndex);
                      } else {
                        next.add(moduleIndex);
                      }
                      setExpandedModules(next);
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {expandedModules.has(moduleIndex) ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>

              {/* Lessons */}
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Lessons</h3>
                <div className="space-y-3">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <div key={lessonIndex} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {lessonIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{lesson.lessonTitle}</h4>
                        <p className="text-gray-600 text-sm mt-1">{lesson.content}</p>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">
                          {lesson.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quizzes */}
                {module.quizzes && module.quizzes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Quiz</h3>
                    <div className="space-y-4">
                      {module.quizzes.map((quiz, quizIndex) => {
                        const key = `${moduleIndex}-${quizIndex}`;
                        const isRevealed = revealedAnswers.has(key);
                        return (
                          <div key={quizIndex} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="font-medium text-gray-800 mb-3">{quiz.question}</p>
                            <div className="space-y-2">
                              {quiz.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <span className="w-5 h-5 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-xs font-medium">
                                    {String.fromCharCode(65 + optionIndex)}
                                  </span>
                                  <span className="text-gray-700">{option}</span>
                                  {isRevealed && String.fromCharCode(65 + optionIndex) === quiz.correctAnswer && (
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {!isRevealed ? (
                              <button
                                onClick={() => {
                                  const next = new Set(revealedAnswers);
                                  next.add(key);
                                  setRevealedAnswers(next);
                                }}
                                className="mt-3 text-blue-700 hover:text-blue-800 text-sm font-medium"
                              >
                                Show Answer
                              </button>
                            ) : (
                              <p className="text-sm text-gray-600 mt-3">
                                <span className="font-medium">Explanation:</span> {quiz.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={saveCourse}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            💾 Save Course
          </button>
          <button
            onClick={clearCourse}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🔄 Generate New Course
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">AI</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Course Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              {loadingAuth ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 font-medium hidden md:block">{user.displayName}</span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-gray-300" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                      {user.displayName ? user.displayName.charAt(0) : 'U'}
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Generation Form */}
        {!courseData && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Create Your Perfect Course with AI
              </h2>
              <p className="text-lg text-gray-600">
                Describe what you want to teach, and our AI will generate a comprehensive course structure with modules, lessons, and quizzes.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-4">
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                  Course Description
                </label>
                <textarea
                  id="prompt"
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the course you want to create. For example: 'Create a course on JavaScript fundamentals for beginners covering variables, functions, and DOM manipulation'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  onClick={handleGenerateCourse}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      <span>Generating Course...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Generate Course</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Course Content */}
        {courseData && renderCourseContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 AI Course Builder. Built with React, Node.js, and Gemini AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
