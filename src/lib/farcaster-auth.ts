
// farcaster-auth.ts - Chrome extension authentication logic for Farcaster SIWN integration

export interface FarcasterAuthResult {
  isError: boolean;
  message?: string;
  url?: string;
  data?: any;
}

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  verifications?: string[];
}

export interface SignInResponse {
  success: boolean;
  fid?: number;
  username?: string;
  bio?: string;
  displayName?: string;
  pfpUrl?: string;
  custodyAddress?: string;
  verifications?: string[];
  followerCount?: number;
  followingCount?: number;
}

// Configuration - Replace with your actual Neynar API credentials
const NEYNAR_CONFIG = {
  CLIENT_ID: process.env.PLASMO_PUBLIC_NEYNAR_CLIENT_ID || 'YOUR_NEYNAR_CLIENT_ID',
  API_KEY: process.env.PLASMO_PUBLIC_NEYNAR_API_KEY || 'YOUR_NEYNAR_API_KEY',
  REDIRECT_URI: chrome.runtime.getURL('auth-callback.html'), // Extension callback page
  NEYNAR_API_BASE: 'https://api.neynar.com/v2/farcaster'
};

// Generate a secure random string for CSRF protection and nonce
function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Check if we're in a Chrome extension environment
function isExtensionEnvironment(): boolean {
  return typeof chrome !== 'undefined' && chrome.storage && typeof chrome.storage.local !== 'undefined';
}

// Store auth state (compatible with both extension and web)
async function storeAuthState(state: any): Promise<void> {
  if (isExtensionEnvironment()) {
    await chrome.storage.local.set({
      farcasterAuthState: state,
      farcasterAuthTimestamp: Date.now()
    });
  } else {
    localStorage.setItem('farcasterAuthState', JSON.stringify(state));
    localStorage.setItem('farcasterAuthTimestamp', Date.now().toString());
  }
}

// Retrieve auth state (compatible with both extension and web)
async function getAuthState(): Promise<any> {
  if (isExtensionEnvironment()) {
    const result = await chrome.storage.local.get(['farcasterAuthState', 'farcasterAuthTimestamp']);
    
    // Check if state is expired (5 minutes)
    if (result.farcasterAuthTimestamp && Date.now() - result.farcasterAuthTimestamp > 5 * 60 * 1000) {
      await chrome.storage.local.remove(['farcasterAuthState', 'farcasterAuthTimestamp']);
      return null;
    }
    
    return result.farcasterAuthState;
  } else {
    const state = localStorage.getItem('farcasterAuthState');
    const timestamp = localStorage.getItem('farcasterAuthTimestamp');
    
    if (!state || !timestamp) return null;
    
    // Check if state is expired (5 minutes)
    if (Date.now() - parseInt(timestamp) > 5 * 60 * 1000) {
      clearAuthState();
      return null;
    }
    
    return JSON.parse(state);
  }
}

// Clear auth state (compatible with both extension and web)
async function clearAuthState(): Promise<void> {
  if (isExtensionEnvironment()) {
    await chrome.storage.local.remove([
      'farcasterAuthState',
      'farcasterAuthTimestamp',
      'farcasterAuthUrl',
      'farcasterCSRFToken',
      'farcasterNonce'
    ]);
  } else {
    const keysToRemove = [
      'farcasterAuthState',
      'farcasterAuthTimestamp',
      'farcasterAuthUrl',
      'farcasterCSRFToken',
      'farcasterNonce'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

// Store additional auth data (compatible with both extension and web)
async function storeAuthData(key: string, value: string): Promise<void> {
  if (isExtensionEnvironment()) {
    await chrome.storage.local.set({ [key]: value });
  } else {
    localStorage.setItem(key, value);
  }
}

// Retrieve auth data (compatible with both extension and web)
async function getAuthData(key: string): Promise<string | null> {
  if (isExtensionEnvironment()) {
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } else {
    return localStorage.getItem(key);
  }
}

// Remove auth data (compatible with both extension and web)
async function removeAuthData(keys: string[]): Promise<void> {
  if (isExtensionEnvironment()) {
    await chrome.storage.local.remove(keys);
  } else {
    keys.forEach(key => localStorage.removeItem(key));
  }
}

// Initiate Farcaster authentication
export async function initiateFarcasterAuth(): Promise<FarcasterAuthResult> {
  try {
    console.log('[Auth] Starting Farcaster authentication initiation...');
    
    // Clear any existing auth state
    await clearAuthState();
    
    // Generate CSRF token and nonce for security
    const csrfToken = generateSecureRandomString();
    const nonce = generateSecureRandomString();
    
    // Prepare the SIWN authorization URL
    const authParams = new URLSearchParams({
      client_id: NEYNAR_CONFIG.CLIENT_ID,
      redirect_uri: NEYNAR_CONFIG.REDIRECT_URI,
      response_type: 'code',
      scope: 'read write',
      state: csrfToken
    });
    
    const authUrl = `https://app.neynar.com/login?${authParams.toString()}`;
    
    // Store auth state for validation
    await storeAuthState({
      csrfToken,
      nonce,
      redirectUri: NEYNAR_CONFIG.REDIRECT_URI,
      timestamp: Date.now()
    });
    
    // Store auth URL for reference
    await storeAuthData('farcasterAuthUrl', authUrl);
    await storeAuthData('farcasterCSRFToken', csrfToken);
    await storeAuthData('farcasterNonce', nonce);
    
    console.log('[Auth] Auth URL generated:', authUrl);
    
    return {
      isError: false,
      url: authUrl,
      message: 'Authentication URL generated successfully'
    };
    
  } catch (error) {
    console.error('[Auth] Error initiating Farcaster auth:', error);
    return {
      isError: true,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Handle the callback from Neynar after user authorization
export async function handleFarcasterCallback(callbackUrl: string): Promise<FarcasterAuthResult> {
  try {
    console.log('[Auth] Handling Farcaster callback...', callbackUrl);
    
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    
    if (error) {
      throw new Error(`Authorization error: ${error}`);
    }
    
    if (!code) {
      throw new Error('No authorization code received');
    }
    
    // Validate CSRF state
    const authState = await getAuthState();
    if (!authState || authState.csrfToken !== state) {
      throw new Error('Invalid CSRF state');
    }
    
    console.log('[Auth] Exchanging code for token...');
    
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.neynar.com/v2/farcaster/login/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': NEYNAR_CONFIG.API_KEY
      },
      body: JSON.stringify({
        client_id: NEYNAR_CONFIG.CLIENT_ID,
        code: code,
        redirect_uri: NEYNAR_CONFIG.REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[Auth] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('[Auth] Token exchange successful');
    
    // Get user information
    const userInfo = await getUserInfo(tokenData.access_token);
    
    // Store the access token and user info securely
    await storeAuthData('farcasterAccessToken', tokenData.access_token);
    if (tokenData.refresh_token) {
      await storeAuthData('farcasterRefreshToken', tokenData.refresh_token);
    }
    await storeAuthData('farcasterUser', JSON.stringify(userInfo));
    await storeAuthData('farcasterTokenExpiry', (Date.now() + (tokenData.expires_in * 1000)).toString());
    
    // Clear temporary auth state
    await clearAuthState();
    
    console.log('[Auth] Farcaster authentication completed successfully');
    
    return {
      isError: false,
      message: 'Authentication successful',
      data: userInfo
    };
    
  } catch (error) {
    console.error('[Auth] Error handling Farcaster callback:', error);
    await clearAuthState();
    
    return {
      isError: true,
      message: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

// Get user information using access token
async function getUserInfo(accessToken: string): Promise<FarcasterUser> {
  try {
    const response = await fetch(`${NEYNAR_CONFIG.NEYNAR_API_BASE}/user/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'api_key': NEYNAR_CONFIG.API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }
    
    const userData = await response.json();
    const user = userData.user || userData;
    
    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.displayName,
      pfp: user.pfp_url || user.pfp,
      bio: user.profile?.bio?.text || user.bio,
      followerCount: user.follower_count || user.followerCount,
      followingCount: user.following_count || user.followingCount,
      verifications: user.verifications || []
    };
    
  } catch (error) {
    console.error('[Auth] Error fetching user info:', error);
    throw error;
  }
}

// Check if user is currently authenticated
export async function checkFarcasterAuth(): Promise<{ isAuthenticated: boolean; user?: FarcasterUser }> {
  try {
    const accessToken = await getAuthData('farcasterAccessToken');
    const userJson = await getAuthData('farcasterUser');
    const tokenExpiry = await getAuthData('farcasterTokenExpiry');
    
    if (!accessToken || !userJson) {
      return { isAuthenticated: false };
    }
    
    // Check if token is expired
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      console.log('[Auth] Token expired, clearing auth state');
      await signOutFarcaster();
      return { isAuthenticated: false };
    }
    
    return {
      isAuthenticated: true,
      user: JSON.parse(userJson)
    };
    
  } catch (error) {
    console.error('[Auth] Error checking auth status:', error);
    return { isAuthenticated: false };
  }
}

// Sign out and clear all Farcaster auth data
export async function signOutFarcaster(): Promise<void> {
  try {
    console.log('[Auth] Signing out from Farcaster...');
    
    const keysToRemove = [
      'farcasterAccessToken',
      'farcasterRefreshToken',
      'farcasterUser',
      'farcasterTokenExpiry',
      'farcasterAuthState',
      'farcasterAuthTimestamp',
      'farcasterAuthUrl',
      'farcasterNonce',
      'farcasterCSRFToken'
    ];
    
    await removeAuthData(keysToRemove);
    
    console.log('[Auth] Farcaster sign out completed');
    
  } catch (error) {
    console.error('[Auth] Error during sign out:', error);
    throw error;
  }
}
