(function() {
    // Function to fetch auth token from Google metadata server
    async function fetchAuthToken() {
      try {
        // Check for local development mode
        const isLocalDev = window.location.hostname === 'localhost' || 
                           window.location.hostname.includes('127.0.0.1');
        
        // Check if we should use a local development token
        const useLocalDevToken = isLocalDev && 
                                 (window.REACT_APP_USE_LOCAL_AUTH === 'true' ||
                                  '%REACT_APP_USE_LOCAL_AUTH%' === 'true');
                                 
        if (isLocalDev && !useLocalDevToken) {
          console.log('Running in development environment, skipping auth token fetch');
          return;
        }
        
        if (useLocalDevToken) {
          // For local development with auth testing
          console.log('Using local development auth token');
          window.AUTH_TOKEN = window.REACT_APP_LOCAL_AUTH_TOKEN || 
                             '%REACT_APP_LOCAL_AUTH_TOKEN%' || 
                             'dev-token-for-testing';
          return;
        }
        
        console.log('Initializing ID token for service-to-service auth...');
        
        // In production Cloud Run, we need to use the server-side proxy approach
        // The server.js will handle this for us and provide the token via env-config.js
        
        // Wait for up to 2 seconds for the window.AUTH_TOKEN to be set by env-config.js
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkToken = () => {
          if (window.AUTH_TOKEN) {
            console.log('Authentication token loaded successfully');
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.warn('Timed out waiting for authentication token');
            return;
          }
          
          attempts++;
          setTimeout(checkToken, 100);
        };
        
        checkToken();
      } catch (error) {
        console.warn('Error setting up authentication:', error);
      }
    }
    
    // Execute immediately
    fetchAuthToken();
  })();