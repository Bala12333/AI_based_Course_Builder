exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const data = JSON.parse(event.body);
        console.log("Received course save request:", data.courseTitle);

        // In a real app, you would save this to a database like Firestore or MongoDB.
        // Since Netlify Functions are stateless, valid local filesystem writing is not possible.

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Course saved successfully (Simulation). Note: Data is not persisted in this demo.',
                courseId: `course_${Date.now()}`
            }),
        };
    } catch (error) {
        console.error('Error saving course:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save course' }),
        };
    }
};
