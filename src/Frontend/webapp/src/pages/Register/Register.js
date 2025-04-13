import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  performKeyExchange,
  encrypt,
  decrypt,
  getSessionId,
  isInitialized
} from '../../security/ecdhClient';

import '../../css/Login/Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [securityInitialized, setSecurityInitialized] = useState(false);
  const baseURL = process.env.REACT_APP_BASE_URL;

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

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [message, setMessage] = useState('');

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
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
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
    if (!phone.trim()) {
      setPhoneError('');
      return true;
    }
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('The format of the phone number is incorrect');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const [step, setStep] = useState(1);

  const handleContinue = (e) => {
    e.preventDefault();

    const combinedName = firstName.trim() + lastName.trim();

    if (!combinedName) {
      setUsernameError('Please fill in first name and last name');
      return;
    }

    const usernameRegex = /^[A-Za-z]+$/;
    if (!usernameRegex.test(combinedName)) {
      setUsernameError('Usernames can only contain English letters');
      return;
    }
    setUsernameError('');

    if (!validateEmail() || !validatePhone()) {
      return;
    }

    setUsername(combinedName);

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isUsernameValid || !isPasswordValid || !isConfirmPasswordValid ||
      !isEmailValid || !isPhoneValid) {
      return;
    }

    const userData = {
      username,
      password,
      role: "CLIENT"
    };
    if (email.trim()) {
      userData.email = email;
    }
    if (phone.trim()) {
      userData.phone = phone;
    }

    try {
      if (securityInitialized && isInitialized()) {
        console.log("Using secure encrypted registration");
        const encryptedData = await encrypt(JSON.stringify(userData));
        const response = await fetch(`${baseURL}/api/auth/register`, {
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

        const encryptedResponse = await response.text();
        const decryptedResponse = await decrypt(encryptedResponse);
        const data = JSON.parse(decryptedResponse);

        if (data.status === 'success') {
          setMessage('Successful registration!');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          setMessage(data.message || 'Registration failed');
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.response?.data?.message || error.message || 'Registration failed');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="signup-page-container">
      <header className="site-header">
        <div className="logo-container">
          <img src="/Untitled.png" alt="Site Logo" className="logo" />
          <h2 className="site-title">Street Med Go</h2>
        </div>
        <button className="go-back-btn" onClick={handleGoBack}>
          Go Back
        </button>
      </header>

      <button className="go-back-btn" onClick={handleGoBack}>
        Go back
      </button>

      {/* step 1 */}
      {step === 1 && (
        <div className="signup-container">
          <div className="signup-card">
            <h2 className="signup-title">Sign Up</h2>
            <form onSubmit={handleContinue}>
              <div className="input-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="divider"><span>Or</span></div>

              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {usernameError && <p className="error-text">{usernameError}</p>}
              {emailError && <p className="error-text">{emailError}</p>}
              {phoneError && <p className="error-text">{phoneError}</p>}

              <button type="submit" className="signup-btn">
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* step 2 */}
      {step === 2 && (
        <div className="signup-container">
          <div className="signup-card">
            <h2 className="signup-title">Welcome, {firstName}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {passwordError && <p className="error-text">{passwordError}</p>}

              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPasswordError && (
                <p className="error-text">{confirmPasswordError}</p>
              )}

              <button type="submit" className="signup-btn">
                Sign up
              </button>

              {message && <p className="success-text">{message}</p>}

              {securityInitialized ? (
                <p className="security-indicator success">Secure connection established</p>
              ) : (
                <p className="security-indicator fail">Establishing secure connection...</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
