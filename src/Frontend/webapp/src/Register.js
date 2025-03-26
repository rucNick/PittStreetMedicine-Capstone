import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Import the security functions from your ecdhClient.js file
import { 
  performKeyExchange, 
  encrypt, 
  decrypt, 
  getSessionId, 
  isInitialized 
} from './security/ecdhClient';

const Register = () => {
  const navigate = useNavigate();
  // Add state to track if security is initialized
  const [securityInitialized, setSecurityInitialized] = useState(false);

  // Initialize security on component mount
  useEffect(() => {
    const initSecurity = async () => {
      try {
        console.log("Initializing security for registration...");
        const result = await performKeyExchange();
        if (result.success) {
          console.log("Security initialized successfully for registration");
          setSecurityInitialized(true);
        } else {
          console.error("Failed to initialize security:", result.error);
        }
      } catch (error) {
        console.error("Error during security initialization:", error);
      }
    };

    initSecurity();
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Error status
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');

  // Check the format
  const validateUsername = () => {
    const usernameRegex = /^[A-Za-z]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameError('Usernames can only contain English letters');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validatePassword = () => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError('The password must be at least 8 digits long and contain both letters and numbers');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = () => {
    if (confirmPassword !== password) {
      setConfirmPasswordError('Two different passwords');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateEmail = () => {
    // If email is empty, consider it valid since it's optional
    if (!email.trim()) {
      setEmailError('');
      return true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('The email is not formatted correctly');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = () => {
    // If phone is empty, consider it valid since it's optional
    if (!phone.trim()) {
      setPhoneError('');
      return true;
    }
    
    // Mobile phone numbers are assumed to be 10 to 11 digits long
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('The format of the phone number is incorrect');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Modified submit handler for encrypted registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check in turn
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || 
        !isEmailValid || !isPhoneValid) {
      return;
    }

    // Prepare user data
    const userData = {
      username,
      password,
      role: "CLIENT"
    };
    
    // Only add email and phone if they're provided
    if (email.trim()) {
      userData.email = email;
    }
    if (phone.trim()) {
      userData.phone = phone;
    }

    try {
      // Use secure registration if security is initialized
      if (securityInitialized && isInitialized()) {
        console.log("Using secure encrypted registration");
        
        // Encrypt the user data
        const encryptedData = await encrypt(JSON.stringify(userData));
        
        // Send the encrypted registration request
        const response = await fetch('http://localhost:8080/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'X-Session-ID': getSessionId()
          },
          body: encryptedData
        });
        
        if (!response.ok) {
          throw new Error(`Registration failed: ${response.status}`);
        }
        
        // Get and decrypt the response
        const encryptedResponse = await response.text();
        const decryptedResponse = await decrypt(encryptedResponse);
        
        // Parse the JSON response
        const data = JSON.parse(decryptedResponse);
        
        if (data.status === 'success') {
          setMessage('Successful registration!');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setMessage(data.message || 'Registration failed');
        }
      } else {
        console.log("Using regular registration (no encryption)");
        
        // Use regular registration as fallback
        const response = await axios.post('http://localhost:8080/api/auth/register', userData);
        
        if (response.data.status === 'success') {
          setMessage('Successful registration!');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setMessage(response.data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  // "go back" button
  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div style={styles.container}>
      <button style={styles.goBackButton} onClick={handleGoBack}>
        go back
      </button>
      <h2>New Account</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label>Username: <span style={styles.requiredField}>*</span></label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={validateUsername}
            style={styles.input}
            required
          />
          {usernameError && <p style={styles.errorText}>{usernameError}</p>}
        </div>
        <div style={styles.formGroup}>
          <label>Password: <span style={styles.requiredField}>*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            style={styles.input}
            required
          />
          {passwordError && <p style={styles.errorText}>{passwordError}</p>}
        </div>
        <div style={styles.formGroup}>
          <label>Confirm Password: <span style={styles.requiredField}>*</span></label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={validateConfirmPassword}
            style={styles.input}
            required
          />
          {confirmPasswordError && <p style={styles.errorText}>{confirmPasswordError}</p>}
        </div>
        <div style={styles.formGroup}>
          <label>Email: <span style={styles.optionalField}>(Optional)</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            style={styles.input}
          />
          {emailError && <p style={styles.errorText}>{emailError}</p>}
        </div>
        <div style={styles.formGroup}>
          <label>Phone Number: <span style={styles.optionalField}>(Optional)</span></label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={validatePhone}
            style={styles.input}
          />
          {phoneError && <p style={styles.errorText}>{phoneError}</p>}
        </div>
        <button type="submit" style={styles.button}>
          Register
        </button>
        {message && <p style={styles.message}>{message}</p>}
      </form>
      
      {/* Display security status indicator (optional) */}
      {securityInitialized ? (
        <p style={{ color: 'green', fontSize: '12px', marginTop: '10px' }}>
          Secure connection established
        </p>
      ) : (
        <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>
          Establishing secure connection...
        </p>
      )}
    </div>
  );
};

//=========================================== CSS part ==============================================

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    paddingTop: '50px'
  },
  goBackButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  form: {
    width: '350px',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '4px',
  },
  message: {
    marginTop: '1rem',
    textAlign: 'center',
  },
  requiredField: {
    color: 'red',
    fontSize: '14px',
  },
  optionalField: {
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic',
  }
};

export default Register;