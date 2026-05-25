/**
 * GitHub API Service to manage connected Personal Access Tokens (PATs) and repository synchronization.
 */

const REPO_NAME = "CodeQuest-Snippets";

const LANG_EXTENSIONS = {
  javascript: "js",
  python: "py",
  typescript: "ts",
  cpp: "cpp"
};

/**
 * Verify GitHub Token and fetch user profile metadata
 */
export const verifyGitHubToken = async (token) => {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeQuest-Application"
      }
    });

    if (!response.ok) {
      throw new Error("Invalid GitHub Personal Access Token.");
    }

    const userData = await response.json();
    return userData.login; // returns github username
  } catch (error) {
    throw new Error(`GitHub Authentication failed: ${error.message}`);
  }
};

/**
 * Ensures CodeQuest repository exists, otherwise creates it dynamically
 */
const ensureRepositoryExists = async (token, username) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CodeQuest-Application",
    "Content-Type": "application/json"
  };

  try {
    // Check if repository already exists
    const checkResponse = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, {
      headers
    });

    if (checkResponse.ok) {
      console.log(`[GitHubService] Repo '${REPO_NAME}' already exists.`);
      return;
    }

    console.log(`[GitHubService] Repo '${REPO_NAME}' not found. Creating a new one...`);
    
    // Create new public repository
    const createResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: REPO_NAME,
        description: "⚔️ Code Quest gamified workspace code snippets cloud repository.",
        private: false,
        auto_init: true
      })
    });

    if (!createResponse.ok) {
      const errData = await createResponse.json();
      throw new Error(`Failed to initialize repo: ${errData.message}`);
    }

    console.log(`[GitHubService] Created repository '${REPO_NAME}' successfully!`);
    
    // Wait briefly for GitHub database syncing
    await new Promise((resolve) => setTimeout(resolve, 1500));

  } catch (error) {
    throw new Error(`Repo initialization failed: ${error.message}`);
  }
};

/**
 * Pushes a code snippet file directly to the CodeQuest repository
 */
export const pushSnippetToGitHub = async (
  token,
  username,
  fileName,
  language,
  code
) => {
  await ensureRepositoryExists(token, username);

  const cleanLang = language.toLowerCase();
  const ext = LANG_EXTENSIONS[cleanLang] || "txt";
  const cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
  const path = `${cleanFileName}.${ext}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CodeQuest-Application",
    "Content-Type": "application/json"
  };

  let sha = null;

  try {
    // 1. Check if the file already exists to retrieve its hash (SHA) required for updates
    const getResponse = await fetch(
      `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${path}`,
      { headers }
    );

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // Convert code string to Base64 (Standard browser/Node encoding)
    const base64Code = Buffer.from(code).toString("base64");

    // 2. Commit and upload the file to the repository
    const commitMsg = sha ? `Update snippet: ${fileName}` : `Add snippet: ${fileName}`;
    
    const putResponse = await fetch(
      `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${path}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `${commitMsg} 🚀`,
          content: base64Code,
          sha: sha || undefined
        })
      }
    );

    if (!putResponse.ok) {
      const errData = await putResponse.json();
      throw new Error(`GitHub Commit failed: ${errData.message}`);
    }

    const resData = await putResponse.json();
    return resData.content.html_url; // Direct file URL link

  } catch (error) {
    throw new Error(`Failed to commit code: ${error.message}`);
  }
};
