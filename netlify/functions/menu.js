const { Octokit } = require("@octokit/rest");

// --- CONFIGURATION ---
const REPO_OWNER = 'zeeshan1112';
const REPO_NAME = 'restaurant-menu-pro';
// --------------------

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });

exports.handler = async function(event) {
  // GET request handler (no changes here)
  if (event.httpMethod === 'GET') {
    try {
      const { data } = await octokit.repos.getContent({ owner: REPO_OWNER, repo: REPO_NAME, path: 'menu.json' });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return { statusCode: 200, body: content };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching menu' }) };
    }
  }

  // POST request handler with detailed logging
  if (event.httpMethod === 'POST') {
    console.log('[FUNCTION LOG] Received a POST request to update the menu.');
    
    try {
      console.log('[FUNCTION LOG] Step 1: Attempting to fetch current menu.json to get its SHA.');
      const { data: { sha } } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'menu.json',
      });
      console.log('[FUNCTION LOG] Step 2: Successfully fetched SHA:', sha);

      const newContent = Buffer.from(event.body).toString('base64');
      console.log('[FUNCTION LOG] Step 3: Preparing to send new content to GitHub.');
      // The line below is commented out as it would log the entire file content, which is too long.
      // console.log('New content (decoded):', event.body); 

      const response = await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: 'menu.json',
        message: `[CMS] Update menu: ${new Date().toISOString()}`,
        content: newContent,
        sha: sha,
      });

      console.log('[FUNCTION LOG] Step 4: GitHub API call was successful!');
      console.log('[FUNCTION LOG] GitHub response status:', response.status);

      return { statusCode: 200, body: JSON.stringify({ message: 'Menu updated successfully' }) };

    } catch (error) {
      console.error('[FUNCTION LOG] !!! AN ERROR OCCURRED !!!');
      console.error('[FUNCTION LOG] Error details:', error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ message: 'Error updating menu. Check function logs on Netlify.' }) 
      };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};