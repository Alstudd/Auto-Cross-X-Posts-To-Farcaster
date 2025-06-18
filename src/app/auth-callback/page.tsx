import "@/lib/auth-callback";

export default function AuthCallback() {
  return (
    <>
      <div className="container">
        <div id="loading-state">
          <div className="spinner"></div>
          <h1>Completing Authentication</h1>
          <p>Please wait while we finalize your Farcaster connection...</p>
        </div>

        <div id="success-state" style={{ display: "none" }}>
          <div className="icon">✅</div>
          <h1 className="success">Authentication Successful!</h1>
          <p>Your Farcaster account has been connected successfully.</p>
          <p className="close-info">This window will close automatically.</p>
        </div>

        <div id="error-state" style={{ display: "none" }}>
          <div className="icon">❌</div>
          <h1 className="error">Authentication Failed</h1>
          <p id="error-message">Something went wrong during authentication.</p>
          <p className="close-info">
            Please try again from the extension popup.
          </p>
        </div>
      </div>
      {/* <script>
        // Handle the OAuth callback and communicate with the background script
        (function() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            if (!code) {
    const decodedUrl = decodeURIComponent(window.location.href);
    const decodedParams = new URLSearchParams(new URL(decodedUrl).search);
    code = decodedParams.get('code');
    state = decodedParams.get('state');
}
            
            console.log('[Auth Callback] Processing callback with params:', { 
                hasCode: !!code, 
                hasState: !!state, 
                error 
            });
            
            // Show loading state initially
            document.getElementById('loading-state').style.display = 'block';
            
            // Function to show success state
            function showSuccess() {
                document.getElementById('loading-state').style.display = 'none';
                document.getElementById('success-state').style.display = 'block';
                
                // Close window after 3 seconds
                setTimeout(() => {
                    window.close();
                }, 3000);
            }
            
            // Function to show error state
            function showError(message) {
                document.getElementById('loading-state').style.display = 'none';
                document.getElementById('error-state').style.display = 'block';
                document.getElementById('error-message').textContent = message;
                
                // Close window after 10 seconds
                setTimeout(() => {
                    window.close();
                }, 10000);
            }
            
            // Handle error from OAuth provider
            if (error) {
                console.error('[Auth Callback] OAuth error:', error);
                showError(`Authentication error: ${error}`);
                return;
            }
            
            // Check if we have required parameters
            if (!code || !state) {
                console.error('[Auth Callback] Missing required parameters');
                showError('Missing authentication parameters. Please try again.');
                return;
            }
            
            // The background script will handle the actual callback processing
            // when it detects this URL change via chrome.tabs.onUpdated
            
            // Listen for messages from background script
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'AUTH_CALLBACK_COMPLETE') {
                    if (message.success) {
                        console.log('[Auth Callback] Authentication successful');
                        showSuccess();
                    } else {
                        console.error('[Auth Callback] Authentication failed:', message.error);
                        showError(message.error || 'Authentication failed');
                    }
                }
            });
            
            // Fallback: Check for auth result in storage after a delay
            setTimeout(async () => {
                try {
                    const result = await chrome.storage.local.get(['lastAuthResult']);
                    if (result.lastAuthResult && Date.now() - result.lastAuthResult.timestamp < 30000) {
                        if (result.lastAuthResult.success) {
                            showSuccess();
                        } else {
                            showError(result.lastAuthResult.error || 'Authentication failed');
                        }
                        
                        // Clear the result after processing
                        chrome.storage.local.remove(['lastAuthResult']);
                    }
                } catch (error) {
                    console.error('[Auth Callback] Error checking auth result:', error);
                    showError('Error processing authentication result');
                }
            }, 2000);
            
            // Additional fallback: close window after 30 seconds if nothing happens
            setTimeout(() => {
                console.log('[Auth Callback] Timeout reached, closing window');
                window.close();
            }, 30000);
            
        })();
    </script> */}
    </>
  );
}
