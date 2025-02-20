import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // When the Login button in the top right corner is clicked, the login form (along with the logo) is displayed.
  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  // Register button
  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username,
        password,
      });
  
      if (response.data.authenticated) {
        setMessage('Login success！');
        console.log('User info:', response.data);
        // Pass the object, where response.data.userId is the numeric userId returned by the backend
        onLoginSuccess({ username: username, userId: response.data.userId });
      } else {
        setMessage('Login failure: ' + response.data.message);
      }
    } catch (error) {
      setMessage('Login error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={styles.background}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={styles.topRightContainer}>
        <button style={styles.topRightButton} onClick={handleLoginClick}>
          Login
        </button>
        <button style={styles.topRightButton} onClick={handleRegisterClick}>
          Register
        </button>
      </div>

      {/* The logo and Login form are displayed only when the Login button is clicked */}
      {showLoginForm && (
        <>
          <img src="/Untitled.png" alt="Logo" style={{...styles.logo, animation: 'fadeIn 0.5s ease-in-out'}} />

          <div style={{ ...styles.loginFormContainer, animation: 'fadeIn 0.5s ease-in-out' }}>
            <form style={styles.form} onSubmit={handleSubmit}>
              <h2>PITT STREET MEDICINE</h2>
              <div style={styles.formGroup}>
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <button type="submit" style={styles.button}>
                Login
              </button>
              <div style={styles.message}>{message}</div>
              {/* Small words, click to jump to the registration page */}
              <p style={styles.registerText} onClick={handleRegisterClick}>
                Don't have an account? Go to register
              </p>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  background: {
    height: '100vh',
    width: '100vw',
    backgroundImage: "url('/b874ff70095c9a00c8af981db87b998.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 80%',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    position: 'fixed',
    left: '450px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '380px',
    height: 'auto',
    zIndex: 998,
  },
  topRightContainer: {
    position: 'fixed',
    top: '0',
    right: '0',
    width: '100%',
    height: '60px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '20px',
    padding: '0 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  topRightButton: {
    padding: '10px 20px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
  },
  loginFormContainer: {
    position: 'fixed',
    right: '500px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px 0 0 8px',
    boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
    zIndex: 999,
  },
  form: {
    width: '300px',
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
  message: {
    marginTop: '1rem',
    color: '#ff4d4f',
    textAlign: 'center',
  },
  registerText: {
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '12px',
    color: '#1890ff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Login;
