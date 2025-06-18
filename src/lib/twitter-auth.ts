// Twitter OAuth Configuration
const TWITTER_CLIENT_ID = process.env.PLASMO_PUBLIC_TWITTER_CLIENT_ID;
// Use the root redirect URI (no /oauth2)
const REDIRECT_URI = chrome.identity.getRedirectURL("");

if (!TWITTER_CLIENT_ID) {
  throw new Error("Twitter Client ID is not configured. Please set PLASMO_PUBLIC_TWITTER_CLIENT_ID in your .env file");
}

// Store PKCE verifier in session storage
const PKCE_STORAGE_KEY = "twitter_pkce_verifier";

export const initiateTwitterAuth = async () => {
  try {
    // Generate PKCE challenge and verifier
    const verifier = generateRandomState();
    const challenge = await generateCodeChallenge(verifier);
    
    // Store verifier for later use
    sessionStorage.setItem(PKCE_STORAGE_KEY, verifier);

    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    const params = {
      response_type: "code",
      client_id: TWITTER_CLIENT_ID as string,
      redirect_uri: REDIRECT_URI,
      scope: "tweet.read tweet.write users.read offline.access",
      state: generateRandomState(),
      code_challenge: challenge,
      code_challenge_method: "S256",
    };

    authUrl.search = new URLSearchParams(params).toString();
    
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.toString(),
          interactive: true,
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError) {
            console.error("OAuth Error:", chrome.runtime.lastError.message, chrome.runtime.lastError);
            reject(new Error("Failed to complete OAuth flow: " + chrome.runtime.lastError.message));
            return;
          }

          try {
            const url = new URL(responseUrl as string);
            const code = url.searchParams.get("code");
            const error = url.searchParams.get("error");
            const errorDescription = url.searchParams.get("error_description");

            if (error) {
              console.error("Twitter OAuth Error:", error, errorDescription);
              reject(new Error(errorDescription || "Authentication failed"));
              return;
            }

            if (!code) {
              console.error("No authorization code received. Full response URL:", responseUrl);
              reject(new Error("No authorization code received"));
              return;
            }

            // Exchange code for access token
            const tokenResponse = await exchangeCodeForToken(code);
            if (tokenResponse) {
              // Store tokens securely
              await storeTokens(tokenResponse);
              resolve(tokenResponse);
            } else {
              reject(new Error("Failed to exchange code for token"));
            }
          } catch (err) {
            console.error("Error processing OAuth response:", err, responseUrl);
            reject(err);
          }
        }
      );
    });
  } catch (err) {
    console.error("Error initiating Twitter auth:", err);
    throw err;
  }
};

async function exchangeCodeForToken(code: string) {
  try {
    const verifier = sessionStorage.getItem(PKCE_STORAGE_KEY);
    if (!verifier) {
      throw new Error("PKCE verifier not found");
    }

    const tokenUrl = "https://api.twitter.com/2/oauth2/token";
    const params = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: TWITTER_CLIENT_ID as string,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Token exchange error:", error);
      throw new Error(error.error_description || "Failed to exchange code for token");
    }

    return await response.json();
  } catch (err) {
    console.error("Error exchanging code for token:", err);
    throw err;
  } finally {
    // Clean up PKCE verifier
    sessionStorage.removeItem(PKCE_STORAGE_KEY);
  }
}

async function storeTokens(tokenResponse: any) {
  try {
    // Store tokens in chrome.storage.local
    await chrome.storage.local.set({
      twitter_access_token: tokenResponse.access_token,
      twitter_refresh_token: tokenResponse.refresh_token,
      twitter_token_expiry: Date.now() + (tokenResponse.expires_in * 1000),
    });
  } catch (err) {
    console.error("Error storing tokens:", err);
    throw err;
  }
}

// Helper functions
function generateRandomState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Check if user is connected to Twitter
export const isTwitterConnected = async (): Promise<boolean> => {
  try {
    const data = await chrome.storage.local.get([
      "twitter_access_token",
      "twitter_token_expiry"
    ]);

    if (!data.twitter_access_token) {
      return false;
    }

    // Check if token is expired
    if (data.twitter_token_expiry && Date.now() > data.twitter_token_expiry) {
      // Token expired, try to refresh
      return await refreshTwitterToken();
    }

    return true;
  } catch (err) {
    console.error("Error checking Twitter connection:", err);
    return false;
  }
};

// Refresh Twitter token
async function refreshTwitterToken(): Promise<boolean> {
  try {
    const data = await chrome.storage.local.get("twitter_refresh_token");
    if (!data.twitter_refresh_token) {
      return false;
    }

    const tokenUrl = "https://api.twitter.com/2/oauth2/token";
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: TWITTER_CLIENT_ID as string,
      refresh_token: data.twitter_refresh_token,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const tokenResponse = await response.json();
    await storeTokens(tokenResponse);
    return true;
  } catch (err) {
    console.error("Error refreshing Twitter token:", err);
    return false;
  }
} 