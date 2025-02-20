import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import Register from "./Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ username: "", userId: null });

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setUserData(data);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData({ username: "", userId: null });
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Home username={userData.username} userId={userData.userId} onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
