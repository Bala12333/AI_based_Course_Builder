
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Use service account from environment variable
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
        }
    } else {
        // Fallback or dev mode
        admin.initializeApp();
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification failed:", error);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const userId = decodedToken.uid;
        const data = req.body;

        // Calculate timestamp
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        const courseData = {
            ...data,
            userId,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const docRef = await db.collection('courses').add(courseData);

        return res.status(200).json({
            success: true,
            courseId: docRef.id,
            message: 'Course saved successfully to Firestore'
        });
    } catch (error) {
        console.error('Error saving course:', error);
        return res.status(500).json({ error: 'Failed to save course', details: error.message });
    }
}
