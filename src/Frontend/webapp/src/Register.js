import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('The email is not formatted correctly');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePhone = () => {
    // Mobile phone numbers are assumed to be 10 to 11 digits long
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('The format of the phone number is incorrect');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check in turn
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || !isEmailValid || !isPhoneValid) {
      return;
    }

    // Send to the backend
    const userData = {
      username,
      password,
      email,
      phone,
      role: "CLIENT"
    };

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', userData);
      if (response.data.status === 'success') {
        setMessage('Successful registration！');
        // After 2 seconds you will be redirected back to the login page
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(response.data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
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
          <label>Username:</label>
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
          <label>Password:</label>
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
          <label>Confirm Password:</label>
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
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            style={styles.input}
            required
          />
          {emailError && <p style={styles.errorText}>{emailError}</p>}
        </div>
        <div style={styles.formGroup}>
          <label>Phone Number:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={validatePhone}
            style={styles.input}
            required
          />
          {phoneError && <p style={styles.errorText}>{phoneError}</p>}
        </div>
        <button type="submit" style={styles.button}>
          Register
        </button>
        {message && <p style={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

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
  }
};

export default Register;
