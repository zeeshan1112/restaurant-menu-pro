const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");

// Assumes site-settings.json is in the project root.
// Adjust if you place it elsewhere (e.g., a 'data' folder).
const settingsFilePath = path.resolve(__dirname, '../../site-settings.json');

// --- GITHUB CONFIGURATION ---
const REPO_OWNER = 'zeeshan1112';
const REPO_NAME = 'restaurant-menu-pro';
const FILE_PATH = 'site-settings.json'; // The path to the file in your GitHub repository

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

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });


exports.handler = async (event, context) => {
    const isLocalDev = process.env.NETLIFY_DEV === 'true';

    if (event.httpMethod === 'GET') {
        if (isLocalDev) {
            console.log(`[settings.js GET] Running in LOCAL mode. Reading from ${settingsFilePath}`);
            try {
                const settingsData = fs.readFileSync(settingsFilePath, 'utf-8');
                return { statusCode: 200, body: settingsData };
            } catch (readError) {
                console.warn(`[settings.js GET] Could not read settings file at ${settingsFilePath}. Returning defaults. Error: ${readError.message}`);
                const defaultSettings = { accentColor: "#F59E0B", accentColorHover: "#D97706" };
                if (!fs.existsSync(settingsFilePath)) { // Only write if it truly doesn't exist locally
                    fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2));
                    console.log(`[settings.js GET] Created default settings file locally at ${settingsFilePath}`);
                }
                return { statusCode: 200, body: JSON.stringify(defaultSettings) };
            }
        } else {
            // LIVE on Netlify: Use GitHub API for GET
            console.log('[settings.js GET] Running in LIVE mode. Using GitHub API.');
            try {
                const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
                return { statusCode: 200, body: Buffer.from(data.content, 'base64').toString('utf-8') };
            } catch (error) {
                if (error.status === 404) { // File not found on GitHub
                    console.warn(`[settings.js GET] ${FILE_PATH} not found on GitHub. Returning defaults.`);
                    const defaultSettings = { accentColor: "#F59E0B", accentColorHover: "#D97706" };
                    return { statusCode: 200, body: JSON.stringify(defaultSettings) };
                }
                console.error("Error reading settings from GitHub:", error);
                return { statusCode: 500, body: JSON.stringify({ message: 'Failed to read settings from GitHub.', error: error.message }) };
            }
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

            // Ensure sectionTitleFont is handled
            if (newSettingsData.sectionTitleFont === undefined) {
                // If not explicitly sent, you might want to fetch existing settings and merge,
                // or ensure the frontend always sends it. For now, we assume it's part of the payload.
            }
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
                // LIVE on Netlify: Use GitHub API for POST
                console.log('[settings.js POST] Running in LIVE mode. Using GitHub API to update settings.');
                let currentSha = null;
                try {
                    // Try to get current SHA. If file doesn't exist, this will throw.
                    const response = await octokit.repos.getContent({
                        owner: REPO_OWNER,
                        repo: REPO_NAME,
                        path: FILE_PATH
                    });
                    currentSha = response.data.sha;
                } catch (error) {
                    if (error.status === 404) {
                        console.log(`[settings.js POST] ${FILE_PATH} not found on GitHub. Will attempt to create it.`);
                        // currentSha remains null, createOrUpdateFileContents will create the file
                    } else {
                        // For other errors fetching content, pass them to the main catch
                        throw new Error(`Failed to get current file SHA from GitHub: ${error.message}`);
                    }
                }

                try {
                    await octokit.repos.createOrUpdateFileContents({
                        owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH,
                        message: `[CMS] Update site settings (accentColor): ${new Date().toISOString()}`,
                        content: Buffer.from(JSON.stringify(newSettingsData, null, 2)).toString('base64'),
                        sha: currentSha, // Pass null if creating, or the SHA if updating
                    });
                    writeSuccessful = true; // Assuming success if no error
                    serverMessage = 'Site settings updated successfully on GitHub.';
                } catch (githubError) {
                    console.error("Error writing settings to GitHub:", githubError);
                    // Keep writeSuccessful as false
                    serverMessage = `Failed to save settings to GitHub: ${githubError.message}. Changes applied to current session only.`;
                }
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
            console.error("Error processing settings POST request (outer catch):", parseError);
            return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request data.', error: parseError.message }) };
        }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
};
