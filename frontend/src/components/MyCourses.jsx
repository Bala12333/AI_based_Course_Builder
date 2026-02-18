import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { auth } from '../firebase';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCourse, setExpandedCourse] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setError("You must be logged in to view your courses.");
                setLoading(false);
                return;
            }

            console.log("Fetching courses for user:", user.uid);
            const token = await user.getIdToken();

            // Ensure we hit the API Gateway which forwards to Firestore or Local Storage
            const response = await axios.get('/api/courses', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Courses response:", response.data);

            // Handle response structure (some implementations return array directly, others { courses: [] })
            const coursesData = Array.isArray(response.data) ? response.data : (response.data.courses || []);
            setCourses(coursesData);
            setError(null);
        } catch (err) {
            console.error("Error fetching courses:", err);
            // Don't show error for 404 (just means no courses yet or endpoint missing) if array is empty
            if (err.response && err.response.status === 404) {
                setCourses([]);
            } else {
                setError(`Failed to load your courses: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = (course) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            let yPos = 20;

            // Title
            doc.setFontSize(22);
            doc.setTextColor(40, 40, 100);
            doc.text(course.courseTitle, margin, yPos);
            yPos += 15;

            // Description
            if (course.description) {
                doc.setFontSize(12);
                doc.setTextColor(60, 60, 60);
                const splitDesc = doc.splitTextToSize(course.description, pageWidth - (margin * 2));
                doc.text(splitDesc, margin, yPos);
                yPos += (splitDesc.length * 7) + 10;
            }

            // Modules
            if (course.modules) {
                course.modules.forEach((module, mIndex) => {
                    // Check for page break
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Module Title
                    doc.setFontSize(16);
                    doc.setTextColor(0, 50, 150);
                    doc.text(`Module ${mIndex + 1}: ${module.moduleTitle}`, margin, yPos);
                    yPos += 10;

                    // Lessons
                    if (module.lessons) {
                        module.lessons.forEach((lesson, lIndex) => {
                            if (yPos > 270) {
                                doc.addPage();
                                yPos = 20;
                            }
                            doc.setFontSize(14);
                            doc.setTextColor(0, 0, 0);
                            doc.text(`${lIndex + 1}. ${lesson.lessonTitle}`, margin + 5, yPos);
                            yPos += 7;

                            doc.setFontSize(11);
                            doc.setTextColor(80, 80, 80);
                            const content = doc.splitTextToSize(lesson.content, pageWidth - (margin * 2) - 10);
                            doc.text(content, margin + 5, yPos);
                            yPos += (content.length * 6) + 10;
                        });
                    }
                    yPos += 5;
                });
            }

            doc.save(`${course.courseTitle.replace(/\s+/g, '_')}_Course.pdf`);
        } catch (pdfErr) {
            console.error("Error generating PDF:", pdfErr);
            alert("Failed to generate PDF. Please check console for details.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-red-50 rounded-lg">
                <p className="text-red-600 font-semibold">Error Loading Courses</p>
                <p className="text-red-500 text-sm mt-1 mb-4">{error}</p>
                <button onClick={fetchCourses} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Try Again</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
                <button onClick={fetchCourses} className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1">
                    <span>🔄</span> Refresh
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">You haven't saved any courses yet.</p>
                    <p className="text-gray-400 text-sm mt-2">Generate a course and click "Save" to see it here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id || course.courseId} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.courseTitle}</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Created {new Date(course.createdAt?._seconds * 1000 || course.savedAt || Date.now()).toLocaleDateString()}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {course.modules?.length || 0} Modules
                                    </span>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                                <button
                                    onClick={() => setExpandedCourse(expandedCourse === course ? null : course)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                    {expandedCourse === course ? 'Hide Details' : 'View Details'}
                                </button>
                                <button
                                    onClick={() => handleExportPDF(course)}
                                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                                    title="Export as PDF"
                                >
                                    <span className="text-lg">📄</span>
                                    <span className="text-xs font-medium">PDF</span>
                                </button>
                            </div>
                            {expandedCourse === course && (
                                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100 animate-fadeIn">
                                    <div className="mt-4 space-y-2">
                                        <h4 className="font-semibold text-sm text-gray-700">Course Modules:</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            {course.modules?.slice(0, 5).map((m, i) => (
                                                <li key={i}>{m.moduleTitle}</li>
                                            ))}
                                            {(course.modules?.length || 0) > 5 && <li>...and more</li>}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCourses;
