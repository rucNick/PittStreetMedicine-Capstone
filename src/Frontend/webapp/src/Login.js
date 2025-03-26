//=========================================== JS part ==============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encrypt, decrypt, getSessionId, isInitialized } from './security/ecdhClient';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';

  // show login form
  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  // jump to register
  const handleRegisterClick = () => {
    navigate('/register');
  };

  // continue as guest
  const handleGuestClick = () => {
    onLoginSuccess({ username: "Guest", userId: -1 });  // guest user_id = -1
    navigate('/guest');
  };

  // go to volunteer
  const handleVolunteerClick = () => {
    navigate('/volunteerAppli');
  };

  // handle reset password
  const handleResetPasswordClick = () => {
    navigate('/reset_password');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      if (isInitialized()) {
        console.log("Using secure login with encryption");
        
        // Prepare login data
        const loginData = { username, password };
        
        // Encrypt the login data
        const encryptedData = await encrypt(JSON.stringify(loginData));
        
        // Send the encrypted login request
        const response = await fetch(`${baseURL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'X-Session-ID': getSessionId()
          },
          body: encryptedData
        });
        
        if (!response.ok) {
          throw new Error(`Login failed: ${response.status}`);
        }
        
        // Get and decrypt the response
        const encryptedResponse = await response.text();
        const decryptedResponse = await decrypt(encryptedResponse);
        
        // Parse the JSON response
        const data = JSON.parse(decryptedResponse);
        
        // Process the login result
        if (data.authenticated) {
          setMessage("Login success!");
          console.log("User info:", data);
          
          // Persist the authentication state in localStorage
          localStorage.setItem("auth_user", JSON.stringify({
            username: data.username,
            userId: data.userId,
            role: data.role
          }));
          
          // Pass user data to the parent component
          onLoginSuccess({
            username: data.username,
            userId: data.userId,
            role: data.role
          });
        } else {
          setMessage("Login failure: " + (data.message || "Unknown error"));
        }
      } 
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Login error: " + (error.response?.data?.message || error.message));
    }
  };
  

//=========================================== HTML part ==============================================

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
        <div style={styles.topLeftText}>Street Med Go Delivery service</div>
        <div style={styles.buttonContainer}>
          <button style={styles.topRightButton} onClick={handleLoginClick}>
            Login
          </button>
          <button style={styles.topRightButton} onClick={handleRegisterClick}>
            Register
          </button>
        </div>
      </div>

      {/* The logo and Login form are displayed only when the Login button is clicked */}
      {showLoginForm && (
        <>
          <img 
            src="/Untitled.png" 
            alt="Logo" 
            style={{ ...styles.logo, animation: 'fadeIn 0.5s ease-in-out' }} 
          />

          <div style={{ ...styles.loginFormContainer, animation: 'fadeIn 0.5s ease-in-out' }}>
            <form style={styles.form} onSubmit={handleSubmit}>
              <h2>Street Med at PITT</h2>
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
              {/* add guest button */}
              <div style={styles.separator}>
                <hr style={styles.hr} />
                <span style={styles.orText}>or</span>
                <hr style={styles.hr} />
              </div>
              <div style={styles.guestContainer}>
                <button style={styles.guestButton} onClick={handleGuestClick}>
                  Continue as a guest
                </button>
              </div>

              {/* add volunteer button */}
              <div style={styles.separator}>
                <hr style={styles.hr} />
                <span style={styles.orText}>or</span>
                <hr style={styles.hr} />
              </div>
              <p style={styles.volunteerText}>Want to be a volunteer?</p>
              <div style={styles.volunteerContainer}>
                <button style={styles.volunteerButton} onClick={handleVolunteerClick}>
                  LET‘s GO！！！！！！!
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {/* Bottom right container: "forgot your password?" & "reset your password" button */}
      <div style={styles.bottomRightContainer}>
        <p style={styles.forgotText}>Forgot your password?</p>
        <button style={styles.resetButton} onClick={handleResetPasswordClick}>
          Reset your password
        </button>
      </div>
    </div>
  );
};

//=========================================== CSS part ==============================================

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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    padding: '0 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  topLeftText: {
    fontSize: '35px',
    fontWeight: 'bold',
    color: 'white',
    marginLeft: '35px'
  },
  buttonContainer: {
    display: 'flex',
    gap: '10px', 
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
  separator: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '1rem',
  },
  hr: {
    flex: 1,
    border: 'none',
    borderTop: '1px solid #ccc',
  },
  orText: {
    margin: '0 10px',
    fontSize: '12px',
    color: '#888',
  },
  guestContainer: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  guestButton: {
    padding: '8px 16px',
    backgroundColor: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  volunteerText: {
    marginTop: '1rem',
    textAlign: 'center',
    fontSize: '12px',
    color: '#1890ff',
  },
  volunteerContainer: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  volunteerButton: {
    padding: '8px 16px',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  bottomRightContainer: {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  forgotText: {
    margin: 0,
    padding: 0,
    fontSize: '12px',
    color: '#000',
    marginBottom: '5px',
  },
  resetButton: {
    padding: '6px 12px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default Login;
