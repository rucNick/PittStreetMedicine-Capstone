import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // Callback for successful login
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  // Logout callback
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
  };

  return (
    <Router>
      <Routes>
        {/* root path, which displays the Home or Login page depending on the login status */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Home username={username} onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        {/* register */}
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
