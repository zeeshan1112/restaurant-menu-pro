const { Octokit } = require("@octokit/rest");
const fs = require('fs').promises;
const path = require('path');

// --- CONFIGURATION ---
const REPO_OWNER = 'zeeshan1112';
const REPO_NAME = 'restaurant-menu-pro';
const FILE_PATH = 'categories.json';
// --------------------

const localFilePath = path.resolve(__dirname, '../../', FILE_PATH);
const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

exports.handler = async function(event) {
  // If we are running locally with `netlify dev`...
  if (process.env.NETLIFY_DEV) {
    console.log(`[categories.js] Running in LOCAL mode. Reading/writing to ${localFilePath}`);

    // GET request: Read the local file
    if (event.httpMethod === 'GET') {
      try {
        const data = await fs.readFile(localFilePath, 'utf-8');
        return { statusCode: 200, body: data };
      } catch (error) {
        return { statusCode: 500, body: `Error reading local categories file: ${error.message}` };
      }
    }

    // POST request: Write to the local file
    if (event.httpMethod === 'POST') {
      try {
        await fs.writeFile(localFilePath, event.body, 'utf-8');
        return { statusCode: 200, body: JSON.stringify({ message: 'Local categories updated successfully' }) };
      } catch (error) {
        return { statusCode: 500, body: `Error writing to local categories file: ${error.message}` };
      }
    }
  }

  // --- If we are LIVE on Netlify, use the GitHub API (this code is unchanged) ---
  console.log('[categories.js] Running in LIVE mode. Using GitHub API.');

  if (event.httpMethod === 'GET') {
    try {
      const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
      return { statusCode: 200, body: Buffer.from(data.content, 'base64').toString('utf-8') };
    } catch (error) { /* ... */ }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { data: { sha } } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH,
        message: `[CMS] Update categories: ${new Date().toISOString()}`,
        content: Buffer.from(event.body).toString('base64'),
        sha: sha,
      });
      return { statusCode: 200, body: JSON.stringify({ message: 'Categories updated successfully' }) };
    } catch (error) { /* ... */ }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};