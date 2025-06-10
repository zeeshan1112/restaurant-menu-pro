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
            if (!fs.existsSync(settingsFilePath)) {
                // Create a default if it doesn't exist for some reason
                const defaultSettings = { accentColor: "#F59E0B", accentColorHover: "#D97706" };
                fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
                return { statusCode: 200, body: JSON.stringify(defaultSettings) };
            }
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
            const newSettingsData = JSON.parse(event.body);
            if (!newSettingsData.accentColor || !/^#[0-9A-F]{6}$/i.test(newSettingsData.accentColor)) {
                return { statusCode: 400, body: JSON.stringify({ message: 'Valid accentColor (hex format) is required.' }) };
            }

            // Automatically derive hover color if not provided or if you prefer consistency
            newSettingsData.accentColorHover = darkenColor(newSettingsData.accentColor, 10); // Darken by 10%

            fs.writeFileSync(settingsFilePath, JSON.stringify(newSettingsData, null, 2));
            return { statusCode: 200, body: JSON.stringify({ message: 'Settings updated successfully.', settings: newSettingsData }) };
        } catch (error) {
            console.error("Error writing settings:", error);
            return { statusCode: 500, body: JSON.stringify({ message: 'Failed to update settings.', error: error.message }) };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
