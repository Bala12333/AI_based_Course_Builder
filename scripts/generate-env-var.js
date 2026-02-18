const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'backend', 'api-gateway', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Error: Could not find service-account.json at:`);
    console.error(serviceAccountPath);
    console.error("Please ensure you've placed the file there as per previous instructions.");
    process.exit(1);
}

try {
    const content = fs.readFileSync(serviceAccountPath, 'utf8');
    const json = JSON.parse(content);
    const minified = JSON.stringify(json);

    console.log("\n✅ Success! Here is your minified Firebase configuration for deployment:\n");
    console.log("----------------------------------------");
    console.log(minified);
    console.log("----------------------------------------");
    console.log("\n📋 INSTRUCTIONS FOR NETLIFY:");
    console.log("1. Go to Netlify -> Site Settings -> Build & Deploy -> Environment variables");
    console.log("2. Click 'Add a variable'");
    console.log("3. Key: FIREBASE_SERVICE_ACCOUNT");
    console.log("4. Value: (Paste the long string above)");
    console.log("5. Click 'Create variable'");
    console.log("\n⚠️  Do NOT share this string publicly!");

} catch (error) {
    console.error("❌ Error parsing JSON:", error.message);
}
