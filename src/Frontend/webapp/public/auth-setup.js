(function() {
    // Function to fetch auth token from Google metadata server
    async function fetchAuthToken() {
      try {
        // Only run in production environment (Cloud Run)
        if (window.location.hostname === 'localhost' || 
            window.location.hostname.includes('127.0.0.1')) {
          console.log('Running in development environment, skipping auth token fetch');
          return;
        }
        
        console.log('Fetching authentication token from metadata server...');
        
        // Get backend URL from environment or fallback
        const backendUrl = window.BACKEND_URL || 
                           window.REACT_APP_BASE_URL || 
                           'https://streetmed-backend-900663028964.us-central1.run.app';
        
        const metadataUrl = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=' + backendUrl;
        
        const response = await fetch(metadataUrl, {
          headers: {
            'Metadata-Flavor': 'Google'
          }
        });
        
        if (response.ok) {
          const token = await response.text();
          window.AUTH_TOKEN = token;
          console.log('Authentication token fetched successfully');
        } else {
          console.warn('Failed to fetch authentication token, status:', response.status);
        }
      } catch (error) {
        console.warn('Error fetching authentication token:', error);
        // Don't throw - allow the app to continue without authentication in development
      }
    }
    
    // Execute immediately
    fetchAuthToken();
  })();