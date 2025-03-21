/**
 * Simple ECDH client for key exchange with the backend
 */
const crypto = window.crypto.subtle;

// Utility functions for Base64 conversion
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
    
    // Step 2: Initiate handshake with server
    console.log('Requesting server public key...');
    const response = await fetch('http://localhost:8080/api/security/initiate-handshake');
    
    if (!response.ok) {
      throw new Error(`Server handshake failed: ${response.status}`);
    }
    
    const data = await response.json();
    const sessionId = data.sessionId;
    const serverPublicKeyBase64 = data.serverPublicKey;
    
    console.log(`Received session ID: ${sessionId}`);
    console.log('Received server public key');
    
    // Step 3: Import server's public key
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
    
    // Step 4: Export client's public key
    const clientPublicKeyBytes = await crypto.exportKey('spki', keyPair.publicKey);
    const clientPublicKeyBase64 = arrayBufferToBase64(clientPublicKeyBytes);
    
    // Step 5: Complete handshake with server
    console.log('Completing handshake with server...');
    const completeResponse = await fetch('http://localhost:8080/api/security/complete-handshake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        clientPublicKey: clientPublicKeyBase64,
      }),
    });
    
    if (!completeResponse.ok) {
      throw new Error(`Handshake completion failed: ${completeResponse.status}`);
    }
    
    // Step 6: Derive shared secret
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