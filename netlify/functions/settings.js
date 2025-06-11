const fs = require('fs');
const path = require('path');

// Assumes site-settings.json is in the project root.
// Adjust if you place it elsewhere (e.g., a 'data' folder).
const settingsFilePath = path.resolve(__dirname, '../../site-settings.json');

// Helper to darken a hex color (basic implementation)
const darkenColor = (hex, percent) => {
    hex = hex.replace(/^#/, '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};


exports.handler = async (event, context) => {
    if (event.httpMethod === 'GET') {
        try {
            // Check if file exists synchronously for the GET path, as fs.promises.access is async
            // and might be slightly more complex than needed for this initial check.
            if (!fs.existsSync(settingsFilePath)) {
                // Create a default if it doesn't exist for some reason
                // Note: fs.writeFileSync is synchronous. In a high-traffic scenario, consider async.
                const defaultSettings = { accentColor: "#F59E0B", accentColorHover: "#D97706" };
                fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
                return { statusCode: 200, body: JSON.stringify(defaultSettings) };
            }
            // fs.readFileSync is synchronous.
            const settingsData = fs.readFileSync(settingsFilePath, 'utf-8');
            return { statusCode: 200, body: settingsData };
        } catch (error) {
            console.error("Error reading settings:", error);
            return { statusCode: 500, body: JSON.stringify({ message: 'Failed to read settings.', error: error.message }) };
        }
    }

    if (event.httpMethod === 'POST') {
        // IMPORTANT: Add proper authentication/authorization here in a real application!
        // This example is simplified and assumes the request comes from an authenticated admin session.
        // You might check a JWT passed from the client or use Netlify Identity.
        // if (!context.clientContext || !context.clientContext.user) {
        //    return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized" }) };
        // }

        try {
            let newSettingsData = JSON.parse(event.body);
            if (!newSettingsData.accentColor || !/^#[0-9A-F]{6}$/i.test(newSettingsData.accentColor)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Valid accentColor (hex format) is required.' }) };
            }

            // Automatically derive hover color
            newSettingsData.accentColorHover = darkenColor(newSettingsData.accentColor, 10);

            const isLocalDev = process.env.NETLIFY_DEV === 'true';
            let writeSuccessful = false;
            let serverMessage = 'Accent color updated for your current session.';

            if (isLocalDev) {
                try {
                    // fs.writeFileSync is synchronous.
                    fs.writeFileSync(settingsFilePath, JSON.stringify(newSettingsData, null, 2));
                    writeSuccessful = true;
                    serverMessage = 'Settings updated successfully and saved to file (local dev).';
                    console.log("Settings written to file (local dev):", settingsFilePath);
                } catch (writeError) {
                    console.error("Error writing settings to file (local dev):", writeError);
                    serverMessage = 'Settings updated for current session. Failed to write to file (local dev). Error: ' + writeError.message;
                }
            } else {
                serverMessage = 'Accent color updated for your current session. For permanent changes on the live site, the site configuration needs to be updated in your Git repository and redeployed.';
                console.warn("Write to settings file skipped in deployed environment. Change is ephemeral for this session.");
            }
            return { 
                statusCode: 200, 
                body: JSON.stringify({ 
                    message: serverMessage, 
                    settings: newSettingsData,
                    writeAttemptedOnServer: isLocalDev,
                    writeSuccessfulOnServer: writeSuccessful 
                }) 
            };
        } catch (parseError) { 
            console.error("Error processing settings POST request:", parseError);
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request data.', error: parseError.message }) };
        }
    } // This closing brace for the POST block was missing in the mental model of the diff.

    return { statusCode: 405, body: 'Method Not Allowed' };
};
