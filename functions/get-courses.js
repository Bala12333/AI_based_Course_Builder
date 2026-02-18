const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
        }
    } else {
        admin.initializeApp();
    }
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized: Missing token' }),
            };
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification failed:", error);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized: Invalid token' }),
            };
        }

        const userId = decodedToken.uid;

        const snapshot = await db.collection('courses')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const courses = [];
        snapshot.forEach(doc => {
            courses.push({ id: doc.id, ...doc.data() });
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(courses),
        };
    } catch (error) {
        console.error('Error fetching courses:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch courses', details: error.message }),
        };
    }
};
