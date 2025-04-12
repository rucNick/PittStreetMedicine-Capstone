/**
 * Enhanced ECDH client for secure key exchange with the backend
 */
const crypto = window.crypto.subtle;
const baseURL = process.env.REACT_APP_BASE_URL;

// Utility functions for Base64 conversion
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const securityContext = {
  sessionId: null,
  sharedSecret: null,
  aesKey: null,
  initialized: false
};

export const base64ToArrayBuffer = (base64) => {
  try {
    // Make sure the base64 string is properly padded
    const paddedBase64 = base64.replace(/=+$/, '');
    const paddingNeeded = paddedBase64.length % 4;
    const correctlyPaddedBase64 = paddingNeeded > 0 
      ? paddedBase64 + '='.repeat(4 - paddingNeeded) 
      : paddedBase64;
    
    // Decode the base64 string
    const binaryString = atob(correctlyPaddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Base64 decoding error:', error);
    console.error('Problematic base64 string:', base64);
    throw error;
  }
};

/**
 * Creates a client signature for authentication
 * Uses HMAC-SHA256 to sign a timestamp with the client secret
 */
const createClientSignature = async (timestamp) => {
  try {
    // Get the client ID and secret from window (set by auth-setup.js)
    const clientId = window.CLIENT_ID || 'default-client-id';
    
    // Generate a signature using the current timestamp
    const encoder = new TextEncoder();
    const data = encoder.encode(`${clientId}:${timestamp}`);
    
    // Use a static key for development purposes
    // In production, this should be securely managed
    const devKey = encoder.encode('street-med-client-authentication-key');
    
    // Import the key for HMAC signing
    const key = await crypto.importKey(
      'raw',
      devKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Create the signature
    const signature = await crypto.sign('HMAC', key, data);
    
    // Return as Base64
    return arrayBufferToBase64(signature);
  } catch (error) {
    console.error('Error creating client signature:', error);
    return null;
  }
};

/**
 * Performs the ECDH key exchange with the backend
 */
export const performKeyExchange = async () => {
  console.log('Starting ECDH key exchange...');
  
  try {
    // Step 1: Generate client key pair
    console.log('Generating client key pair...');
    const keyPair = await crypto.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
    
    // Step 2: Prepare client authentication
    const timestamp = Date.now().toString();
    const clientId = window.CLIENT_ID || 'default-client-id';
    const signature = await createClientSignature(timestamp);
    
    console.log('Prepared client authentication');
    
    // Step 3: Initiate handshake with server
    console.log('Requesting server public key...');
    
    // Prepare headers with client authentication
    const headers = {
      'X-Client-ID': clientId,
      'X-Timestamp': timestamp
    };
    
    // Add signature if available
    if (signature) {
      headers['X-Signature'] = signature;
      console.log('Added client authentication signature');
    } else {
      console.warn('Client authentication signature unavailable');
    }
    
    const response = await fetch(`${baseURL}/api/security/initiate-handshake`, {
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Server handshake failed: ${response.status}`);
    }
    
    const data = await response.json();
    const sessionId = data.sessionId;
    const serverPublicKeyBase64 = data.serverPublicKey;
    
    console.log(`Received session ID: ${sessionId}`);
    console.log('Received server public key');
    
    // Step 4: Import server's public key
    const serverPublicKeyBytes = base64ToArrayBuffer(serverPublicKeyBase64);
    const serverPublicKey = await crypto.importKey(
      'spki',
      serverPublicKeyBytes,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
    
    // Step 5: Export client's public key
    const clientPublicKeyBytes = await crypto.exportKey('spki', keyPair.publicKey);
    const clientPublicKeyBase64 = arrayBufferToBase64(clientPublicKeyBytes);
    
    // Step 6: Complete handshake with server
    console.log('Completing handshake with server...');
    
    // Generate new timestamp and signature for this request
    const completeTimestamp = Date.now().toString();
    const completeSignature = await createClientSignature(completeTimestamp);
    
    // Include client authentication in the complete-handshake request
    const completeHeaders = {
      'Content-Type': 'application/json',
      'X-Client-ID': clientId,
      'X-Timestamp': completeTimestamp
    };
    
    if (completeSignature) {
      completeHeaders['X-Signature'] = completeSignature;
    }
    
    const completeResponse = await fetch(`${baseURL}/api/security/complete-handshake`, {
      method: 'POST',
      headers: completeHeaders,
      body: JSON.stringify({
        sessionId,
        clientPublicKey: clientPublicKeyBase64,
      }),
    });
    
    if (!completeResponse.ok) {
      throw new Error(`Handshake completion failed: ${completeResponse.status}`);
    }
    
    // Step 7: Derive shared secret
    console.log('Deriving shared secret...');
    const sharedSecret = await crypto.deriveBits(
      {
        name: 'ECDH',
        public: serverPublicKey,
      },
      keyPair.privateKey,
      256
    );
    
    // Convert shared secret to hex for logging
    const bytes = new Uint8Array(sharedSecret);
    const hexSharedSecret = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('ECDH key exchange completed successfully!');
    console.log(`Session ID: ${sessionId}`);
    console.log(`Shared Secret (hex): ${hexSharedSecret}`);
    
    // Initialize the AES key for encryption/decryption
    const aesKey = await initializeAESKey(sharedSecret);
    
    // Set up the security context
    securityContext.sessionId = sessionId;
    securityContext.sharedSecret = sharedSecret;
    securityContext.aesKey = aesKey;
    securityContext.initialized = true;
    
    return {
      success: true,
      sessionId,
      sharedSecret
    };
  } catch (error) {
    console.error('ECDH key exchange failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Initialize AES key from the shared secret
 */
export const initializeAESKey = async (sharedSecret) => {
  if (!sharedSecret) {
    throw new Error('No shared secret available');
  }
  
  // Compute SHA-256 hash of the shared secret to match the server's key derivation
  const hashBuffer = await crypto.digest('SHA-256', sharedSecret);
  
  // Import the hashed shared secret as an AES-GCM key
  const aesKey = await crypto.importKey(
    'raw',
    hashBuffer,
    {
      name: 'AES-GCM',
      length: 256
    },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
  
  return aesKey;
};

/**
 * Encrypt data using AES-GCM
 */
export const encrypt = async (data) => {
  if (!securityContext.initialized || !securityContext.aesKey) {
    throw new Error('Security context not initialized');
  }
  
  try {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encodedData = new TextEncoder().encode(data);
    const encryptedData = await crypto.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      securityContext.aesKey,
      encodedData
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.byteLength + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.byteLength);
    
    // Convert to Base64
    return arrayBufferToBase64(result);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
};

/**
 * Decrypt data using AES-GCM
 */
export const decrypt = async (encryptedData) => {
  if (!securityContext.initialized || !securityContext.aesKey) {
    throw new Error('Security context not initialized');
  }
  
  try {
    // Decode Base64
    const encryptedBytes = base64ToArrayBuffer(encryptedData);
    
    // Extract IV (first 12 bytes)
    const iv = encryptedBytes.slice(0, 12);
    
    // Extract ciphertext
    const ciphertext = encryptedBytes.slice(12);
    
    // Decrypt data
    const decryptedData = await crypto.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      securityContext.aesKey,
      ciphertext
    );
    
    // Convert to string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
};

/**
 * Get the current session ID
 */
export const getSessionId = () => {
  return securityContext.sessionId;
};

/**
 * Check if security is initialized
 */
export const isInitialized = () => {
  return securityContext.initialized;
};

/**
 * Performs an encrypted API call with client authentication
 */
export const secureApiCall = async (url, method, data) => {
  if (!isInitialized()) {
    throw new Error('Security context not initialized. Cannot make secure API call.');
  }
  
  try {
    // Add client authentication
    const timestamp = Date.now().toString();
    const clientId = window.CLIENT_ID || 'default-client-id';
    const signature = await createClientSignature(timestamp);
    
    // Encrypt the request data
    const encryptedData = await encrypt(JSON.stringify(data));
    
    // Prepare headers with client authentication and session ID
    const headers = {
      'Content-Type': 'text/plain',
      'X-Session-ID': getSessionId(),
      'X-Client-ID': clientId,
      'X-Timestamp': timestamp
    };
    
    if (signature) {
      headers['X-Signature'] = signature;
    }
    
    // Make the request with the headers
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: encryptedData
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    
    // Get the encrypted response
    const encryptedResponse = await response.text();
    
    // Decrypt the response
    const decryptedResponse = await decrypt(encryptedResponse);
    
    // Parse and return the response
    return JSON.parse(decryptedResponse);
  } catch (error) {
    console.error('Secure API call failed:', error);
    throw error;
  }
};