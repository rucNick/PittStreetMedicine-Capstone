// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { encrypt, decrypt, getSessionId, isInitialized } from "../../security/ecdhClient";
import "../../css/Login/Login.css";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const baseURL = process.env.REACT_APP_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isInitialized()) {
        console.log("Using secure login with encryption");

        const loginData = { username, password };

        const encryptedData = await encrypt(JSON.stringify(loginData));

        const response = await fetch(`${baseURL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            "X-Session-ID": getSessionId(),
          },
          body: encryptedData,
        });

        const encryptedResponse = await response.text();
        const decryptedResponse = await decrypt(encryptedResponse);
        const data = JSON.parse(decryptedResponse);

        if (data.authenticated) {
          setMessage("Login success!");
          console.log("User info:", data);

          localStorage.setItem(
            "auth_user",
            JSON.stringify({
              username: data.username,
              userId: data.userId,
              role: data.role,
            })
          );

          onLoginSuccess({
            username: data.username,
            userId: data.userId,
            role: data.role,
          });
          navigate("/");
        } else {
          throw new Error(data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Login error: " + error.message);
    }
  };

  const handleResetPasswordClick = (e) => {
    e.preventDefault();
    navigate("/reset_password");
  };

  const handleSignUpClick = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleGoBack = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="page-container">
      <header className="site-header">
        <div className="logo-container">
          <img src="/Untitled.png" alt="Site Logo" className="logo" />
          <h2 className="site-title">Street Med Go</h2>
        </div>
        <button className="go-back-btn" onClick={handleGoBack}>
          Go Back
        </button>
      </header>

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Login</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email or Phone</label>
              <input
                type="text"
                id="email"
                name="email"
                placeholder="Email or Phone"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <a href="#!" className="forgot-password" onClick={handleResetPasswordClick}>
              Forgot Password?
            </a>

            {message && (
              <div className="message" style={{ color: "red", textAlign: "center", fontSize: "0.9rem", marginBottom: "1rem" }}>
                {message}
              </div>
            )}

            <button type="submit" className="login-btn login-btn-login">
              Log in
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button type="button" className="login-btn login-btn-signup" onClick={handleSignUpClick}>
              Sign up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
