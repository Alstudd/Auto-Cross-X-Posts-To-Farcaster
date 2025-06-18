// background.js - Background script for Plasmo extension with Farcaster integration

import {
  initiateFarcasterAuth,
  handleFarcasterCallback,
  checkFarcasterAuth,
  signOutFarcaster,
  // postCast
} from "@/lib/farcaster-auth";

// Extension installation and setup
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] Noice extension installed");

  // Initialize extension storage
  chrome.storage.local.set({
    extensionVersion: chrome.runtime.getManifest().version,
    installDate: Date.now(),
  });
});

// Listen for tab updates to catch when the callback page loads
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes("auth-callback.html")) {
    const url = new URL(changeInfo.url);
    const fullUrl = url.href;

    // Process the callback
    const result = await handleFarcasterCallback(fullUrl);

    // Send result to the callback page
    chrome.tabs.sendMessage(tabId, {
      type: "AUTH_CALLBACK_COMPLETE",
      success: !result.isError,
      error: result.message,
    });
  }
});

// Make sure this listener is active
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes("auth-callback.html")) {
    // Process the callback here
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Received message:", message.type);

  // Handle async responses
  const handleAsync = async () => {
    try {
      switch (message.type) {
        case "INITIATE_FARCASTER_AUTH":
          return await handleInitiateFarcasterAuth();

        case "CHECK_FARCASTER_AUTH":
          return await handleCheckFarcasterAuth();

        case "SIGN_OUT_FARCASTER":
          return await handleSignOutFarcaster();

        //   case 'CROSS_POST_TWEET':
        //     return await handleCrossPostTweet(message.data);

        //   case 'POST_CAST':
        //     return await handlePostCast(message.data);

        case "GET_AUTH_STATUS":
          return await getAuthStatus();

        default:
          return { success: false, error: "Unknown message type" };
      }
    } catch (error) {
      console.error("[Background] Error handling message:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Execute async handler and send response
  handleAsync()
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      console.error("[Background] Async handler error:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });

  // Return true to indicate we'll send a response asynchronously
  return true;
});

// Handle Farcaster authentication initiation
async function handleInitiateFarcasterAuth() {
  try {
    console.log("[Background] Initiating Farcaster authentication...");

    const result = await initiateFarcasterAuth();

    if (result.isError) {
      return {
        success: false,
        error: result.message || "Failed to initiate auth",
      };
    }

    return {
      success: true,
      url: result.url,
      message: "Authentication initiated successfully",
    };
  } catch (error) {
    console.error("[Background] Error initiating Farcaster auth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check current Farcaster authentication status
async function handleCheckFarcasterAuth() {
  try {
    const authStatus = await checkFarcasterAuth();

    return {
      success: true,
      isAuthenticated: authStatus.isAuthenticated,
      user: authStatus.user || null,
    };
  } catch (error) {
    console.error("[Background] Error checking Farcaster auth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handle Farcaster sign out
async function handleSignOutFarcaster() {
  try {
    await signOutFarcaster();

    return {
      success: true,
      message: "Successfully signed out from Farcaster",
    };
  } catch (error) {
    console.error("[Background] Error signing out from Farcaster:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handle cross-posting tweet to Farcaster
//   async function handleCrossPostTweet(data) {
//     try {
//       console.log('[Background] Cross-posting tweet to Farcaster:', data);

//       const authStatus = await checkFarcasterAuth();
//       if (!authStatus.isAuthenticated) {
//         return {
//           success: false,
//           error: 'Not authenticated with Farcaster'
//         };
//       }

//       // Prepare cast text with tweet reference
//       let castText = data.tweetText;

//       // Add tweet URL as embed if provided
//       const embeds = data.tweetUrl ? [data.tweetUrl] : undefined;

//       // Ensure cast text is within Farcaster's character limit (320 characters)
//       if (castText.length > 300) {
//         castText = castText.substring(0, 297) + '...';
//       }

//       const result = await postCast(castText, { embeds });

//       if (result.success) {
//         return {
//           success: true,
//           message: 'Successfully cross-posted to Farcaster',
//           castHash: result.hash
//         };
//       } else {
//         return {
//           success: false,
//           error: result.error || 'Failed to cross-post'
//         };
//       }

//     } catch (error) {
//       console.error('[Background] Error cross-posting tweet:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error'
//       };
//     }
//   }

// Handle posting a cast directly
//   async function handlePostCast(data) {
//     try {
//       console.log('[Background] Posting cast to Farcaster:', data);

//       const result = await postCast(data.text, {
//         embeds: data.embeds,
//         replyTo: data.replyTo,
//         channelId: data.channelId
//       });

//       return result;

//     } catch (error) {
//       console.error('[Background] Error posting cast:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error'
//       };
//     }
//   }

// Get comprehensive auth status
async function getAuthStatus() {
  try {
    const farcasterAuth = await checkFarcasterAuth();

    return {
      success: true,
      farcaster: {
        isAuthenticated: farcasterAuth.isAuthenticated,
        user: farcasterAuth.user || null,
      },
    };
  } catch (error) {
    console.error("[Background] Error getting auth status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handle auth callback from Neynar
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Check if this is a Neynar callback URL
    if (tab.url.includes(chrome.runtime.getURL("auth-callback.html"))) {
      try {
        console.log("[Background] Detected auth callback URL");

        const result = await handleFarcasterCallback(tab.url);

        // Close the auth tab
        chrome.tabs.remove(tabId);

        // Notify popup about auth completion
        chrome.runtime
          .sendMessage({
            type: "AUTH_CALLBACK_COMPLETE",
            success: !result.isError,
            error: result.isError ? result.message : null,
            user: result.data || null,
          })
          .catch((err) => {
            // Popup might not be open, which is fine
            console.log(
              "[Background] Could not notify popup (popup may be closed)"
            );
          });

        // Store auth completion status for popup to check
        chrome.storage.local.set({
          lastAuthResult: {
            success: !result.isError,
            error: result.isError ? result.message : null,
            user: result.data || null,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        console.error("[Background] Error handling auth callback:", error);

        // Close the auth tab
        chrome.tabs.remove(tabId);

        // Store error result
        chrome.storage.local.set({
          lastAuthResult: {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
          },
        });
      }
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  console.log("[Background] Extension icon clicked");
  // This will be handled by Plasmo's popup system
});

// Cleanup on extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  console.log("[Background] Extension suspending, cleaning up...");
  // Any cleanup tasks can go here
});

// Periodic auth token validation (every 30 minutes)
setInterval(async () => {
  try {
    const authStatus = await checkFarcasterAuth();
    if (!authStatus.isAuthenticated) {
      console.log("[Background] Token validation: User not authenticated");
    } else {
      console.log(
        "[Background] Token validation: User authenticated as",
        authStatus.user?.username
      );
    }
  } catch (error) {
    console.error("[Background] Error during periodic auth check:", error);
  }
}, 30 * 60 * 1000); // 30 minutes

// Export functions for testing or direct use
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleInitiateFarcasterAuth,
    handleCheckFarcasterAuth,
    handleSignOutFarcaster,
    //   handleCrossPostTweet,
    //   handlePostCast,
    getAuthStatus,
  };
}
