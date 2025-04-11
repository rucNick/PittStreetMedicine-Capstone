// File: Reset_Password.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Reset_Password = () => {
  const navigate = useNavigate();

  // Step control flow: 1 means "Enter email and request verification code", 2 means "Enter verification code and new password"
  const [step, setStep] = useState(1);

  // General state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // State required to request a CAPTCHA
  const [email, setEmail] = useState("");

  // Verify the CAPTCHA and update the state required for the password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // “Go Back to Login”
  const handleGoBack = () => {
    navigate('/');
  };

  // =============== Send the CAPTCHA ===============
  const handleRequestReset = async () => {
    setMessage("");
    setError("");
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    try {
      const response = await axios.post(`${baseURL}/api/auth/password/request-reset`, {
        email: email.trim()
      });
      console.log("handleRequestReset response:", response.data);
      // Even if the backend finds that email doesn't exist, it will return a 200, but it will say, "If your email address is registered, you will receive an email."
      if (response.data.status === "success") {
        setMessage(response.data.message);
        // next
        setStep(2);
      } else {
        //error
        setError(response.data.message || "Failed to send recovery code.");
      }
    } catch (err) {
      console.error("handleRequestReset error:", err);
      setError(err.response?.data?.message || "Failed to send recovery code.");
    }
  };

  // =============== Verify the CAPTCHA and update the password ===============
  const handleVerifyReset = async () => {
    setMessage("");
    setError("");
    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      setError("Email, OTP, and new password are required.");
      return;
    }
    try {
      const response = await axios.post(`${baseURL}/api/auth/password/verify-reset`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });
      console.log("handleVerifyReset response:", response.data);
      if (response.data.status === "success") {
        setMessage("Password reset successfully! You can go back to login now.");
      } else {
        setError(response.data.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error("handleVerifyReset error:", err);
      setError(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div style={styles.container}>
      {/* back to login */}
      <div style={styles.topBar}>
        <button style={styles.goBackButton} onClick={handleGoBack}>
          Go Back to Login
        </button>
      </div>

      <h2>Reset Your Password</h2>

      {/* base steps show different form */}
      {step === 1 && (
        <div style={styles.formContainer}>
          <h3>Step 1: Request a Recovery Code</h3>
          <label style={styles.label}>Email:</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
          />
          {error && <p style={styles.errorText}>{error}</p>}
          {message && <p style={styles.successText}>{message}</p>}
          <button style={styles.button} onClick={handleRequestReset}>
            Send Recovery Code
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={styles.formContainer}>
          <h3>Step 2: Enter OTP & New Password</h3>
          <label style={styles.label}>Email:</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Re-enter your email"
          />

          <label style={styles.label}>OTP (Recovery Code):</label>
          <input
            style={styles.input}
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the code you received"
          />

          <label style={styles.label}>New Password:</label>
          <input
            style={styles.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
          />

          {error && <p style={styles.errorText}>{error}</p>}
          {message && <p style={styles.successText}>{message}</p>}
          <button style={styles.button} onClick={handleVerifyReset}>
            Reset Password
          </button>
        </div>
      )}
    </div>
  );
};

// ======================== CSS ========================
const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f5f5f5'
  },
  topBar: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  goBackButton: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  formContainer: {
    display: 'inline-block',
    textAlign: 'left',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    marginTop: '40px',
  },
  label: {
    display: 'block',
    marginTop: '10px',
  },
  input: {
    width: '300px',
    padding: '8px',
    marginTop: '5px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    display: 'block',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  errorText: {
    color: 'red',
    margin: 0,
  },
  successText: {
    color: 'green',
    margin: 0,
  },
};

export default Reset_Password;
