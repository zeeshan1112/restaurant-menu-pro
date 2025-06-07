const { Octokit } = require("@octokit/rest");

// --- CONFIGURATION ---
const REPO_OWNER = 'zeeshan1112';
const REPO_NAME = 'restaurant-menu-pro';
// --------------------

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

exports.handler = async function(event) {
  const FILE_PATH = 'categories.json';

  // GET request: Read the list of categories
  if (event.httpMethod === 'GET') {
    try {
      const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { statusCode: 200, body: content };
    } catch (error) {
      console.error(`[categories.js] Error fetching ${FILE_PATH}:`, error);
      return { statusCode: 500, body: JSON.stringify({ message: `Error fetching categories: ${error.message}` }) };
    }
  }

  // POST request: Overwrite the list of categories with a new one
  if (event.httpMethod === 'POST') {
    try {
      const { data: { sha } } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH });
      const newContent = Buffer.from(event.body).toString('base64');

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER, repo: REPO_NAME, path: FILE_PATH,
        message: `[CMS] Update categories: ${new Date().toISOString()}`,
        content: newContent,
        sha: sha,
      });

      return { statusCode: 200, body: JSON.stringify({ message: 'Categories updated successfully' }) };
    } catch (error) {
      console.error(`[categories.js] Error updating ${FILE_PATH}:`, error);
      return { statusCode: 500, body: JSON.stringify({ message: `Error updating categories: ${error.message}` }) };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};