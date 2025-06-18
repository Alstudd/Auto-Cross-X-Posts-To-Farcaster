"use client";
import { useState, useEffect } from "react";
import { 
  initiateFarcasterAuth, 
  signOutFarcaster,
  type FarcasterUser, 
} from "@/lib/farcaster-auth";
import { initiateTwitterAuth, isTwitterConnected as checkTwitterConnection } from "@/lib/twitter-auth";

export default function Popup() {
  const [isLoading, setIsLoading] = useState(true);
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  useEffect(() => {
    const checkConnections = async () => {
      try {
        console.log('[Popup] Checking initial connections...');
        
        // Check storage directly
        const storage = await chrome.storage.local.get(['farcasterUser', 'authStatus']);
        console.log('[Popup] Current storage state:', storage);
        
        const response = await chrome.runtime.sendMessage({
          type: 'CHECK_FARCASTER_AUTH'
        });
        console.log('[Popup] Farcaster user status:', response);
        if (response.success && response.isAuthenticated) {
          setFarcasterUser(response.user);
        }
        
        const twitterStatus = await checkTwitterConnection();
        console.log('[Popup] Twitter connection status:', twitterStatus);
        setTwitterConnected(twitterStatus);
        
        // Check current auth status
        const authStatus = await getAuthStatus();
        console.log('[Popup] Current auth status:', authStatus);
        setIsAuthenticating(authStatus === 'pending');
        
      } catch (err) {
        console.error('[Popup] Connection check error:', err);
        setError("Failed to check connections");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnections();
  }, []);

  // Listen for background script messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('[Popup] Received message:', message);
      
      switch (message.type) {
        case 'FARCASTER_AUTH_SUCCESS':
          setIsAuthenticating(false);
          setShowSuccess(true);
          setIsSuccessVisible(true);
          // Refresh user data
          chrome.runtime.sendMessage({
            type: 'CHECK_FARCASTER_AUTH'
          }).then(response => {
            if (response.success && response.isAuthenticated) {
              setFarcasterUser(response.user);
            }
          });
          break;
          
        case 'FARCASTER_AUTH_FAILURE':
          setIsAuthenticating(false);
          setError(message.error || 'Authentication failed');
          break;
          
        case 'FARCASTER_SIGN_OUT':
          setFarcasterUser(null);
          setAuthUrl(null);
          setError(null);
          setIsAuthenticating(false);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      console.log('[Popup] Storage changed:', changes);
      
      if (changes.farcasterUser) {
        console.log('[Popup] Farcaster user updated in storage:', changes.farcasterUser.newValue);
        setFarcasterUser(changes.farcasterUser.newValue);
      }
      
      if (changes.authStatus) {
        console.log('[Popup] Auth status updated in storage:', changes.authStatus.newValue);
        const newStatus = changes.authStatus.newValue;
        setIsAuthenticating(newStatus === 'pending');
        
        if (newStatus === 'completed') {
          // Refresh user data when auth completes
          chrome.runtime.sendMessage({
            type: 'CHECK_FARCASTER_AUTH'
          }).then(response => {
            if (response.success && response.isAuthenticated) {
              setFarcasterUser(response.user);
            }
          });
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Add CSS animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      @keyframes slideOut {
        from { transform: translateX(0); }
        to { transform: translateX(100%); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Handle success message visibility
  useEffect(() => {
    let timer: number;
    if (showSuccess) {
      timer = window.setTimeout(() => {
        setIsSuccessVisible(false);
        window.setTimeout(() => {
          setShowSuccess(false);
        }, 300);
      }, 3000);
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [showSuccess]);

  const handleTwitterConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await initiateTwitterAuth();
      const twitterStatus = await checkTwitterConnection();
      setTwitterConnected(twitterStatus);
    } catch (err) {
      console.error('Twitter connection error:', err);
      setError(err instanceof Error ? err.message : "Failed to connect to Twitter");
    } finally {
      setIsLoading(false);
    }
  };

// Updated frontend functions to integrate with the new backend

// Function to initiate Farcaster authentication
 const initiateFarcasterAuth = async () => {
  try {
    console.log('[Frontend] Initiating Farcaster authentication...');
    
    const response = await chrome.runtime.sendMessage({
      type: 'INITIATE_FARCASTER_AUTH'
    });
    
    if (!response.success) {
      return {
        isError: true,
        message: response.error || 'Failed to initiate authentication'
      };
    }
    
    return {
      isError: false,
      url: response.url,
      message: response.message
    };
    
  } catch (error) {
    console.error('[Frontend] Error initiating Farcaster auth:', error);
    return {
      isError: true,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to check current Farcaster authentication status
 const checkFarcasterAuth = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_FARCASTER_AUTH'
    });
    
    if (!response.success) {
      return {
        isAuthenticated: false,
        error: response.error
      };
    }
    
    return {
      isAuthenticated: response.isAuthenticated,
      user: response.user
    };
    
  } catch (error) {
    console.error('[Frontend] Error checking Farcaster auth:', error);
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to sign out from Farcaster
 const signOutFarcaster = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SIGN_OUT_FARCASTER'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to sign out');
    }
    
    console.log('[Frontend] Successfully signed out from Farcaster');
    
  } catch (error) {
    console.error('[Frontend] Error signing out from Farcaster:', error);
    throw error;
  }
};

// Updated handleFarcasterConnect function
const handleFarcasterConnect = async () => {
  try {
    console.log('[Popup] Starting Farcaster connection...');
    setIsAuthenticating(true);
    setError(null);

    // Send message to background script to initiate auth
    const response = await chrome.runtime.sendMessage({
      type: 'INITIATE_FARCASTER_AUTH'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to start authentication');
    }

    // Store auth URL and open in new tab
    setAuthUrl(response.url);
    console.log('[Popup] Opening auth URL:', response.url);
    await chrome.tabs.create({ url: response.url });

    // Listen for auth completion
    const messageListener = (message: any) => {
      if (message.type === 'AUTH_CALLBACK_COMPLETE') {
        console.log('[Popup] Received auth callback result:', message);
        
        if (message.success) {
          // Authentication successful
          setFarcasterUser(message.user);
          setAuthUrl(null);
          setIsAuthenticating(false);
          setError(null);
          
          // Show success message
          setShowSuccess(true);
          setIsSuccessVisible(true);
        } else {
          // Authentication failed
          setError(message.error || 'Authentication failed');
          setIsAuthenticating(false);
          setAuthUrl(null);
        }
        
        // Remove listener after handling
        chrome.runtime.onMessage.removeListener(messageListener);
      }
    };
    
    // Add message listener for auth completion
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Fallback: Check auth status after a delay
    setTimeout(async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CHECK_FARCASTER_AUTH'
        });

        if (response.success && response.isAuthenticated && response.user) {
          setFarcasterUser(response.user);
          setAuthUrl(null);
          setIsAuthenticating(false);
          setError(null);
          
          // Remove listener if auth completed
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      } catch (error) {
        console.error('[Popup] Error in fallback auth check:', error);
      }
    }, 5000);

  } catch (err) {
    console.error('[Popup] Farcaster connection error:', err);
    setError(err instanceof Error ? err.message : "Failed to connect to Farcaster");
    setIsAuthenticating(false);
    setAuthUrl(null);
  }
};

// Updated handleFarcasterDisconnect function
const handleFarcasterDisconnect = async () => {
  try {
    setIsLoading(true);
    const response = await chrome.runtime.sendMessage({
      type: 'SIGN_OUT_FARCASTER'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to sign out');
    }

    setFarcasterUser(null);
    setAuthUrl(null);
    setError(null);
    console.log('[Popup] Successfully disconnected from Farcaster');
  } catch (err) {
    console.error('Disconnect error:', err);
    setError("Failed to disconnect from Farcaster");
  } finally {
    setIsLoading(false);
  }
};

// Updated loadInitialAuthState function
const loadInitialAuthState = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_FARCASTER_AUTH'
    });
    
    if (response.success && response.isAuthenticated && response.user) {
      setFarcasterUser(response.user);
      setIsAuthenticating(false);
      setAuthUrl(null);
      setError(null);
    } else {
      setFarcasterUser(null);
      setIsAuthenticating(false);
      setAuthUrl(null);
    }
    
  } catch (error) {
    console.error('[Popup] Error loading initial auth state:', error);
    setFarcasterUser(null);
    setIsAuthenticating(false);
    setError('Failed to load authentication state');
  }
};

// Updated handleTestCrossPost function with better error handling
const handleTestCrossPost = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Check if user is authenticated first
    const authCheck = await checkFarcasterAuth();
    if (!authCheck.isAuthenticated) {
      throw new Error('Please connect your Farcaster account first');
    }
    
    // Send test message to background script
    const response = await chrome.runtime.sendMessage({
      type: 'CROSS_POST_TWEET',
      data: {
        tweetText: 'Test cross-post from Noice extension! 🚀 #Farcaster #Web3',
        tweetUrl: 'https://twitter.com/test/status/123456789'
      }
    });
    
    if (response.success) {
      setShowSuccess(true);
      setIsSuccessVisible(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setIsSuccessVisible(false);
        setTimeout(() => setShowSuccess(false), 300);
      }, 3000);
      
    } else {
      setError(response.error || 'Cross-post failed');
    }
    
  } catch (err) {
    console.error('Cross-post test error:', err);
    setError(err instanceof Error ? err.message : 'Failed to test cross-post functionality');
  } finally {
    setIsLoading(false);
  }
};

// Function to handle posting a custom cast
const postCustomCast = async (text: string, options: {
  embeds?: string[];
  replyTo?: string;
  channelId?: string;
} = {}) => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'POST_CAST',
      data: {
        text: text,
        embeds: options.embeds,
        replyTo: options.replyTo,
        channelId: options.channelId
      }
    });
    
    return response;
    
  } catch (error) {
    console.error('[Frontend] Error posting custom cast:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Function to get comprehensive auth status
 const getAuthStatus = async () => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_AUTH_STATUS'
    });
    
    return response;
    
  } catch (error) {
    console.error('[Frontend] Error getting auth status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Hook for managing Farcaster auth state in React components
 const useFarcasterAuth = () => {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load initial auth state
  useEffect(() => {
    loadAuthState();
  }, []);
  
  const loadAuthState = async () => {
    try {
      setIsLoading(true);
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_FARCASTER_AUTH'
      });
      
      if (response.success) {
        setIsAuthenticated(response.isAuthenticated);
        setUser(response.user || null);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to check auth status');
      }
      
    } catch (err) {
      console.error('Error loading auth state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load auth state');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const connect = async () => {
    try {
      setError(null);
      const result = await initiateFarcasterAuth();
      
      if (result.isError) {
        throw new Error(result.message);
      }
      
      // Open auth URL
      await chrome.tabs.create({ url: result.url });
      
      // The auth completion will be handled by message listeners
      return { success: true, url: result.url };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  const disconnect = async () => {
    try {
      setError(null);
      await signOutFarcaster();
      
      setIsAuthenticated(false);
      setUser(null);
      
      return { success: true };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  const postCast = async (text: any, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with Farcaster');
    }
    
    return await postCustomCast(text, options);
  };
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    connect,
    disconnect,
    postCast,
    refresh: loadAuthState
  };
};

  if (isLoading) {
    return (
      <div style={{ width: 500, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid #e5e7eb", 
            borderTop: "4px solid #8b5cf6", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem"
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 500, height: 400, overflow: "auto", position: "relative", margin: "0 auto", padding: "1rem" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "1rem", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "row", borderBottom: "1px solid #e5e7eb", padding: "0.5rem 0.5rem", alignItems: "center" }}>
          <img src="/icon.png" height={30} width={30} alt="logo" />
          <h2 style={{ margin: "auto" }}>Noice</h2>
          {farcasterUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img 
                src={farcasterUser.pfp} 
                alt="Profile" 
                style={{ width: 24, height: 24, borderRadius: "50%" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzk0YTNiOCIvPjwvc3ZnPg==';
                }}
              />
              <span style={{ fontSize: "0.875rem" }}>{farcasterUser.displayName}</span>
            </div>
          )}
        </div>
        
       
        
        {isAuthenticating && (
          <div style={{ padding: "0.75rem", margin: "0.5rem", backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: "0.375rem", fontSize: "0.875rem", border: "1px solid #bfdbfe" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ 
                width: "16px", 
                height: "16px", 
                border: "2px solid #bfdbfe", 
                borderTop: "2px solid #1d4ed8", 
                borderRadius: "50%", 
                animation: "spin 1s linear infinite",
                marginRight: "0.5rem"
              }}></div>
              <div style={{ fontWeight: "500" }}>Authenticating with Farcaster...</div>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              1. Scan the QR code with your Farcaster app
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              2. Approve the connection request
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              3. Wait for the connection to complete
            </div>
            
          </div>
        )}
        
        <div style={{ padding: "1rem", flex: 1 }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "600" }}>Welcome to Noice Extension!</h2>
          <p style={{ fontSize: "0.875rem", marginBottom: "1.5rem", color: "#6b7280" }}>
            Auto Cross-Post to Farcaster with the help of Noice. Automatically cross-post your tweets to Farcaster. Earn tips when your content performs well!
          </p>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: "500" }}>Connection Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                padding: "0.75rem", 
                backgroundColor: farcasterUser ? "#dcfce7" : "#fee2e2", 
                borderRadius: "0.5rem",
                border: `1px solid ${farcasterUser ? "#bbf7d0" : "#fecaca"}`
              }}>
                <div style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: farcasterUser ? "#16a34a" : "#dc2626" 
                }}></div>
                <span style={{ fontWeight: "500" }}>Farcaster:</span>
                <span style={{ color: farcasterUser ? "#166534" : "#991b1b" }}>
                  {farcasterUser ? "Connected" : "Not Connected"}
                </span>
                {farcasterUser && (
                  <button 
                    onClick={handleFarcasterDisconnect}
                    style={{ 
                      marginLeft: "auto", 
                      padding: "0.25rem 0.5rem", 
                      fontSize: "0.75rem", 
                      backgroundColor: "#dc2626", 
                      color: "white", 
                      border: "none", 
                      borderRadius: "0.25rem", 
                      cursor: "pointer" 
                    }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
              
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                padding: "0.75rem", 
                backgroundColor: twitterConnected ? "#dcfce7" : "#fee2e2", 
                borderRadius: "0.5rem",
                border: `1px solid ${twitterConnected ? "#bbf7d0" : "#fecaca"}`
              }}>
                <div style={{ 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: twitterConnected ? "#16a34a" : "#dc2626" 
                }}></div>
                <span style={{ fontWeight: "500" }}>Twitter:</span>
                <span style={{ color: twitterConnected ? "#166534" : "#991b1b" }}>
                  {twitterConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            {!farcasterUser && !isAuthenticating && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ 
                  padding: "1rem", 
                  backgroundColor: "#f8fafc", 
                  borderRadius: "0.5rem", 
                  border: "1px solid #e2e8f0"
                }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Connect to Farcaster
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
                    Connect your Farcaster account to enable cross-posting:
                  </p>
                  <button 
                    onClick={handleFarcasterConnect} 
                    style={{ 
                      width: "100%",
                      display: "inline-flex", 
                      alignItems: "center", 
                      padding: "0.75rem 1rem", 
                      justifyContent: "center", 
                      borderRadius: "0.5rem", 
                      fontSize: "0.875rem", 
                      fontWeight: 500, 
                      backgroundColor: "#8b5cf6", 
                      color: "white", 
                      border: "none", 
                      cursor: "pointer"
                    }}
                  >
                    Connect with Farcaster
                  </button>
                </div>
              </div>
            )}
            
            {!twitterConnected && (
              <button 
                onClick={handleTwitterConnect} 
                disabled={isLoading}
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  padding: "0.75rem 1rem", 
                  justifyContent: "center", 
                  borderRadius: "0.5rem", 
                  fontSize: "0.875rem", 
                  fontWeight: 500, 
                  backgroundColor: "#1da1f2", 
                  color: "white", 
                  border: "none", 
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                Connect Twitter
              </button>
            )}
          </div>
          
          {farcasterUser && twitterConnected && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: "500" }}>🎉 All Set!</h3>
              <div style={{ 
                padding: "1rem", 
                backgroundColor: "#f0fdf4", 
                borderRadius: "0.5rem", 
                fontSize: "0.875rem",
                border: "1px solid #bbf7d0",
                marginBottom: "1rem"
              }}>
                <p style={{ color: "#166534", fontWeight: "500", marginBottom: "0.5rem" }}>
                  Your accounts are connected and ready to go!
                </p>
                <p style={{ color: "#16a34a" }}>
                  Your tweets will be automatically cross-posted to Farcaster when you tweet.
                </p>
              </div>
              
              <button 
                onClick={handleTestCrossPost}
                disabled={isLoading}
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  padding: "0.75rem 1rem", 
                  justifyContent: "center", 
                  borderRadius: "0.5rem", 
                  fontSize: "0.875rem", 
                  fontWeight: 500, 
                  backgroundColor: "#16a34a", 
                  color: "white", 
                  border: "none", 
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.6 : 1,
                  width: "100%"
                }}
              >
                Test Cross-Post
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '1rem',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          transform: isSuccessVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out'
        }}>
          ✅ Success! Operation completed successfully.
        </div>
      )}
    </div>
  );
}